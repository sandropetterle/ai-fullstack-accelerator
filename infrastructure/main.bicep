// main.bicep — Infrastructure orchestrator for AI Fullstack Accelerator
// Calls all modules in dependency order.
//
// CRITICAL: Always deploy with --mode Incremental (never Complete).
// Complete mode would delete resources not in this template (e.g. DNS records, manual configs).
//
// Deploy via: infrastructure/deploy.ps1

@description('Short project name used as a prefix in all resource names (lowercase, no spaces, ≤12 chars)')
@minLength(2)
@maxLength(12)
param projectName string

@description('Azure region for all resources (default: centralus)')
@allowed(['centralus', 'eastus', 'eastus2', 'westus2'])
param location string = 'centralus'

@description('Environment name suffix used in resource names')
@allowed(['prod', 'staging', 'dev'])
param environment string = 'prod'

@description('SQL Server administrator password')
@minLength(12)
@secure()
param sqlAdminPassword string

@description('MySQL administrator password')
@minLength(12)
@secure()
param mysqlAdminPassword string

@description('Email address for alert notifications (empty = alerts fire but no notifications sent)')
param alertEmail string = ''

@description('Public API base URL for the frontend app (set after first deploy)')
param apiBaseUrl string = ''

@description('Azure Entra External ID OIDC issuer URL (or other OIDC provider)')
param authEntraIssuer string = ''

@description('Azure Entra External ID frontend client ID')
param authEntraClientId string = ''

@description('Auth.js API scope for read access')
param authApiScopeRead string = ''

@description('Auth.js API scope for write access')
param authApiScopeWrite string = ''

@description('Strapi CMS Container App FQDN (set after first deploy)')
param strapiUrl string = ''

// ── Resource Tags ─────────────────────────────────────────────────────────────

var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
}

// ── 1. Monitoring (no dependencies) ──────────────────────────────────────────

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    projectName: projectName
    location: location
    environment: environment
    alertEmail: alertEmail
    tags: tags
  }
}

// ── 2. ACR (no dependencies) ─────────────────────────────────────────────────

module acr 'modules/acr.bicep' = {
  name: 'acr'
  params: {
    projectName: projectName
    location: location
    tags: tags
  }
}

// ── 3. Key Vault (depends on monitoring for diagnostic settings) ──────────────
// Secrets are NOT stored in Bicep. Set them post-deploy:
//   az keyvault secret set --vault-name <kvName> --name sql-connection-string --value "..."

module keyvault 'modules/keyvault.bicep' = {
  name: 'keyvault'
  params: {
    projectName: projectName
    location: location
    tags: tags
    logAnalyticsId: monitoring.outputs.logAnalyticsId
  }
}

// ── 4. SQL (depends on monitoring for diagnostic settings) ───────────────────

module sql 'modules/sql.bicep' = {
  name: 'sql'
  params: {
    projectName: projectName
    location: location
    sqlAdminPassword: sqlAdminPassword
    logAnalyticsId: monitoring.outputs.logAnalyticsId
    tags: tags
  }
}

// ── 5. CMS — MySQL + Storage (no dependencies, separate region) ──────────────

module cms 'modules/cms.bicep' = {
  name: 'cms'
  params: {
    projectName: projectName
    mysqlAdminPassword: mysqlAdminPassword
    tags: tags
  }
}

// ── 6. Container Apps Environment (depends on monitoring) ────────────────────

module cae 'modules/containerAppsEnvironment.bicep' = {
  name: 'containerAppsEnvironment'
  params: {
    projectName: projectName
    location: location
    logAnalyticsCustomerId: monitoring.outputs.logAnalyticsCustomerId
    logAnalyticsId: monitoring.outputs.logAnalyticsId
    tags: tags
  }
}

// ── 7. Container Apps (depends on cae, acr, keyvault, monitoring) ────────────

module containerApps 'modules/containerApps.bicep' = {
  name: 'containerApps'
  params: {
    projectName: projectName
    location: location
    caeId: cae.outputs.caeId
    acrLoginServer: acr.outputs.acrLoginServer
    acrResourceId: acr.outputs.acrResourceId
    kvName: keyvault.outputs.kvName
    apiBaseUrl: apiBaseUrl
    authEntraIssuer: authEntraIssuer
    authEntraClientId: authEntraClientId
    authApiScopeRead: authApiScopeRead
    authApiScopeWrite: authApiScopeWrite
    strapiUrl: strapiUrl
    tags: tags
  }
}

// ── 8. KV role assignment: Key Vault Secrets User → each Container App ───────
// Defined here (not in keyvault.bicep) to avoid circular dependency between
// keyvault and containerApps modules.
//
// Role assignment names use guid() with plan-time-known string literals only
// (BCP120: name must be calculable at deployment start, not from runtime outputs).

var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource kvSecretsUserApi 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, keyvault.outputs.kvName, '${projectName}-api-${environment}', kvSecretsUserRoleId)
  scope: resourceGroup()
  properties: {
    principalId: containerApps.outputs.apiPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource kvSecretsUserWeb 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, keyvault.outputs.kvName, '${projectName}-web-${environment}', kvSecretsUserRoleId)
  scope: resourceGroup()
  properties: {
    principalId: containerApps.outputs.webPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource kvSecretsUserCms 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, keyvault.outputs.kvName, '${projectName}-cms-${environment}', kvSecretsUserRoleId)
  scope: resourceGroup()
  properties: {
    principalId: containerApps.outputs.cmsPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}
