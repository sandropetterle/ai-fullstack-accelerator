<#
.SYNOPSIS
    One-shot setup script for the AI Fullstack Accelerator.

.DESCRIPTION
    Run this once after cloning (and optionally after rename-entity.ps1).

    Steps:
      1. npm install            (installs frontend dependencies)
      2. dotnet restore         (restores backend NuGet packages)
      3. dotnet ef database update  (creates/migrates the SQLite database)

.EXAMPLE
    .\scripts\setup-project.ps1
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Resolve repo root relative to this script's location
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "======================================================"
Write-Host " AI Fullstack Accelerator - Project Setup"
Write-Host "======================================================"
Write-Host ""
Write-Host " Repo root: $RepoRoot"
Write-Host ""

# ---------------------------------------------------------------------------
# Step 1: npm install
# ---------------------------------------------------------------------------
Write-Host "------------------------------------------------------"
Write-Host " Step 1 of 3: Installing frontend dependencies (npm install)"
Write-Host "------------------------------------------------------"

Push-Location $RepoRoot
try {
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host " Frontend dependencies installed."
Write-Host ""

# ---------------------------------------------------------------------------
# Step 2: dotnet restore
# ---------------------------------------------------------------------------
Write-Host "------------------------------------------------------"
Write-Host " Step 2 of 3: Restoring backend NuGet packages (dotnet restore)"
Write-Host "------------------------------------------------------"

Push-Location (Join-Path $RepoRoot "backend")
try {
    & dotnet restore
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host " Backend packages restored."
Write-Host ""

# ---------------------------------------------------------------------------
# Step 3: dotnet ef database update
# ---------------------------------------------------------------------------
Write-Host "------------------------------------------------------"
Write-Host " Step 3 of 3: Applying database migrations (dotnet ef database update)"
Write-Host "------------------------------------------------------"

Push-Location $RepoRoot
try {
    & dotnet ef database update `
        --project "backend/src/Accelerator.Data" `
        --startup-project "backend/src/Accelerator.Api"
    if ($LASTEXITCODE -ne 0) { throw "dotnet ef database update failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host " Database migrated and ready."
Write-Host ""

# ---------------------------------------------------------------------------
# Success
# ---------------------------------------------------------------------------
Write-Host "======================================================"
Write-Host " Setup complete!"
Write-Host ""
Write-Host " Next steps:"
Write-Host ""
Write-Host "   Start the backend API:"
Write-Host "     dotnet run --project backend/src/Accelerator.Api"
Write-Host "     (Swagger UI available at http://localhost:5255/swagger)"
Write-Host ""
Write-Host "   Start the frontend:"
Write-Host "     npm run dev"
Write-Host "     (App available at http://localhost:3000)"
Write-Host ""
Write-Host "   (Optional) Start the CMS:"
Write-Host "     docker compose --profile cms up -d"
Write-Host "     (Strapi admin at http://localhost:1337/admin)"
Write-Host "======================================================"
