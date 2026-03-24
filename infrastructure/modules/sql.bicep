// sql.bicep — Azure SQL Serverless (GP_S_Gen5_1, auto-pause 15 min)
// Firewall: Azure services rule only. Developer IPs are set manually.

@description('Short project name used as a prefix in resource names')
param projectName string

@description('Azure region for all resources')
param location string

@description('SQL Server admin password')
@secure()
param sqlAdminPassword string

@description('Log Analytics workspace resource ID for diagnostic settings (empty = diagnostics disabled)')
param logAnalyticsId string = ''

@description('Resource tags applied to all resources in this module')
param tags object

// SQL Server names must be globally unique.
var sqlServerName = 'sql-${projectName}-${uniqueString(resourceGroup().id)}'
var sqlAdminLogin = '${projectName}-admin'

// ── SQL Server ────────────────────────────────────────────────────────────────

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Allow Azure services to access the server
resource firewallAllowAzure 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── SQL Database (Serverless) ─────────────────────────────────────────────────

resource sqlDb 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: 'sqldb-${projectName}-prod'
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 1073741824 // 1 GiB (increase when needed)
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false
    readScale: 'Disabled'
    autoPauseDelay: 15 // minutes
    minCapacity: json('0.5')
    requestedBackupStorageRedundancy: 'Local'
  }
}

// ── SQL Backup Short-Term Retention (7 days) ──────────────────────────────────

resource sqlBackupPolicy 'Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies@2022-05-01-preview' = {
  parent: sqlDb
  name: 'default'
  properties: {
    retentionDays: 7
    diffBackupIntervalInHours: 24
  }
}

// ── Resource Lock (CanNotDelete) ──────────────────────────────────────────────

resource sqlServerLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'sql-server-delete-lock'
  scope: sqlServer
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of SQL Server and its databases'
  }
}

// ── SQL Diagnostic Settings (conditional — only when Log Analytics ID provided) ─

resource sqlDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'sql-diagnostics'
  scope: sqlDb
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'SQLSecurityAuditEvents'
        enabled: true
      }
      {
        category: 'DevOpsOperationsAudit'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'Basic'
        enabled: true
      }
      {
        category: 'InstanceAndAppAdvanced'
        enabled: true
      }
    ]
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('SQL Server fully qualified domain name')
output sqlFqdn string = sqlServer.properties.fullyQualifiedDomainName
