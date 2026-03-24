// keyvault.bicep — Azure Key Vault (RBAC mode, no secrets stored in Bicep)
// Secrets are set post-deploy via: az keyvault secret set
// Role assignment for Container App managed identity is done in main.bicep
// after containerApps module outputs the principal IDs.

@description('Short project name used as a prefix in resource names')
param projectName string

@description('Azure region for all resources')
param location string

@description('Resource tags applied to all resources in this module')
param tags object

@description('Log Analytics workspace resource ID for KV audit diagnostics (empty = diagnostics disabled)')
param logAnalyticsId string = ''

// KV names must be globally unique, 3-24 chars.
var kvName = 'kv-${projectName}-${uniqueString(resourceGroup().id)}'

// ── Key Vault ─────────────────────────────────────────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: kvName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
  }
}

// ── KV Diagnostic Settings (conditional — only when Log Analytics ID provided) ─

resource kvDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'kv-diagnostics'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
      }
    ]
  }
}

// ── Resource Lock (CanNotDelete) ──────────────────────────────────────────────

resource kvLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'kv-delete-lock'
  scope: keyVault
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of Key Vault and its secrets'
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('Key Vault name')
output kvName string = keyVault.name

@description('Key Vault resource ID')
output kvResourceId string = keyVault.id
