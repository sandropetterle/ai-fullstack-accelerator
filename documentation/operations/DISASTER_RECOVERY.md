# Disaster Recovery Plan — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** DevOps Engineers, Site Reliability Engineers, IT Management
**Purpose:** Recovery procedures for catastrophic failures, data loss, or regional outages.

> **Note:** All resource names use `<project>` as a placeholder. Replace with your actual project name.

---

## 1. Recovery Objectives

| Objective | Target |
|-----------|--------|
| **RTO** (Recovery Time Objective) | 4 hours |
| **RPO** (Recovery Point Objective) | 24 hours |

**RTO Breakdown:**
- Assessment and decision: 30 minutes
- Backup identification: 15 minutes
- Restore execution: 2 hours
- Validation and testing: 1 hour
- DNS/routing updates: 15 minutes

---

## 2. Backup Strategy

### Database Backups (Azure SQL)

- **Full backups:** Weekly (Sunday 02:00 UTC)
- **Differential backups:** Daily (02:00 UTC)
- **Transaction log backups:** Every 10 minutes
- **Retention:** 30 days
- **Geo-redundant:** Enabled (backup replicated to paired region)

### Application & Configuration Backups

- **Source code:** Git (GitHub provides redundancy)
- **Container images:** Azure Container Registry (90-day retention)
- **Secrets:** Azure Key Vault (soft-delete enabled, 90-day recovery window)

---

## 3. Disaster Scenarios

| Scenario | Impact | RTO | RPO |
|----------|--------|-----|-----|
| Container crash / bad deployment | High (service unavailable) | 1 hour | 0 (no data loss) |
| Database corruption / data loss | Critical | 4 hours | 24 hours |
| Azure regional outage | Critical | 4 hours | 24 hours |
| Security breach / ransomware | Critical | 8 hours | 24 hours |

---

## 4. Recovery Procedures

### 4.1 Application Rollback (Container Apps)

**When to use:** Bad deployment, configuration error, performance regression.

```bash
# List revisions
az containerapp revision list \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --output table

# Activate previous good revision
az containerapp revision activate \
  --resource-group rg-<project>-prod \
  --name ca-<project>-api-prod \
  --revision <previous-revision-name>

# Deactivate bad revision
az containerapp revision deactivate \
  --resource-group rg-<project>-prod \
  --name ca-<project>-api-prod \
  --revision <bad-revision-name>

# Verify health
curl https://<backend-url>/health

# Repeat for frontend
az containerapp revision activate \
  --resource-group rg-<project>-prod \
  --name ca-<project>-web-prod \
  --revision <previous-revision-name>
```

**Estimated Time:** 15-30 minutes. **Data Loss:** None.

---

### 4.2 Database Point-in-Time Restore

**When to use:** Accidental data deletion, data corruption.

```bash
# Restore to a point in time before the incident
az sql db restore \
  --dest-name sqldb-<project>-restore-$(date +%Y%m%d) \
  --resource-group rg-<project>-prod \
  --server sql-<project> \
  --name sqldb-<project>-prod \
  --time "<ISO-8601-timestamp-before-incident>"

# Verify restored data
sqlcmd -S sql-<project>.database.windows.net \
       -d sqldb-<project>-restore-$(date +%Y%m%d) \
       -U <admin-user> -P <password>

# Option A: Point application to restored database (faster)
az containerapp update \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod \
  --set-env-vars "ConnectionStrings__DefaultConnection=secretref:sql-restore-connection-string"
```

**Estimated Time:** 2-3 hours. **Data Loss:** Data between restore point and incident time.

---

### 4.3 Full Environment Rebuild via IaC

For complete environment rebuilds (regional failover, catastrophic resource deletion):

```powershell
# Redeploy all Azure resources from Bicep templates
./infrastructure/deploy.ps1 -ResourceGroup rg-<project>-prod -Location <region>
```

See [INFRASTRUCTURE_MANAGEMENT.md](INFRASTRUCTURE_MANAGEMENT.md) for the validate/what-if/deploy workflow.

---

### 4.4 Regional Failover

**When to use:** Primary Azure region unavailable.

```bash
SECONDARY_RG="rg-<project>-prod-dr"
SECONDARY_REGION="eastus2"

# Create resource group in secondary region
az group create --name $SECONDARY_RG --location $SECONDARY_REGION

# Geo-restore database to secondary region
az sql db restore \
  --dest-name sqldb-<project>-prod-dr \
  --dest-resource-group $SECONDARY_RG \
  --dest-server sql-<project>-dr \
  --resource-group rg-<project>-prod \
  --server sql-<project> \
  --name sqldb-<project>-prod \
  --time "<latest-available-backup>"

# Deploy Container Apps to secondary region
az containerapp create \
  --name ca-<project>-api-dr \
  --resource-group $SECONDARY_RG \
  --image <acr>.azurecr.io/<project>-api:latest \
  --target-port 8080 \
  --ingress external \
  --env-vars "ConnectionStrings__DefaultConnection=<secondary-db-connection-string>"
```

**Estimated Time:** 3-4 hours. **Data Loss:** Up to 24 hours.

---

### 4.5 Security Breach Recovery

1. **Containment (Immediate):**
   ```bash
   # Rotate all credentials
   az keyvault secret set --vault-name kv-<project> --name sql-connection-string --value "<new-value>"
   az containerapp revision restart --name ca-<project>-api-prod --resource-group rg-<project>-prod
   ```

2. **Forensic Analysis:** Export Application Insights logs; review database audit logs

3. **Restore from clean backup:** Follow Section 4.2 using a timestamp before the breach

4. **Post-incident:** Follow [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)

---

## 5. DR Testing Schedule

| Test | Frequency | Duration | Scope |
|------|-----------|----------|-------|
| Backup verification | Monthly (first Monday) | 2 hours | Restore DB to test environment |
| DR drill | Quarterly | Half day | Database + application simulation |
| Regional failover test | Annually | Full day | Complete failover to secondary region |

**Test documentation template:**
```markdown
# DR Test - YYYY-MM-DD

**Test Type:** [Monthly Backup / Quarterly DR / Annual Failover]
**Status:** ✅ Success / ❌ Failed
**Duration:** X hours

## Steps Executed:
1. [step]

## Issues:
- [none or list]

## Recommendations:
- [improvements]
```

---

## 6. Communication Templates

### Disaster Declaration

```
SUBJECT: [DISASTER] <Project> - Disaster Declared

Team,

A disaster has been declared for <Project>.

Disaster Type: [Database corruption / Regional outage / Security breach]
Impact: [Service unavailable / Data loss / Performance degraded]
Estimated RTO: [4 hours]
Estimated RPO: [24 hours]

Recovery actions:
- [List key actions being taken]

Status updates every 30 minutes.
```

### Recovery Complete

```
SUBJECT: [RESOLVED] <Project> - Service Restored

Recovery completed: YYYY-MM-DD HH:MM UTC
Total downtime: X hours
Data loss: [None / X hours of data]

Post-incident review scheduled: [Date/Time]
```

---

## 7. Related Documents

- [MONITORING_GUIDE.md](MONITORING_GUIDE.md) — Alert thresholds and dashboards
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) — Security incident procedures
- [RUNBOOK.md](RUNBOOK.md) — Operational procedures
- [INFRASTRUCTURE_MANAGEMENT.md](INFRASTRUCTURE_MANAGEMENT.md) — IaC rebuild guide
