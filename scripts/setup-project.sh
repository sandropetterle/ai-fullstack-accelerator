#!/usr/bin/env bash
# =============================================================================
# setup-project.sh
# One-shot setup script for the AI Fullstack Accelerator.
# Run this once after cloning (and optionally after rename-entity.sh).
#
# Usage:
#   ./scripts/setup-project.sh
#
# What it does:
#   1. npm install            (installs frontend dependencies)
#   2. dotnet restore         (restores backend NuGet packages)
#   3. dotnet ef database update  (creates/migrates the SQLite database)
# =============================================================================

set -euo pipefail

# Resolve repo root relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "======================================================"
echo " AI Fullstack Accelerator — Project Setup"
echo "======================================================"
echo ""
echo " Repo root: $REPO_ROOT"
echo ""

# ---------------------------------------------------------------------------
# Step 1: npm install
# ---------------------------------------------------------------------------
echo "------------------------------------------------------"
echo " Step 1 of 3: Installing frontend dependencies (npm install)"
echo "------------------------------------------------------"
cd "$REPO_ROOT"
npm install
echo ""
echo " Frontend dependencies installed."
echo ""

# ---------------------------------------------------------------------------
# Step 2: dotnet restore
# ---------------------------------------------------------------------------
echo "------------------------------------------------------"
echo " Step 2 of 3: Restoring backend NuGet packages (dotnet restore)"
echo "------------------------------------------------------"
cd "$REPO_ROOT/backend"
dotnet restore
echo ""
echo " Backend packages restored."
echo ""

# ---------------------------------------------------------------------------
# Step 3: dotnet ef database update (creates SQLite DB with seed data)
# ---------------------------------------------------------------------------
echo "------------------------------------------------------"
echo " Step 3 of 3: Applying database migrations (dotnet ef database update)"
echo "------------------------------------------------------"
cd "$REPO_ROOT"
dotnet ef database update \
  --project backend/src/Accelerator.Data \
  --startup-project backend/src/Accelerator.Api
echo ""
echo " Database migrated and ready."
echo ""

# ---------------------------------------------------------------------------
# Success
# ---------------------------------------------------------------------------
echo "======================================================"
echo " Setup complete!"
echo ""
echo " Next steps:"
echo ""
echo "   Start the backend API:"
echo "     dotnet run --project backend/src/Accelerator.Api"
echo "     (Swagger UI available at http://localhost:5255/swagger)"
echo ""
echo "   Start the frontend:"
echo "     npm run dev"
echo "     (App available at http://localhost:3000)"
echo ""
echo "   (Optional) Start the CMS:"
echo "     docker compose --profile cms up -d"
echo "     (Strapi admin at http://localhost:1337/admin)"
echo "======================================================"
