# Infrastructure (Azure Bicep)

Infrastructure as code for deploying the accelerator to Azure Container Apps. `main.bicep` orchestrates the modules in `modules/`; `deploy.ps1` validates, previews and deploys it.

CI compiles `main.bicep` on every push (`az bicep build`, the "Validate Bicep Templates" job in `.github/workflows/test.yml`). The template has not yet been deployed from this repository's CI; the deploy workflows are opt-in (see [Deploying the apps](#deploying-the-apps)).

## What it provisions

| Module | Resources | Notes |
|--------|-----------|-------|
| `monitoring.bicep` | Log Analytics workspace, Application Insights, 4 metric alerts, action group | Action group only when `alertEmail` is set |
| `acr.bicep` | Container Registry | Basic SKU |
| `keyvault.bicep` | Key Vault, diagnostic settings | `CanNotDelete` lock |
| `sql.bicep` | Azure SQL server + database, firewall rule (Azure services), backup policy, diagnostics | Serverless `GP_S_Gen5`; `CanNotDelete` lock |
| `cms.bicep` | MySQL Flexible Server + database, Storage account + `media` container | MySQL `Standard_B1ms` (Burstable), Storage `Standard_LRS`; both have `CanNotDelete` locks. Provisioned whether or not you use the optional CMS |
| `containerAppsEnvironment.bicep` | Container Apps environment | Logs to the workspace above |
| `containerApps.bicep` | `api`, `web` and `cms` Container Apps, AcrPull role assignments | `minReplicas: 0` (scale to zero). First deploy uses a placeholder image (`containerapps-helloworld`); the deploy workflows replace it |
| `main.bicep` | Key Vault Secrets User role assignments for each app's managed identity | |

Resource names are derived from `projectName` (2–12 lowercase characters) and `environment` (`prod`, `staging` or `dev`). Allowed regions: `centralus` (default), `eastus`, `eastus2`, `westus2`.

## Deploying the infrastructure

Prerequisites: Azure CLI (`az login`), Bicep (`az bicep install`), Contributor on the target resource group (Owner or User Access Administrator as well, because the template creates role assignments), and PowerShell for `deploy.ps1`.

```bash
# 1. Resource group (deploy.ps1 defaults to rg-<projectName>-prod)
az group create --name rg-myapp-prod --location centralus

# 2. Parameters: copy the template and replace every TODO_ placeholder
cp infrastructure/main.parameters.template.json infrastructure/main.parameters.prod.json

# 3. Validate and preview, then deploy
./infrastructure/deploy.ps1 -WhatIf
./infrastructure/deploy.ps1
```

`deploy.ps1` always deploys with `--mode Incremental`. Never use `Complete` mode, which deletes resources in the group that are not in the template.

`apiBaseUrl` and `strapiUrl` can only be known after the first deploy (they are Container App FQDNs). Set them in the parameters file and deploy again.

## Deploying the apps

The GitHub Actions workflows `frontend-container-deploy.yml`, `backend-container-deploy.yml` and `cms-container-deploy.yml` build the images, push them to the registry and update the Container Apps. Each Azure-touching job, and the Lighthouse CI and Chromatic jobs, runs only when the repository variable `AZURE_DEPLOY_ENABLED` is `true`. That keeps forks and template copies green without Azure credentials.

To turn them on:

1. Configure OIDC federation between GitHub and Azure: `deployment/setup-github-oidc.ps1`.
2. Grant the apps pull access to the registry if needed: `deployment/configure-acr-access.ps1`.
3. Add the secrets and variables listed in [`.github/REPO_VARIABLES.md`](../.github/REPO_VARIABLES.md), then set `AZURE_DEPLOY_ENABLED=true`.

`cms-container-deploy.yml` needs a Strapi app in `cms/`, which is bring-your-own (see the README's "Optional: Strapi CMS").

## Tearing it down

The `CanNotDelete` locks on SQL, Key Vault, MySQL and Storage block `az group delete`, and `deployment/azure-cleanup.ps1` does not remove them. Remove the locks first:

```bash
az lock list --resource-group rg-myapp-prod --query "[].id" -o tsv | xargs -n1 az lock delete --ids
az group delete --name rg-myapp-prod
```

Key Vault is soft-deleted, so purge it (`az keyvault purge --name <vault>`) if you want to reuse the name.

## More

- [Infrastructure management](../documentation/operations/INFRASTRUCTURE_MANAGEMENT.md): resource inventory, changing resources, conventions
- [Auth setup](../documentation/operations/AUTH_SETUP_GUIDE.md): OIDC provider configuration
- [Monitoring](../documentation/operations/MONITORING_GUIDE.md): alerts and dashboards
- [Architecture decisions](../docs/ARCHITECTURE_DECISIONS.md) §10 (Bicep) and §11 (Container Apps)
