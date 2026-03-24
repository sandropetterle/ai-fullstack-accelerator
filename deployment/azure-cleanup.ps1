# ============================================================================
# Azure Resource Cleanup Script
# AI Fullstack Accelerator - Remove All Azure Resources
# ============================================================================
#
# WARNING: This script will DELETE all Azure resources in the resource group!
# This action is IRREVERSIBLE and will result in DATA LOSS.
#
# Use this script when:
# - You want to stop all Azure charges
# - You're done testing and want to clean up
# - You need to start fresh with new resources
#
# Usage:
# .\deployment\azure-cleanup.ps1 -ResourceGroup "rg-myapp-prod" -Confirm
#
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,

    [Parameter(Mandatory=$false)]
    [switch]$Confirm
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "⚠️  AZURE RESOURCE DELETION WARNING" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""
Write-Host "You are about to DELETE the following resource group:" -ForegroundColor Yellow
Write-Host "  → $ResourceGroup" -ForegroundColor White
Write-Host ""
Write-Host "This will permanently delete ALL resources including:" -ForegroundColor Yellow
Write-Host "  • SQL Server and Database (ALL DATA WILL BE LOST)" -ForegroundColor Red
Write-Host "  • Container Apps (API, Web, CMS)" -ForegroundColor Red
Write-Host "  • Container Registry (all images)" -ForegroundColor Red
Write-Host "  • Application Insights (all telemetry data)" -ForegroundColor Red
Write-Host "  • Key Vault (all secrets)" -ForegroundColor Red
Write-Host "  • MySQL Server and Storage Account" -ForegroundColor Red
Write-Host ""
Write-Host "This action CANNOT be undone!" -ForegroundColor Red
Write-Host ""

if (-not $Confirm) {
    Write-Host "To confirm deletion, run this script with -Confirm flag:" -ForegroundColor Yellow
    Write-Host "  .\deployment\azure-cleanup.ps1 -ResourceGroup '$ResourceGroup' -Confirm" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Check if logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Cyan
    Write-Host "Subscription: $($account.name)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Not logged in to Azure. Please run: az login" -ForegroundColor Red
    exit 1
}

$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "✓ Resource group '$ResourceGroup' does not exist (nothing to delete)" -ForegroundColor Green
    exit 0
}

# List resources that will be deleted
Write-Host "Fetching resources in resource group..." -ForegroundColor Cyan
$resources = az resource list --resource-group $ResourceGroup --output json | ConvertFrom-Json

if ($resources.Count -eq 0) {
    Write-Host "No resources found in resource group." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "The following resources will be deleted:" -ForegroundColor Yellow
    Write-Host ""
    foreach ($resource in $resources) {
        Write-Host "  • $($resource.type): $($resource.name)" -ForegroundColor White
    }
    Write-Host ""
}

# Final confirmation
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "Type 'DELETE' to confirm deletion: " -ForegroundColor Red -NoNewline
$userInput = Read-Host

if ($userInput -ne "DELETE") {
    Write-Host ""
    Write-Host "Deletion cancelled. No resources were deleted." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Starting resource deletion..." -ForegroundColor Yellow
Write-Host ""

try {
    az group delete `
        --name $ResourceGroup `
        --yes `
        --no-wait

    Write-Host "✓ Resource group deletion initiated: $ResourceGroup" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deletion is running in the background (this may take 5-10 minutes)." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To check deletion status:" -ForegroundColor Cyan
    Write-Host "  az group exists --name $ResourceGroup" -ForegroundColor White
    Write-Host ""
    Write-Host "When it returns 'false', deletion is complete." -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error during deletion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "All Azure charges for these resources will stop once deletion completes." -ForegroundColor Green
Write-Host ""
