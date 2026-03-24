# Infrastructure Management — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** DevOps, Infrastructure Engineers, Solutions Architects
**Purpose:** Single source of truth for Azure infrastructure management — how it's structured, how to deploy changes, and how secrets flow from Key Vault to application configuration.

---

## 1. Overview

All Azure infrastructure is managed declaratively using **Azure Bicep** (IaC). The Bicep templates in `infrastructure/` describe the complete desired state of the production resource group.

### Resource Inventory

| Resource | Type | Notes |
|----------|------|-------|
| Container Apps Environment | Microsoft.App/managedEnvironments | Linked to Log Analytics |
| API Container App | Microsoft.App/containerApps | ASP.NET Core backend |
| Web Container App | Microsoft.App/containerApps | Next.js frontend |
| CMS Container App | Microsoft.App/containerApps | Strapi 5 (optional) |
| Container Registry | Microsoft.ContainerRegistry/registries | Basic SKU, admin disabled |
| Azure SQL Server | Microsoft.Sql/servers | Serverless, auto-pause |
| Azure SQL Database | Microsoft.Sql/servers/databases | GP_S_Gen5_1 |
| Key Vault | Microsoft.KeyVault/vaults | Standard, RBAC mode |
| Application Insights | Microsoft.Insights/components | Linked to Log Analytics |
| Log Analytics Workspace | Microsoft.OperationalInsights/workspaces | |
| MySQL Flexible Server | Microsoft.DBforMySQL/flexibleServers | CMS only (optional) |
| Blob Storage Account | Microsoft.Storage/storageAccounts | CMS media (optional) |

Actual resource names are determined by the `projectName` parameter in `main.parameters.prod.json`.

---

## 2. Directory Structure

```
infrastructure/
  main.bicep                        # Orchestrator — calls all modules in dependency order
  main.parameters.prod.json         # Production values (Key Vault references, no plaintext)
  main.parameters.template.json     # Template with TODO placeholders for new projects
  deploy.ps1                        # validate → what-if → confirm → deploy
  README.md                         # Quick-start for engineers
  modules/
    monitoring.bicep                # Log Analytics + Application Insights + 4 metric alerts
    acr.bicep                       # Azure Container Registry
    keyvault.bicep                  # Key Vault (Standard, RBAC mode)
    sql.bicep                       # Azure SQL Serverless
    cms.bicep                       # MySQL Flexible Server + Blob Storage (optional)
    containerAppsEnvironment.bicep  # Container Apps Environment
    containerApps.bicep             # All 3 Container Apps with managed identity + ACR pull
```

---

## 3. Environment Strategy

The accelerator ships as **production-only** by default. To add a staging environment:

1. Copy `main.parameters.prod.json` → `main.parameters.staging.json`
2. Change the `environment` parameter value to `staging`
3. Create a new resource group: `az group create --name rg-<project>-staging --location <region>`
4. Deploy: `az deployment group create --resource-group rg-<project>-staging --template-file infrastructure/main.bicep --parameters @infrastructure/main.parameters.staging.json --mode Incremental`

Resource names use the `environment` parameter as a suffix, so staging resources are named distinctly.

---

## 4. Deploying Infrastructure Changes

### Prerequisites

```powershell
az login
az account set --subscription <subscription-id>
az bicep install   # one-time
```

### Validate Locally

```bash
az bicep build --file infrastructure/main.bicep
```

No Azure login needed — this is a local compile step. CI runs this on every PR.

### What-If Preview

```powershell
az deployment group what-if \
  --resource-group rg-<project>-prod \
  --template-file infrastructure/main.bicep \
  --parameters @infrastructure/main.parameters.prod.json \
  --mode Incremental
```

For existing infrastructure, every resource should show **"no change"** unless you've modified a module.

### Deploy

```powershell
# Interactive: validate → what-if → confirm → deploy
./infrastructure/deploy.ps1

# What-if only (no deploy prompt)
./infrastructure/deploy.ps1 -WhatIf
```

### ⚠️ Incremental Mode — Critical Warning

**Always use `--mode Incremental`.** The deploy script enforces this.

`--mode Complete` deletes any resource in the resource group that is not defined in the Bicep template. This is destructive and irreversible.

---

## 5. CI Validation

The `validate-infrastructure` job in `.github/workflows/test.yml` runs on every push and pull request:

```yaml
validate-infrastructure:
  name: Validate Bicep Templates
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Install Azure CLI + Bicep
      run: |
        curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
        az bicep install
    - name: Validate Bicep templates
      run: az bicep build --file infrastructure/main.bicep
```

No Azure credentials are needed — `az bicep build` is a local compile step.

---

## 6. Secrets Management

Secrets are never stored in Bicep templates, parameter files, or source control. The flow is:

```
Key Vault secrets (set once via az keyvault secret set)
  → Container App secret references (keyVaultUrl + identity: 'system')
    → IConfiguration values (ASP.NET Core reads env vars with __ → : mapping)
```

### Key Vault Secrets Inventory

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `sql-connection-string` | API Container App | Azure SQL connection string |
| `auth-authority` | API Container App | OIDC authority URL |
| `auth-audience` | API Container App | API app registration audience |
| `auth-secret` | Web Container App | Auth.js session signing secret |
| `auth-oidc-client-secret` | Web Container App | OIDC frontend app client secret |
| `strapi-app-keys` | CMS Container App | Strapi APP_KEYS |
| `strapi-admin-jwt-secret` | CMS Container App | Strapi ADMIN_JWT_SECRET |
| `mysql-admin-password` | CMS Container App | MySQL admin password |
| `strapi-api-token-salt` | CMS Container App | Strapi API_TOKEN_SALT |
| `appinsights-connection-string` | API Container App | Application Insights connection string |

### Setting Secrets

```powershell
az keyvault secret set \
  --vault-name kv-<project> \
  --name sql-connection-string \
  --value "Server=sql-<project>.database.windows.net;Database=sqldb-<project>-prod;..."
```

### Role Assignment

Each Container App uses system-assigned managed identity. `main.bicep` assigns the `Key Vault Secrets User` role to all three apps after provisioning.

---

## 7. Script Inventory

| Script | Location | Purpose | When to Run |
|--------|----------|---------|-------------|
| `deploy.ps1` | `infrastructure/` | Validate + what-if + deploy Bicep | Per infrastructure change |
| `setup-github-oidc.ps1` | `deployment/` | One-time OIDC federated identity setup for GitHub Actions | One-time per repo |
| `configure-acr-access.ps1` | `deployment/` | One-time managed identity ACR access setup | One-time |
| `azure-cleanup.ps1` | `deployment/` | Full resource group teardown | Emergency only |
| `provision-cms.ps1` | `deployment/scripts/` | CMS-specific provisioning (MySQL + Blob Storage) | CMS re-provision |

---

## 8. Adding a New Resource

1. **Identify the module** — does it belong in an existing module or need a new one?
2. **Add the Bicep resource** — use the appropriate API version and properties
3. **Add outputs** if downstream modules need to reference it
4. **Wire in `main.bicep`** — add module call, handle dependencies
5. **Validate**: `az bicep build --file infrastructure/main.bicep`
6. **Preview**: `./infrastructure/deploy.ps1 -WhatIf` — confirm only the new resource shows as "create"
7. **Deploy**: `./infrastructure/deploy.ps1`
8. **Update this document** — add the resource to the Resource Inventory table

---

## 9. References

- [Azure Bicep documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview)
- [Container Apps Environment Bicep reference](https://learn.microsoft.com/azure/templates/microsoft.app/managedenvironments)
- [Key Vault secret references in Container Apps](https://learn.microsoft.com/azure/container-apps/manage-secrets)
- [`infrastructure/README.md`](../../infrastructure/README.md) — quick-start for engineers
- [`deployment/github-secrets-setup.md`](../../deployment/github-secrets-setup.md) — OIDC setup for GitHub Actions
- [AUTH_SETUP_GUIDE.md](AUTH_SETUP_GUIDE.md) — OIDC provider configuration
- [MONITORING_GUIDE.md](MONITORING_GUIDE.md) — alert thresholds and dashboards
