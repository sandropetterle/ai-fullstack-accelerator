// containerAppsEnvironment.bicep — Container Apps Environment linked to Log Analytics
// Depends on: monitoring module (logAnalyticsCustomerId + logAnalyticsId)

@description('Short project name used as a prefix in resource names')
param projectName string

@description('Azure region for all resources')
param location string

@description('Log Analytics workspace customer ID')
param logAnalyticsCustomerId string

@description('Log Analytics workspace resource ID')
param logAnalyticsId string

@description('Resource tags applied to all resources in this module')
param tags object

// ── Container Apps Environment ────────────────────────────────────────────────

resource cae 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${projectName}-prod'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: listKeys(logAnalyticsId, '2022-10-01').primarySharedKey
      }
    }
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('Container Apps Environment resource ID')
output caeId string = cae.id
