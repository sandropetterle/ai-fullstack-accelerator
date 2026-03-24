// cms.bicep — MySQL Flexible Server + Blob Storage for Strapi CMS
// MySQL deployed to francecentral (MySQL Flexible Server not available in centralus).
// Storage Account deployed to centralus by default.

@description('Short project name used as a prefix in resource names')
param projectName string

@description('Azure region for MySQL (francecentral recommended — MySQL Flexible Server not in centralus)')
param location string = 'francecentral'

@description('Azure region for Storage Account')
param storageLocation string = 'centralus'

@description('MySQL admin password')
@secure()
param mysqlAdminPassword string

@description('Resource tags applied to all resources in this module')
param tags object

var mysqlServerName = 'mysql-${projectName}-cms'
var storageAccountName = 'st${projectName}media${uniqueString(resourceGroup().id)}'
var mysqlAdminLogin = 'strapiAdmin'

// ── MySQL Flexible Server ─────────────────────────────────────────────────────

resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-06-30' = {
  name: mysqlServerName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminLogin
    administratorLoginPassword: mysqlAdminPassword
    version: '8.0.21'
    storage: {
      storageSizeGB: 20
      autoGrow: 'Disabled'
    }
    backup: {
      backupRetentionDays: 14
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-06-30' = {
  parent: mysqlServer
  name: 'strapi_cms'
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_unicode_ci'
  }
}

// Enforce SSL on all MySQL connections
resource mysqlSslConfig 'Microsoft.DBforMySQL/flexibleServers/configurations@2023-06-30' = {
  parent: mysqlServer
  name: 'require_secure_transport'
  properties: {
    value: 'ON'
    source: 'user-override'
  }
}

// Allow Azure services
resource mysqlFirewallAzure 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-06-30' = {
  parent: mysqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── Storage Account + Blob Container ─────────────────────────────────────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: storageLocation
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true // Required for Strapi media public serving
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  parent: storageAccount
  name: 'default'
}

resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  parent: blobService
  name: 'strapi-media'
  properties: {
    publicAccess: 'Blob' // Public read for media files
  }
}

// ── Resource Locks (CanNotDelete) ────────────────────────────────────────────

resource mysqlLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'mysql-delete-lock'
  scope: mysqlServer
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of MySQL CMS database'
  }
}

resource storageLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'storage-delete-lock'
  scope: storageAccount
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of Strapi media storage'
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('MySQL server fully qualified domain name')
output mysqlFqdn string = mysqlServer.properties.fullyQualifiedDomainName

@description('Storage account name for Strapi media')
output storageAccountName string = storageAccount.name
