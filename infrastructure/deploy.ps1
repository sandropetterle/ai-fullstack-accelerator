# deploy.ps1 — Deploy AI Fullstack Accelerator infrastructure via Bicep
#
# CRITICAL: Always uses --mode Incremental (never Complete).
# Complete mode would delete resources not in this template.
#
# Prerequisites:
#   - Azure CLI: az login
#   - Bicep: az bicep install
#   - Contributor role on the resource group
#   - Copy main.parameters.template.json to main.parameters.prod.json
#   - Replace all TODO_ placeholders in main.parameters.prod.json
#
# Usage:
#   ./infrastructure/deploy.ps1                              # validate + what-if + deploy
#   ./infrastructure/deploy.ps1 -WhatIf                      # validate + what-if only (no deploy)
#   ./infrastructure/deploy.ps1 -ResourceGroup rg-myapp-prod # override resource group

param(
    [switch]$WhatIf,
    [string]$ResourceGroup = '',
    [string]$ParametersFile = ''
)

$ErrorActionPreference = 'Stop'
$TemplateFile = "$PSScriptRoot/main.bicep"

# Auto-detect parameters file
if (-not $ParametersFile) {
    $ParametersFile = "$PSScriptRoot/main.parameters.prod.json"
}
if (-not (Test-Path $ParametersFile)) {
    Write-Host "ERROR: Parameters file not found: $ParametersFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create it by copying the template:"
    Write-Host "  cp infrastructure/main.parameters.template.json infrastructure/main.parameters.prod.json"
    Write-Host "  # Edit main.parameters.prod.json and replace all TODO_ placeholders"
    exit 1
}

# Auto-detect resource group from parameters file
if (-not $ResourceGroup) {
    # Try to extract projectName from parameters file and infer rg name
    $params = Get-Content $ParametersFile | Where-Object { $_ -notmatch '^\s*//' } | ConvertFrom-Json
    $projectName = $params.parameters.projectName.value
    if ($projectName -and $projectName -ne 'TODO_PROJECT_NAME') {
        $ResourceGroup = "rg-$projectName-prod"
    } else {
        Write-Host "ERROR: Set projectName in $ParametersFile or pass -ResourceGroup" -ForegroundColor Red
        exit 1
    }
}

$DeploymentName = "accelerator-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "=== AI Fullstack Accelerator — Infrastructure Deploy ===" -ForegroundColor Cyan
Write-Host "  Resource Group : $ResourceGroup"
Write-Host "  Parameters     : $ParametersFile"
Write-Host ""

# ── Step 1: Validate (az bicep build compiles to ARM JSON locally) ────────────

Write-Host "Step 1/4: Validating Bicep templates..." -ForegroundColor Yellow
az bicep build --file $TemplateFile
if ($LASTEXITCODE -ne 0) { throw "Bicep validation failed." }
Write-Host "  ✓ Templates valid" -ForegroundColor Green
Write-Host ""

# ── Step 2: What-if (show planned changes before applying) ───────────────────

Write-Host "Step 2/4: Running what-if (preview changes)..." -ForegroundColor Yellow
az deployment group what-if `
    --resource-group $ResourceGroup `
    --template-file $TemplateFile `
    --parameters @$ParametersFile `
    --mode Incremental

if ($LASTEXITCODE -ne 0) { throw "What-if failed." }
Write-Host ""

if ($WhatIf) {
    Write-Host "  --WhatIf flag set. Stopping before deploy." -ForegroundColor Cyan
    exit 0
}

# ── Step 3: Confirm ───────────────────────────────────────────────────────────

Write-Host "Step 3/4: Review the what-if output above." -ForegroundColor Yellow
$confirm = Read-Host "Proceed with deployment? (yes/no)"
if ($confirm -ne 'yes') {
    Write-Host "  Deployment cancelled." -ForegroundColor Red
    exit 0
}
Write-Host ""

# ── Step 4: Deploy ────────────────────────────────────────────────────────────

Write-Host "Step 4/4: Deploying ($DeploymentName)..." -ForegroundColor Yellow
az deployment group create `
    --name $DeploymentName `
    --resource-group $ResourceGroup `
    --template-file $TemplateFile `
    --parameters @$ParametersFile `
    --mode Incremental `
    --output table

if ($LASTEXITCODE -ne 0) { throw "Deployment failed." }

Write-Host ""
Write-Host "  ✓ Deployment complete: $DeploymentName" -ForegroundColor Green
Write-Host ""
Write-Host "  Post-deploy checklist:" -ForegroundColor Cyan
Write-Host "  1. Get the Key Vault name from the deployment outputs:"
Write-Host "       az deployment group show -n $DeploymentName -g $ResourceGroup --query properties.outputs"
Write-Host "  2. Set Key Vault secrets:"
Write-Host "       az keyvault secret set --vault-name <kvName> --name sql-connection-string --value '...'"
Write-Host "       az keyvault secret set --vault-name <kvName> --name appinsights-connection-string --value '...'"
Write-Host "       az keyvault secret set --vault-name <kvName> --name auth-secret --value '...'"
Write-Host "       az keyvault secret set --vault-name <kvName> --name auth-entra-client-secret --value '...'"
Write-Host "       az keyvault secret set --vault-name <kvName> --name auth-authority --value '...'"
Write-Host "       az keyvault secret set --vault-name <kvName> --name auth-audience --value '...'"
Write-Host "       az keyvault secret set --vault-name <kvName> --name strapi-api-token --value '...'"
Write-Host "  3. Get Container App URLs and update main.parameters.prod.json:"
Write-Host "       az containerapp show -n ca-${projectName}-api-prod -g $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv"
Write-Host "  4. Re-run deploy to set apiBaseUrl and strapiUrl parameters."
Write-Host "  5. CI/CD will update image tags automatically on next push to main."
