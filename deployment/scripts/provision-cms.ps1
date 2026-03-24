<#
.SYNOPSIS
    Provisions Azure infrastructure for Strapi 5 CMS.

.DESCRIPTION
    Creates:
    - Azure Database for MySQL Flexible Server
    - Azure Blob Storage account + container for media uploads
    - Azure Container App for Strapi 5
    - Container App Environment (reuses existing if present)

    Estimated monthly cost: ~$10-15 (free MySQL tier for 12 months, then ~$13/mo)

.PARAMETER ProjectName
    Short project name (matches the projectName Bicep parameter). Required.

.PARAMETER ResourceGroup
    Azure Resource Group (default: rg-<ProjectName>-prod)

.PARAMETER MysqlAdminPassword
    Password for MySQL admin user. REQUIRED. Store securely (Key Vault / env var).

.EXAMPLE
    ./deployment/scripts/provision-cms.ps1 -ProjectName myapp -MysqlAdminPassword "YourSecurePass123!"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,

    [string]$ResourceGroup        = '',
    [string]$Location             = 'centralus',
    [string]$ContainerRegistry    = '',
    [string]$CmsImage             = 'accelerator-cms',
    [string]$MysqlServerName      = '',
    [string]$MysqlAdminUser       = 'strapiAdmin',
    # MySQL Flexible Server is not available in centralus; francecentral confirmed working
    [string]$MysqlLocation        = 'francecentral',
    [Parameter(Mandatory=$true)]
    [string]$MysqlAdminPassword,
    [string]$StorageAccountName   = '',
    [string]$StorageContainer     = 'strapi-media',
    [string]$ContainerAppEnv      = '',
    [string]$CmsContainerApp      = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Derive defaults from ProjectName
if (-not $ResourceGroup)      { $ResourceGroup = "rg-$ProjectName-prod" }
if (-not $ContainerAppEnv)    { $ContainerAppEnv = "cae-$ProjectName-prod" }
if (-not $CmsContainerApp)    { $CmsContainerApp = "ca-$ProjectName-cms-prod" }
if (-not $MysqlServerName)    { $MysqlServerName = "mysql-$ProjectName-cms" }

# ACR name uses uniqueString — discover it from the resource group
if (-not $ContainerRegistry) {
    $ContainerRegistry = az acr list --resource-group $ResourceGroup --query "[0].name" -o tsv 2>$null
    if (-not $ContainerRegistry) {
        Write-Host "ERROR: No ACR found in $ResourceGroup. Run infrastructure/deploy.ps1 first." -ForegroundColor Red
        exit 1
    }
}

# Storage account name uses uniqueString — discover or use convention
if (-not $StorageAccountName) {
    $StorageAccountName = az storage account list --resource-group $ResourceGroup --query "[0].name" -o tsv 2>$null
    if (-not $StorageAccountName) {
        # Will be created fresh
        $StorageAccountName = "st${ProjectName}media$(Get-Random -Maximum 99999)"
    }
}

function Log-Step { param([string]$msg) Write-Host "`n> $msg" -ForegroundColor Cyan }
function Log-Ok   { param([string]$msg) Write-Host "  OK $msg" -ForegroundColor Green }
function Log-Info { param([string]$msg) Write-Host "  . $msg" -ForegroundColor Gray }

# -- 0. Verify logged in ---------------------------------------------------
Log-Step "Verifying Azure CLI login"
$account = az account show --query name -o tsv 2>$null
if (-not $account) {
    Write-Error "Not logged in. Run: az login"
    exit 1
}
Log-Ok "Logged in as: $account"

# -- 1. MySQL Flexible Server ----------------------------------------------
Log-Step "Creating MySQL Flexible Server: $MysqlServerName"
$mysqlExists = az mysql flexible-server show `
    --resource-group $ResourceGroup `
    --name $MysqlServerName `
    --query name -o tsv 2>$null

if ($mysqlExists -and $LASTEXITCODE -eq 0) {
    Log-Info "MySQL server already exists -- skipping creation"
} else {
    az mysql flexible-server create `
        --resource-group $ResourceGroup `
        --name $MysqlServerName `
        --location $MysqlLocation `
        --admin-user $MysqlAdminUser `
        --admin-password $MysqlAdminPassword `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 20 `
        --storage-auto-grow Disabled `
        --auto-scale-iops Disabled `
        --version 8.0.21 `
        --public-access 0.0.0.0 `
        --yes

    Log-Ok "MySQL server created"
}

Log-Step "Creating database: strapi_cms"
az mysql flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $MysqlServerName `
    --database-name strapi_cms 2>$null
Log-Ok "Database ready"

Log-Step "Configuring MySQL firewall"
az mysql flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $MysqlServerName `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 2>$null
Log-Ok "Firewall rule set"

$mysqlHost = az mysql flexible-server show `
    --resource-group $ResourceGroup `
    --name $MysqlServerName `
    --query fullyQualifiedDomainName -o tsv

Log-Info "MySQL host: $mysqlHost"

# -- 2. Azure Blob Storage -------------------------------------------------
Log-Step "Creating Storage Account: $StorageAccountName"
$storageExists = az storage account show `
    --resource-group $ResourceGroup `
    --name $StorageAccountName `
    --query name -o tsv 2>$null

if ($storageExists -and $LASTEXITCODE -eq 0) {
    Log-Info "Storage account already exists -- skipping creation"
} else {
    az storage account create `
        --resource-group $ResourceGroup `
        --name $StorageAccountName `
        --location $Location `
        --sku Standard_LRS `
        --kind StorageV2 `
        --access-tier Hot `
        --allow-blob-public-access true
    Log-Ok "Storage account created"
}

$storageKey = az storage account keys list `
    --resource-group $ResourceGroup `
    --account-name $StorageAccountName `
    --query "[0].value" -o tsv

az storage container create `
    --account-name $StorageAccountName `
    --account-key $storageKey `
    --name $StorageContainer `
    --public-access blob 2>$null
Log-Ok "Blob container '$StorageContainer' ready (public blob read)"

$storageUrl = "https://$StorageAccountName.blob.core.windows.net"

# -- 3. Container App for Strapi -------------------------------------------
Log-Step "Creating Strapi Container App: $CmsContainerApp"

$appKeys      = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
$apiTokenSalt = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
$adminJwt     = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
$transferSalt = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
$jwtSecret    = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))

$cmsExists = az containerapp show `
    --resource-group $ResourceGroup `
    --name $CmsContainerApp `
    --query name -o tsv 2>$null

if ($cmsExists -and $LASTEXITCODE -eq 0) {
    Log-Info "Container App already exists -- updating image"
    az containerapp update `
        --resource-group $ResourceGroup `
        --name $CmsContainerApp `
        --image "$ContainerRegistry.azurecr.io/${CmsImage}:latest"
} else {
    az containerapp create `
        --resource-group $ResourceGroup `
        --name $CmsContainerApp `
        --environment $ContainerAppEnv `
        --image "$ContainerRegistry.azurecr.io/${CmsImage}:latest" `
        --registry-server "$ContainerRegistry.azurecr.io" `
        --target-port 1337 `
        --ingress external `
        --min-replicas 0 `
        --max-replicas 2 `
        --cpu 0.25 `
        --memory 0.5Gi `
        --env-vars `
            "DATABASE_CLIENT=mysql" `
            "DATABASE_HOST=$mysqlHost" `
            "DATABASE_PORT=3306" `
            "DATABASE_NAME=strapi_cms" `
            "DATABASE_USERNAME=$MysqlAdminUser" `
            "DATABASE_PASSWORD=secretref:db-password" `
            "DATABASE_SSL=true" `
            "APP_KEYS=secretref:app-keys" `
            "API_TOKEN_SALT=secretref:api-token-salt" `
            "ADMIN_JWT_SECRET=secretref:admin-jwt-secret" `
            "TRANSFER_TOKEN_SALT=secretref:transfer-token-salt" `
            "JWT_SECRET=secretref:jwt-secret" `
            "AZURE_STORAGE_ACCOUNT=$StorageAccountName" `
            "AZURE_STORAGE_ACCOUNT_KEY=secretref:storage-key" `
            "AZURE_STORAGE_CONTAINER=$StorageContainer" `
            "AZURE_STORAGE_URL=$storageUrl" `
            "NODE_ENV=production" `
        --secrets `
            "db-password=$MysqlAdminPassword" `
            "app-keys=$appKeys" `
            "api-token-salt=$apiTokenSalt" `
            "admin-jwt-secret=$adminJwt" `
            "transfer-token-salt=$transferSalt" `
            "jwt-secret=$jwtSecret" `
            "storage-key=$storageKey"
    Log-Ok "Container App created"
}

# -- 4. Set PUBLIC_URL once FQDN is known ----------------------------------
$cmsFqdn = az containerapp show `
    --resource-group $ResourceGroup `
    --name $CmsContainerApp `
    --query properties.configuration.ingress.fqdn -o tsv 2>$null

Log-Step "Setting PUBLIC_URL = https://$cmsFqdn"
az containerapp update `
    --resource-group $ResourceGroup `
    --name $CmsContainerApp `
    --set-env-vars "PUBLIC_URL=https://$cmsFqdn" | Out-Null
Log-Ok "PUBLIC_URL set"

# -- 5. Summary ------------------------------------------------------------
Log-Step "Provisioning complete"
Write-Host ""
Write-Host "  MySQL Host   : $mysqlHost" -ForegroundColor White
Write-Host "  Storage URL  : $storageUrl" -ForegroundColor White
Write-Host "  Strapi CMS   : https://$cmsFqdn" -ForegroundColor White
Write-Host "  Admin Panel  : https://$cmsFqdn/admin" -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "   1. Build and push CMS image:" -ForegroundColor Yellow
Write-Host "      az acr login --name $ContainerRegistry" -ForegroundColor Yellow
Write-Host "      docker build --target production -t $ContainerRegistry.azurecr.io/${CmsImage}:latest ./cms" -ForegroundColor Yellow
Write-Host "      docker push $ContainerRegistry.azurecr.io/${CmsImage}:latest" -ForegroundColor Yellow
Write-Host "   2. Open admin panel: https://$cmsFqdn/admin" -ForegroundColor Yellow
Write-Host "      POST /admin/register-admin to create the first admin user" -ForegroundColor Yellow
Write-Host "   3. Create a read-only API token in the admin panel" -ForegroundColor Yellow
Write-Host "   4. Add to Next.js Container App env vars:" -ForegroundColor Yellow
Write-Host "      STRAPI_URL=https://$cmsFqdn" -ForegroundColor Yellow
Write-Host "      STRAPI_API_TOKEN=[read-only token from step 3]" -ForegroundColor Yellow
Write-Host "   5. Seed: STRAPI_URL=https://$cmsFqdn npx tsx cms/data/seed.ts" -ForegroundColor Yellow
Write-Host ""
