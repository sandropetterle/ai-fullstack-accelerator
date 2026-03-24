# Repository Variables and Secrets

This document lists all GitHub repository **secrets** and **variables** required by the CI/CD workflows.

Configure these at: **Settings → Secrets and variables → Actions**

---

## Secrets

Secrets are encrypted and not visible after being set. They are referenced as `${{ secrets.NAME }}`.

### Azure OIDC Identity (required for all deploy workflows)

Run `deployment/setup-github-oidc.ps1` to generate these values automatically.

| Secret | Description |
|--------|-------------|
| `AZURE_CLIENT_ID` | Application (client) ID of the Azure AD app registered for GitHub OIDC |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

### Auth / OIDC Provider (required for E2E tests and frontend deploy)

| Secret | Description |
|--------|-------------|
| `AUTH_SECRET` | Auth.js secret — generate with `openssl rand -base64 32` |
| `AUTH_ENTRA_ISSUER` | OIDC issuer URL (e.g. `https://<tenant>.ciamlogin.com/<tenant>.onmicrosoft.com/v2.0`) |
| `AUTH_ENTRA_CLIENT_ID` | Frontend OIDC client ID |
| `AUTH_ENTRA_CLIENT_SECRET` | Frontend OIDC client secret |
| `AUTH_API_SCOPE_READ` | API read scope (e.g. `api://<api-client-id>/articles.read`) |
| `AUTH_API_SCOPE_WRITE` | API write scope (e.g. `api://<api-client-id>/articles.write`) |

### Optional / Quality Gates

| Secret | Description |
|--------|-------------|
| `CHROMATIC_PROJECT_TOKEN` | Chromatic visual regression project token (get from chromatic.com). Without this, Chromatic step is non-blocking. |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI GitHub App token for posting status checks. Optional — Lighthouse still runs without it. |

---

## Repository Variables

Variables are plain text (not encrypted). They are referenced as `${{ vars.NAME }}`.

Configure at: **Settings → Secrets and variables → Actions → Variables tab**

### Azure Resource Names (required for deploy workflows)

| Variable | Description | Example value |
|----------|-------------|---------------|
| `AZURE_RESOURCE_GROUP` | Resource group name | `rg-myapp-prod` |
| `AZURE_CONTAINER_REGISTRY` | ACR name (without `.azurecr.io`) | `myappacr3a7f29` |
| `AZURE_API_CONTAINER_APP` | API Container App name | `ca-myapp-api-prod` |
| `AZURE_WEB_CONTAINER_APP` | Web/Frontend Container App name | `ca-myapp-web-prod` |
| `AZURE_CMS_CONTAINER_APP` | CMS Container App name | `ca-myapp-cms-prod` |

### Docker Image Names (required for deploy workflows)

| Variable | Description | Example value |
|----------|-------------|---------------|
| `BACKEND_IMAGE_NAME` | Backend image name in ACR | `accelerator-backend` |
| `FRONTEND_IMAGE_NAME` | Frontend image name in ACR | `accelerator-frontend` |
| `CMS_IMAGE_NAME` | CMS image name in ACR | `accelerator-cms` |

### Quality Gates

| Variable | Description | Example value |
|----------|-------------|---------------|
| `LHCI_API_BASE_URL` | Backend API URL used during Lighthouse CI build (so SSR fetches succeed). Set to the production API URL. | `https://ca-myapp-api-prod.xxx.azurecontainerapps.io/api` |

---

## How to find your Azure resource names

After running `infrastructure/deploy.ps1`, get resource names from the Azure Portal or CLI:

```bash
# List all resources in your resource group
az resource list --resource-group rg-myapp-prod --output table

# Get ACR name
az acr list --resource-group rg-myapp-prod --query "[0].name" -o tsv

# Get Container App names
az containerapp list --resource-group rg-myapp-prod --query "[].name" -o tsv
```

---

## Setup Order

1. Create the Azure resource group:
   ```bash
   az group create --name rg-myapp-prod --location centralus
   ```

2. Run OIDC setup script:
   ```powershell
   ./deployment/setup-github-oidc.ps1 -RepoOwner "your-github-user" -RepoName "your-repo"
   ```
   Add the 3 Azure secrets it outputs.

3. Deploy infrastructure:
   ```powershell
   ./infrastructure/deploy.ps1
   ```

4. Discover resource names and set repository **variables** (not secrets).

5. Set remaining **secrets** (AUTH_SECRET, AUTH_ENTRA_*, etc.).

6. Push to `main` to trigger the first deploy.
