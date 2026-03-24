// acr.bicep — Azure Container Registry
// No dependencies on other modules.

@description('Short project name used as a prefix in resource names')
param projectName string

@description('Azure region for all resources')
param location string

@description('Resource tags applied to all resources in this module')
param tags object

// ACR names must be globally unique, 5-50 chars, alphanumeric only.
// Using a hash of the resource group ID for uniqueness.
var acrName = '${projectName}acr${uniqueString(resourceGroup().id)}'

// ── Container Registry ────────────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('ACR login server hostname (e.g. myprojectacrXXXXXX.azurecr.io)')
output acrLoginServer string = acr.properties.loginServer

@description('ACR resource ID (for managed identity pull role assignment)')
output acrResourceId string = acr.id
