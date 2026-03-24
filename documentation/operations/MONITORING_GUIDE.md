# Monitoring Guide — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** DevOps Engineers, Site Reliability Engineers
**Purpose:** Explains how to monitor the accelerator application using Azure Application Insights — key metrics, dashboards, alerts, and KQL troubleshooting queries.

> **Note:** All resource names use `<project>` as a placeholder. Replace with your actual project name.

---

## 1. Accessing Monitoring Tools

### Azure Application Insights

```
Resource Group: rg-<project>-prod
Application Insights: appi-<project>-prod
```

**Access via Azure Portal:**
1. Navigate to [Azure Portal](https://portal.azure.com)
2. Search for "Application Insights"
3. Select `appi-<project>-prod`

---

## 2. Key Metrics

### Request Metrics

**Response Time**
- Normal range: < 500ms (average), < 2000ms (P95)
- Alert threshold: P95 > 2000ms over 10 minutes
- Access: Application Insights → Performance → Response time

**Error Rate (%)**
- Normal range: < 1%
- Alert threshold: > 5% over 5 minutes
- Access: Application Insights → Failures → Failed requests

**Availability (%)**
- Normal range: > 99%
- Alert threshold: < 99% over 5 minutes

---

## 3. Performance Baselines

| Metric | Baseline | Target | Alert Threshold |
|--------|----------|--------|-----------------|
| Response Time (avg) | 250ms | < 500ms | avg > 3000ms |
| Response Time (P95) | 800ms | < 1500ms | > 2000ms |
| Error Rate | 0.5% | < 1% | failed requests > 10/15min |
| Availability | 99.8% | > 99.5% | < 95%/15min |
| Exception Rate | 2/hour | < 5/hour | > 10/5min |

> **Note:** Alert thresholds are defined in `infrastructure/modules/monitoring.bicep`. Do not modify thresholds via Azure Portal — change Bicep and redeploy.

---

## 4. Configured Alerts

The 4 metric alerts below are defined declaratively in `infrastructure/modules/monitoring.bicep`. **All threshold changes must go through Bicep and be redeployed.**

**Alert 1: High Error Rate**
- **Condition:** Failed requests > 5% (over 5 minutes)
- **Severity:** High (Sev 2)
- **Action:** Email notification to configured `alertEmail`

**Alert 2: Slow Response Time**
- **Condition:** P95 response time > 2000ms (over 10 minutes)
- **Severity:** Medium (Sev 3)

**Alert 3: Availability Drop**
- **Condition:** Availability < 99% (over 5 minutes)
- **Severity:** Critical (Sev 1)

**Alert 4: Exception Spike**
- **Condition:** > 10 exceptions (over 5 minutes)
- **Severity:** High (Sev 2)

### Alert Response Procedure

1. Acknowledge the alert
2. Check the dashboard — verify if the issue persists
3. Run KQL queries to drill down
4. Check recent deployments — was there a deployment in the last hour?
5. Verify external dependencies — database, Azure services
6. Take action — rollback, scale up, fix bug
7. Document findings

---

## 5. KQL Queries

### Requests by Status Code (Last Hour)
```kql
requests
| where timestamp > ago(1h)
| summarize count() by resultCode
| order by count_ desc
```

### Top 10 Slowest Requests
```kql
requests
| where timestamp > ago(1h)
| top 10 by duration desc
| project timestamp, name, url, duration, resultCode
```

### Exception Breakdown
```kql
exceptions
| where timestamp > ago(1h)
| summarize count() by type, outerMessage
| order by count_ desc
```

### Failed Requests with Details
```kql
requests
| where resultCode >= 400
| where timestamp > ago(1h)
| project timestamp, name, url, resultCode, duration
| order by timestamp desc
```

### Request Rate Per Minute
```kql
requests
| where timestamp > ago(1h)
| summarize count() by bin(timestamp, 1m)
| render timechart
```

### Find Slowest Operations (for P95 > 2000ms alert)
```kql
requests
| where timestamp > ago(15m)
| summarize avg(duration), percentiles(duration, 50, 95, 99) by name
| where percentile_duration_95 > 2000
| order by percentile_duration_95 desc
```

### Database Call Performance
```kql
dependencies
| where type == "SQL"
| where timestamp > ago(1h)
| summarize avg(duration), count() by name
| order by avg_duration desc
```

### Business Telemetry: Article Events
```kql
customEvents
| where timestamp > ago(24h)
| where name in ("ArticleViewed", "ArticleVoted", "ArticleSearched", "ArticleCreated", "ArticleUpdated")
| summarize count() by name
| order by count_ desc
```

### Cache Hit/Miss Rates
```kql
customMetrics
| where timestamp > ago(1h)
| where name in ("FeaturedArticlesCacheHit", "TrendingArticlesCacheHit")
| summarize avg(value) by name, bin(timestamp, 5m)
| render timechart
```

---

## 6. Severity Levels & Escalation

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0** | Service down | Immediate | Application completely unavailable |
| **P1** | Critical feature broken | 1 hour | Authentication not working |
| **P2** | Major feature degraded | 4 hours | Slow response times affecting users |
| **P3** | Minor issue | 1 business day | Occasional errors, no user impact |
| **P4** | Cosmetic/enhancement | 1 week | Dashboard formatting issue |

---

## 7. Log Analysis

### Error Logs Only
```kql
traces
| where severityLevel >= 3
| where timestamp > ago(1h)
| order by timestamp desc
```

### Correlate Requests with Exceptions
```kql
requests
| where timestamp > ago(15m)
| join kind=inner (exceptions) on operation_Id
| project timestamp, url, resultCode, exceptionType = type, exceptionMessage = outerMessage
```

---

## 8. Related Documents

- [RUNBOOK.md](RUNBOOK.md) — Operational procedures and troubleshooting
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) — Backup and restore procedures
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) — Security incident procedures
- [INFRASTRUCTURE_MANAGEMENT.md](INFRASTRUCTURE_MANAGEMENT.md) — Alert threshold Bicep config
