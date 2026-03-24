# ============================================================================
# GitHub OIDC Setup - Automated Script
# AI Fullstack Accelerator - Configure OIDC Authentication for GitHub Actions
# ============================================================================
#
# This script automates the setup of an Azure AD application and federated
# credentials for GitHub Actions OIDC authentication (keyless auth).
#
# Prerequisites:
# 1. Azure CLI installed and logged in (az login)
# 2. Owner or Contributor role on Azure subscription
# 3. Permissions to create Azure AD applications
#
# Usage:
# .\deployment\setup-github-oidc.ps1 -RepoOwner "your-github-user" -RepoName "your-repo-name"
#
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoOwner,

    [Parameter(Mandatory=$true)]
    [string]$RepoName,

    [Parameter(Mandatory=$false)]
    [string]$ProjectName = '',

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = ''
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

# Infer project name and resource group if not provided
if (-not $ProjectName) {
    $ProjectName = $RepoName.ToLower() -replace '[^a-z0-9]', ''
    if ($ProjectName.Length -gt 12) { $ProjectName = $ProjectName.Substring(0, 12) }
}
if (-not $ResourceGroup) {
    $ResourceGroup = "rg-$ProjectName-prod"
}

$APP_NAME = "github-$ProjectName-deploy"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

# ============================================================================
# VALIDATION
# ============================================================================

Write-Step "Validating Prerequisites"

# Check Azure CLI
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Success "Azure CLI version: $($azVersion.'azure-cli')"
} catch {
    Write-Host "Azure CLI is not installed. Please install from: https://aka.ms/InstallAzureCLI" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Success "Logged in as: $($account.user.name)"
    Write-Info "Subscription: $($account.name)"
} catch {
    Write-Host "Not logged in to Azure. Please run: az login" -ForegroundColor Red
    exit 1
}

$SUBSCRIPTION_ID = $account.id
$TENANT_ID = $account.tenantId

Write-Success "Subscription ID: $SUBSCRIPTION_ID"
Write-Success "Tenant ID: $TENANT_ID"

# Check if resource group exists
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "Resource group '$ResourceGroup' not found. Create it first:" -ForegroundColor Red
    Write-Host "  az group create --name $ResourceGroup --location centralus" -ForegroundColor Yellow
    exit 1
}
Write-Success "Resource group found: $ResourceGroup"

# ============================================================================
# CREATE OR UPDATE AZURE AD APPLICATION
# ============================================================================

Write-Step "Setting Up Azure AD Application"

$existingApp = az ad app list --display-name $APP_NAME --query "[0].appId" --output tsv 2>$null

if ($existingApp) {
    Write-Info "Application '$APP_NAME' already exists"
    $APP_ID = $existingApp
} else {
    az ad app create --display-name $APP_NAME --output none
    $APP_ID = az ad app list --display-name $APP_NAME --query "[0].appId" --output tsv
    Write-Success "Application created: $APP_NAME"
}

Write-Success "Application ID: $APP_ID"

# ============================================================================
# CREATE SERVICE PRINCIPAL
# ============================================================================

Write-Step "Setting Up Service Principal"

$existingSp = az ad sp list --display-name $APP_NAME --query "[0].id" --output tsv 2>$null

if ($existingSp) {
    Write-Info "Service Principal already exists"
    $SP_OBJECT_ID = $existingSp
} else {
    az ad sp create --id $APP_ID --output none
    $SP_OBJECT_ID = az ad sp list --display-name $APP_NAME --query "[0].id" --output tsv
    Write-Success "Service Principal created"
}

Write-Success "Service Principal Object ID: $SP_OBJECT_ID"

# ============================================================================
# ASSIGN PERMISSIONS
# ============================================================================

Write-Step "Assigning Azure Permissions"

$existingRole = az role assignment list `
    --assignee $SP_OBJECT_ID `
    --role Contributor `
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$ResourceGroup" `
    --query "[0].id" `
    --output tsv 2>$null

if ($existingRole) {
    Write-Info "Contributor role already assigned"
} else {
    az role assignment create `
        --assignee $SP_OBJECT_ID `
        --role Contributor `
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$ResourceGroup" `
        --output none
    Write-Success "Contributor role assigned to resource group"
}

# ============================================================================
# CONFIGURE FEDERATED CREDENTIALS
# ============================================================================

Write-Step "Configuring Federated Credentials (OIDC)"

function Set-FederatedCredential {
    param(
        [string]$Name,
        [string]$Subject,
        [string]$Description
    )

    $existing = az ad app federated-credential list --id $APP_ID --query "[?name=='$Name'].name" --output tsv 2>$null

    if ($existing) {
        Write-Info "Federated credential '$Name' already exists"
    } else {
        $credentialJson = @{
            name        = $Name
            issuer      = "https://token.actions.githubusercontent.com"
            subject     = $Subject
            description = $Description
            audiences   = @("api://AzureADTokenExchange")
        } | ConvertTo-Json -Compress

        $tempFile = [System.IO.Path]::GetTempFileName()
        $credentialJson | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

        try {
            az ad app federated-credential create --id $APP_ID --parameters "@$tempFile" --output none
            Write-Success "Federated credential created: $Name"
        } finally {
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        }
    }
}

Set-FederatedCredential `
    -Name "github-main-branch" `
    -Subject "repo:$RepoOwner/${RepoName}:ref:refs/heads/main" `
    -Description "GitHub Actions - main branch deployments"

Set-FederatedCredential `
    -Name "github-pull-requests" `
    -Subject "repo:$RepoOwner/${RepoName}:pull_request" `
    -Description "GitHub Actions - pull request builds"

# ============================================================================
# DISPLAY GITHUB SECRETS
# ============================================================================

Write-Step "GitHub Secrets Configuration"

Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ADD THESE SECRETS TO YOUR GITHUB REPOSITORY" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Repository: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "1. AZURE_CLIENT_ID" -ForegroundColor Yellow
Write-Host "   Value: $APP_ID" -ForegroundColor White
Write-Host ""
Write-Host "2. AZURE_TENANT_ID" -ForegroundColor Yellow
Write-Host "   Value: $TENANT_ID" -ForegroundColor White
Write-Host ""
Write-Host "3. AZURE_SUBSCRIPTION_ID" -ForegroundColor Yellow
Write-Host "   Value: $SUBSCRIPTION_ID" -ForegroundColor White
Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "See .github/REPO_VARIABLES.md for the full list of required secrets and variables." -ForegroundColor Cyan
Write-Host ""

Write-Step "Setup Complete"

Write-Host "✓ Azure AD Application configured" -ForegroundColor Green
Write-Host "✓ Service Principal created" -ForegroundColor Green
Write-Host "✓ Contributor role assigned" -ForegroundColor Green
Write-Host "✓ Federated credentials configured" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add the three Azure secrets to GitHub (see above)" -ForegroundColor White
Write-Host "2. Add remaining secrets from .github/REPO_VARIABLES.md" -ForegroundColor White
Write-Host "3. Set repository variables (AZURE_CONTAINER_APP, RESOURCE_GROUP, etc.)" -ForegroundColor White
Write-Host "4. Push to main branch to trigger CI/CD" -ForegroundColor White
