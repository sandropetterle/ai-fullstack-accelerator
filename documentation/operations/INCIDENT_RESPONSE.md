# Incident Response Plan — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** Security Team, DevOps Engineers, Development Team
**Purpose:** Procedures for identifying, responding to, and recovering from security incidents.

---

## 1. Incident Severity Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | Complete outage or active security breach | Immediate (< 15 min) | Service down, active attack, data breach |
| **P1 - High** | Major vulnerability or partial outage | 1 hour | Auth bypass, critical CVE, major feature down |
| **P2 - Medium** | Moderate issue or degraded service | 4 hours | Exposed data, slow performance, minor vulnerability |
| **P3 - Low** | Minor security concern or isolated issue | 1 business day | Suspicious activity, low-impact bug |
| **P4 - Informational** | Security improvement or advisory | 1 week | Security recommendations, updates |

---

## 2. Incident Response Process

### Phase 1: Detection & Identification (0-15 minutes)

**Actions:**
1. Confirm the incident — is this a false positive?
2. Classify severity using the table above
3. Declare the incident and assign an Incident Commander
4. Start an incident log: `documentation/operations/incidents/YYYY-MM-DD-incident.md`

---

### Phase 2: Containment (15 min - 1 hour)

**Short-term Containment:**
```bash
# Block a suspicious IP address
az network nsg rule create \
  --resource-group rg-<project>-prod \
  --nsg-name nsg-<project> \
  --name DenyMaliciousIP \
  --priority 100 \
  --source-address-prefixes <malicious-ip> \
  --access Deny

# Rotate credentials if compromised
az keyvault secret set \
  --vault-name kv-<project> \
  --name sql-connection-string \
  --value "<new-secure-value>"

# Restart applications to pick up new secrets
az containerapp revision restart \
  --name ca-<project>-api-prod \
  --resource-group rg-<project>-prod
```

---

### Phase 3: Eradication (1-4 hours)

**Actions:**
1. Identify root cause
2. Remove malicious code or access
3. Apply security patches
4. Restore from clean backups if data compromised (see [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md))
5. Review Bicep modules for misconfigured resources — harden in Bicep and redeploy (see [INFRASTRUCTURE_MANAGEMENT.md](INFRASTRUCTURE_MANAGEMENT.md))

---

### Phase 4: Recovery (2-8 hours)

**Validation Checklist:**
- [ ] All security patches applied
- [ ] Credentials rotated
- [ ] Application health verified
- [ ] Monitoring alerts configured
- [ ] User access tested

---

### Phase 5: Post-Incident Activities

**Day 1:**
- [ ] Document full timeline
- [ ] Notify affected users (if data breach within 72 hours for GDPR)
- [ ] File regulatory reports if required

**Days 2-5:**
- [ ] Conduct post-mortem meeting
- [ ] Create incident report
- [ ] Create action items in GitHub Issues (label: `security`)

**Post-mortem template:** `documentation/operations/incidents/YYYY-MM-DD-postmortem.md`

---

## 3. Incident Types & Specific Procedures

### 3.1 Compromised Credentials

**Indicators:** Unusual login activity, unexpected access locations, multiple failed logins

**Actions:**
1. Revoke compromised credentials
2. Rotate all application secrets
3. Review access logs for unauthorized actions
4. Enable MFA (if not already enabled)

---

### 3.2 SQL Injection Attack

**Indicators:** Unusual database queries, SQL syntax errors in logs, unexpected data modifications

**Actions:**
1. Block attacker IP
2. Review database audit logs
3. Verify EF Core parameterized queries are in use (should prevent injection)
4. Restore from backup if data compromised

**Prevention:** Always use EF Core (parameterized queries). Never construct raw SQL with user input. FluentValidation enforces input constraints.

---

### 3.3 XSS (Cross-Site Scripting)

**Indicators:** Malicious JavaScript in article content, CSP violation reports

**Actions:**
1. Identify affected articles
2. Remove malicious content
3. Verify `rehype-sanitize` is active on markdown rendering
4. Verify CSP headers are active

---

### 3.4 DDoS Attack

**Actions:**
1. Verify attack vs legitimate traffic spike
2. Rate limiting is already configured — verify thresholds in `infrastructure/modules/monitoring.bicep`
3. Scale up Container Apps resources temporarily
4. Contact Azure Support for DDoS mitigation

---

### 3.5 Data Breach

**Immediate:**
1. **STOP — Do not delete evidence**
2. Activate legal/compliance team
3. Preserve logs and forensic evidence
4. Identify scope (what data, how many users)
5. Notify affected users within 72 hours if GDPR applies

---

## 4. Evidence Collection

```bash
# Export Application Insights logs (query suspicious activity)
requests
| where timestamp > ago(24h)
| where resultCode >= 400
| project timestamp, url, resultCode, clientIP

exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, details
```

**Chain of Custody:** Document who collected evidence, when, where it's stored, and who has access. Retain for minimum 1 year.

---

## 5. Security Hardening Checklist

Controls implemented in the accelerator:

- [x] Input validation (FluentValidation)
- [x] XSS protection (rehype-sanitize, CSP headers)
- [x] Rate limiting (vote/action endpoint + general API)
- [x] Secrets in Key Vault (not in code)
- [x] CORS restricted to configured origins
- [x] HTTPS enforced
- [x] Swagger disabled in production
- [x] No exception details exposed to clients
- [x] Non-root container users
- [x] SHA-pinned Docker base images

**Recommended enhancements (post-launch):**
- [ ] Regular security scanning (SAST/DAST in CI/CD)
- [ ] Penetration testing (annual)
- [ ] Audit logging for sensitive operations
- [ ] Azure DDoS Protection Standard

---

## 6. Communication Templates

### Internal Incident Declaration

```
TO: Incident Response Team
SUBJECT: [P1] Security Incident Declared - <Project>

Severity: P1 - High
Incident Type: [Compromised credentials / SQL injection / XSS / etc.]
Detected: YYYY-MM-DD HH:MM UTC
Incident Commander: [Name]

Initial Assessment:
- [Brief description]
- [Current impact]
- [Immediate actions taken]
```

### User Notification (Data Breach)

```
SUBJECT: Important Security Notice - <Project>

Dear User,

We are writing to inform you of a security incident...

What Happened: [brief description]
What Information Was Involved: [data types]
What We Are Doing: [actions taken]
What You Should Do: [recommendations]

Contact: security@<your-domain>
```

---

## 7. Useful Resources

- [NIST Incident Response Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
- [MONITORING_GUIDE.md](MONITORING_GUIDE.md)
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)
- [RUNBOOK.md](RUNBOOK.md)
