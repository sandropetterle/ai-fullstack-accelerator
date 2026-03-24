# Configure Container Apps to pull images from Azure Container Registry
# Uses system-assigned managed identity (no ACR admin credentials needed).
#
# Usage:
# .\deployment\configure-acr-access.ps1 -ProjectName myapp
# .\deployment\configure-acr-access.ps1 -ProjectName myapp -ResourceGroup rg-myapp-prod

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = '',

    [Parameter(Mandatory=$false)]
    [string]$AcrName = ''
)

$ErrorActionPreference = "Stop"

if (-not $ResourceGroup) { $ResourceGroup = "rg-$ProjectName-prod" }

# Discover ACR name if not provided (it's generated with uniqueString)
if (-not $AcrName) {
    $AcrName = az acr list --resource-group $ResourceGroup --query "[0].name" -o tsv
    if (-not $AcrName) {
        Write-Host "ERROR: No ACR found in $ResourceGroup. Deploy infrastructure first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[INFO] Resource Group : $ResourceGroup" -ForegroundColor Cyan
Write-Host "[INFO] ACR Name       : $AcrName" -ForegroundColor Cyan
Write-Host ""

$acrId = az acr show --name $AcrName --query id -o tsv

function Configure-ContainerApp {
    param([string]$AppName)

    Write-Host "[INFO] Configuring: $AppName" -ForegroundColor Yellow

    $ca = az containerapp show --name $AppName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json

    if (-not $ca) {
        Write-Host "  SKIP: Container App '$AppName' not found" -ForegroundColor Gray
        return
    }

    if (-not $ca.identity -or -not $ca.identity.principalId) {
        Write-Host "  Enabling system-assigned managed identity..."
        az containerapp identity assign --name $AppName --resource-group $ResourceGroup --system-assigned | Out-Null
        Start-Sleep -Seconds 5
        $ca = az containerapp show --name $AppName --resource-group $ResourceGroup | ConvertFrom-Json
    }

    $principalId = $ca.identity.principalId
    Write-Host "  Managed identity: $principalId" -ForegroundColor Gray

    $existing = az role assignment list --assignee $principalId --scope $acrId --query "[?roleDefinitionName=='AcrPull']" | ConvertFrom-Json
    if ($existing.Count -eq 0) {
        az role assignment create --assignee $principalId --role AcrPull --scope $acrId | Out-Null
        Write-Host "  [OK] AcrPull role assigned" -ForegroundColor Green
    } else {
        Write-Host "  [OK] AcrPull role already assigned" -ForegroundColor Yellow
    }

    az containerapp registry set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --server "$AcrName.azurecr.io" `
        --identity "system" | Out-Null

    Write-Host "  [OK] Registry configured" -ForegroundColor Green
}

Configure-ContainerApp -AppName "ca-$ProjectName-api-prod"
Configure-ContainerApp -AppName "ca-$ProjectName-web-prod"
Configure-ContainerApp -AppName "ca-$ProjectName-cms-prod"

Write-Host ""
Write-Host "[OK] All Container Apps configured to pull from $AcrName.azurecr.io" -ForegroundColor Green
