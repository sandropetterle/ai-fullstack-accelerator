# Operational Runbook — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** DevOps Engineers, On-Call Personnel
**Purpose:** Step-by-step procedures for common operational tasks, troubleshooting guides, and quick reference commands.

> **Note:** All Azure resource names below use `<project>` as a placeholder. Replace with your actual project name from `infrastructure/main.parameters.prod.json`.

---

## Quick Links

- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Deployment Procedures](#deployment-procedures)
- [Emergency Procedures](#emergency-procedures)

---

## Common Tasks

### 1. Check Application Status

```bash
# Check Container Apps status
az containerapp list \
  --resource-group rg-<project>-prod \
  --output table

# Check health endpoints
curl https://<backend-url>/health
curl https://<frontend-url>/

# View Application Insights metrics
# Azure Portal → Application Insights → appi-<project>-prod → Metrics
```

**Expected Output:**
- Health endpoint: `Healthy` (200 OK)
- Container Apps: `Running` status

---

### 2. View Application Logs

**Backend Logs:**
```bash
az containerapp logs show \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --follow

# View last 100 lines
az containerapp logs show \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --tail 100
```

**Frontend Logs:**
```bash
az containerapp logs show \
  --name ca-<project>-web-prod \
  --resource-group rg-<project>-prod \
  --follow
```

**Application Insights (KQL):**
```kql
// Recent errors
traces
| where severityLevel >= 3
| where timestamp > ago(1h)
| order by timestamp desc
| project timestamp, severityLevel, message
```

---

### 3. Restart Application

```bash
# Backend
az containerapp revision restart \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod

# Frontend
az containerapp revision restart \
  --name ca-<project>-web-prod \
  --resource-group rg-<project>-prod
```

**Expected Downtime:** 30-60 seconds during restart.

---

### 4. Scale Container Apps

```bash
# Increase min replicas (prevent scale-to-zero)
az containerapp update \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --min-replicas 1 \
  --max-replicas 5

# Return to scale-to-zero
az containerapp update \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --min-replicas 0 \
  --max-replicas 3
```

**When to scale:** CPU > 80% sustained, P95 response > 2s, expected traffic surge.

> **Important:** Use `az containerapp update` only for emergency operational responses. Permanent changes must be reflected in Bicep IaC — see [INFRASTRUCTURE_MANAGEMENT.md](INFRASTRUCTURE_MANAGEMENT.md).

---

### 5. Update Configuration

```bash
# Update environment variable
az containerapp update \
  --name ca-<project>-web-prod \
  --resource-group rg-<project>-prod \
  --set-env-vars "NEXT_PUBLIC_API_BASE_URL=https://new-url/api"

# Update a Key Vault secret
az keyvault secret set \
  --vault-name kv-<project> \
  --name sql-connection-string \
  --value "Server=tcp:...;Password=NEW_PASSWORD"

# Restart to pick up new secret
az containerapp revision restart \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod
```

---

### 6. Database Operations

**Common SQL Queries:**
```sql
-- Check article count
SELECT COUNT(*) FROM Articles;

-- Check recent articles
SELECT TOP 10 * FROM Articles ORDER BY CreatedDate DESC;

-- Check tag usage
SELECT t.Name, COUNT(at.ArticlesId) as ArticleCount
FROM Tags t
LEFT JOIN ArticleTag at ON t.Id = at.TagsId
GROUP BY t.Name
ORDER BY ArticleCount DESC;

-- Check vote counts
SELECT Title, VoteCount FROM Articles ORDER BY VoteCount DESC;
```

**Run Migrations (from local machine):**
```bash
# Set connection string
export CONNECTION_STRING="Server=tcp:<sql-server>.database.windows.net,1433;Initial Catalog=<db>;User ID=<user>;Password=<pass>;Encrypt=True;"

# Run migrations
dotnet ef database update \
  --project backend/src/Accelerator.Data \
  --startup-project backend/src/Accelerator.Api \
  --connection "$CONNECTION_STRING"
```

---

## Troubleshooting

### Issue 1: Application Not Responding (503/504 Errors)

**Diagnosis:**
```bash
az containerapp list --resource-group rg-<project>-prod --output table
az containerapp replica list --name ca-<project>-api-prod --resource-group rg-<project>-prod
az containerapp logs show --name ca-<project>-api-prod --resource-group rg-<project>-prod --tail 100
```

**Common Causes:**
1. Scale-to-zero cold start — wait 30-60 seconds
2. Application crash on startup — check logs for exceptions
3. Database connection failure — verify connection string

**Resolution:**
```bash
az containerapp revision restart --name ca-<project>-api-prod --resource-group rg-<project>-prod
```

---

### Issue 2: Slow Performance (High Response Times)

**Diagnosis (KQL):**
```kql
requests
| where timestamp > ago(1h)
| summarize avg(duration), percentiles(duration, 50, 95, 99) by name
| where percentile_duration_95 > 2000
| order by percentile_duration_95 desc
```

**Common Causes:**
1. Cold start from scale-to-zero
2. Slow database queries
3. Insufficient resources

**Resolution:**
```bash
az containerapp update \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --cpu 1.0 \
  --memory 2.0Gi \
  --min-replicas 1
```

---

### Issue 3: High Error Rate (4xx/5xx Errors)

**Diagnosis (KQL):**
```kql
requests
| where resultCode >= 400
| where timestamp > ago(15m)
| summarize count() by url, resultCode
| order by count_ desc
```

**Resolution:**
```bash
# Rollback to previous revision if deployment-related
az containerapp revision list --name ca-<project>-api-prod --resource-group rg-<project>-prod
az containerapp revision activate --resource-group rg-<project>-prod --name ca-<project>-api-prod --revision <previous-good-revision>
```

---

### Issue 4: Database Connection Errors

**Diagnosis:**
```bash
az sql db show \
  --resource-group rg-<project>-prod \
  --server sql-<project> \
  --name sqldb-<project>-prod
```

**Resolution:**
```bash
# Check outbound IPs of Container App (must be allowed by SQL firewall)
az containerapp show --name ca-<project>-api-prod --resource-group rg-<project>-prod --query properties.outboundIpAddresses

# Add firewall rule if needed
az sql server firewall-rule create \
  --resource-group rg-<project>-prod \
  --server sql-<project> \
  --name AllowContainerApps \
  --start-ip-address <outbound-ip> \
  --end-ip-address <outbound-ip>
```

---

## Deployment Procedures

### Deploy Backend

```bash
# Get latest image tag
az acr repository show-tags \
  --name <acr-name> \
  --repository <project>-api \
  --orderby time_desc

# Update Container App
az containerapp update \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --image <acr-name>.azurecr.io/<project>-api:latest

# Verify health
curl https://<backend-url>/health
```

**Automated:** GitHub Actions workflow `backend-container-deploy.yml`

### Deploy Frontend

```bash
az containerapp update \
  --name ca-<project>-web-prod \
  --resource-group rg-<project>-prod \
  --image <acr-name>.azurecr.io/<project>-web:latest
```

**Automated:** GitHub Actions workflow `frontend-container-deploy.yml`

### Rollback Deployment

```bash
# List revisions
az containerapp revision list --name ca-<project>-api-prod --resource-group rg-<project>-prod --output table

# Activate previous good revision
az containerapp revision activate \
  --resource-group rg-<project>-prod \
  --name ca-<project>-api-prod \
  --revision <previous-revision-name>

# Deactivate bad revision
az containerapp revision deactivate \
  --resource-group rg-<project>-prod \
  --name ca-<project>-api-prod \
  --revision <current-bad-revision>
```

**Estimated Time:** 2-3 minutes.

---

## Emergency Procedures

### Emergency: Complete Service Outage

1. **Check Azure Service Health** → Azure Portal → Home → Service Health

2. **Verify Container Apps:**
   ```bash
   az containerapp list --resource-group rg-<project>-prod --output table
   ```

3. **Restart all services:**
   ```bash
   az containerapp revision restart --name ca-<project>-api-prod --resource-group rg-<project>-prod
   az containerapp revision restart --name ca-<project>-web-prod --resource-group rg-<project>-prod
   ```

4. **If Azure-wide issue, activate DR plan:**
   - See [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)

### Emergency: Security Breach

1. **Rotate all credentials immediately:**
   ```bash
   az keyvault secret set --vault-name kv-<project> --name sql-connection-string --value "<new-value>"
   az containerapp revision restart --name ca-<project>-api-prod --resource-group rg-<project>-prod
   ```

2. **Preserve evidence** — do not delete logs

3. **Follow:** [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)

---

## Quick Reference

```bash
# Check all services at once
az containerapp list -g rg-<project>-prod -o table && curl https://<backend-url>/health

# Tail both app logs simultaneously
az containerapp logs show --name ca-<project>-api-prod -g rg-<project>-prod --follow &
az containerapp logs show --name ca-<project>-web-prod -g rg-<project>-prod --follow &
```

**Related Documents:**
- [MONITORING_GUIDE.md](MONITORING_GUIDE.md)
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)
- [INFRASTRUCTURE_MANAGEMENT.md](INFRASTRUCTURE_MANAGEMENT.md)
