# Documentation Governance

**Last Updated:** 2026-03-24
**Audience:** All contributors (developers, architects, infrastructure engineers)
**Purpose:** Define the rules, folder structure, naming conventions, and lifecycle policies for all documentation in the accelerator.

---

## 1. Folder Structure & Purpose

Every documentation file must live in the correct folder based on its content type.

| Folder | Purpose | Audience | Lifecycle |
|--------|---------|----------|-----------|
| `documentation/architecture/` | How the system is built — permanent system knowledge | Solutions Architect, Developers | Updated when architecture changes |
| `documentation/api/` | REST API reference — endpoint details, DTOs, examples | Developers, API consumers | Updated when endpoints or DTOs change |
| `documentation/decisions/` | Why we built it this way — append-only decision log | Architect, Senior Developers | Append on each decision; compact quarterly |
| `documentation/testing/` | How we test — strategy, guides, templates | Developers, QA Engineers | Updated when testing approach changes |
| `documentation/operations/` | How to run in production — monitoring, DR, runbooks | Infrastructure, SRE, On-Call | Updated on infrastructure changes |
| `documentation/cms-components/` | CMS component reference — Strapi component schemas, field tables, dependency map | Frontend devs, Content editors | Updated when CMS component schemas change |
| `documentation/diagrams/` | Architecture and flow diagrams — permanent | All audiences | Created when diagram tooling is adopted |
| `.storybook/` | Storybook configuration and shared fixtures — interactive UI component catalog | Frontend devs | Updated when components are added or config changes |
| `deployment/` | Azure deployment scripts and step-by-step guides | Infrastructure Engineers, DevOps | Updated on infrastructure changes |
| `CLAUDE.md` (root) | AI assistant operational context — quick-reference | AI assistant, Developers | Updated when conventions or structure changes |
| `README.md` (root) | Public-facing project entry point | New contributors, GitHub visitors | Updated each major phase |
| `DOCUMENTATION_INDEX.md` (root) | Central map of all documentation files | All audiences | Updated whenever a doc is created, moved, or deleted |

---

## 2. File Naming Convention

- **Permanent documents:** `SCREAMING_SNAKE_CASE.md` (e.g., `BACKEND_ARCHITECTURE.md`, `TESTING_STRATEGY.md`)
- **Deployment guides:** `lowercase-hyphen.md` (e.g., `database-migration.md`, `github-secrets-setup.md`)

---

## 3. Required Document Header

Every documentation file must begin with these four lines (immediately after the title):

```markdown
# Document Title

**Last Updated:** YYYY-MM-DD
**Audience:** [Target stakeholder roles]
**Purpose:** [One sentence describing what this document is for and why it exists]
```

---

## 4. Single Source of Truth

Each fact must have exactly one authoritative document. Other documents may reference it via a markdown link but must not duplicate the content. Key single sources:

| Fact | Single Source | Others must link to it |
|------|-------------|----------------------|
| Alert thresholds | `documentation/operations/MONITORING_GUIDE.md` | Architecture docs reference it |
| API reference (full) | `documentation/api/` (`API_REFERENCE_INDEX.md`, `ARTICLES_API.md`, `AUTH_API.md`, `HEALTH_API.md`) | `BACKEND_ARCHITECTURE.md` Section 3 (links to it), `CLAUDE.md` (quick ref) |
| CMS component schemas | `documentation/cms-components/` (`COMPONENT_INDEX.md` + namespace pages) | `CMS_ARCHITECTURE.md` Section 2 (links to it) |
| Auth architecture | `documentation/architecture/SECURITY_OVERVIEW.md` | `CLAUDE.md` has summary |
| Category enum mapping | `documentation/architecture/DATA_MODEL.md` | `CLAUDE.md` has reminder note |
| Test coverage thresholds | `documentation/testing/TESTING_STRATEGY.md` | `CLAUDE.md` has summary |

---

## 5. Lifecycle Rules

### Permanent Documents (`architecture/`, `testing/`, `operations/`)

- Updated **in-place** when the system changes
- Never deleted; content that becomes obsolete is moved to an archive section within the file with a `> ⚠️ Archived:` blockquote
- Reviewed at least once per major phase for accuracy

### Technical Decisions Log (`decisions/TECHNICAL_DECISIONS_LOG.md`)

- **Append-only** — new entries added at the top (newest first)
- Subject to quarterly compaction (see Section 6)
- Never silently deleted; superseded decisions are archived with a stub entry

---

## 6. Technical Decisions Compaction Process

Run quarterly or when the log exceeds ~20 active entries.

**Step 1: Identify candidates**
- Decisions fully superseded by a newer decision
- One-time infrastructure fixes where the resolved state is now permanent
- Decisions 3+ phases old that are fully reflected in architecture docs

**Step 2: Propagate to architecture docs first**
- Ensure any architectural insight is written into the relevant `documentation/architecture/` file
- Do not compact until the insight is preserved elsewhere

**Step 3: Archive the decision**
- Move the full text to `documentation/decisions/DECISIONS_ARCHIVE.md`
- Replace in the main log with a one-line stub:

```markdown
## Decision N: Title [ARCHIVED]
**Date:** YYYY-MM-DD | **Superseded by:** Decision M | **Archived:** YYYY-QN
See [DECISIONS_ARCHIVE.md](DECISIONS_ARCHIVE.md) for full text.
```

**Step 4: Update the header count**
- Update the summary at the top of `TECHNICAL_DECISIONS_LOG.md`: `{N} active decisions | {M} archived`

---

## 7. Cross-Referencing Rules

- Always use **relative markdown links** between documents (e.g., `[TESTING_STRATEGY.md](../testing/TESTING_STRATEGY.md)`)
- When a document is moved or renamed, update all inbound links
- `DOCUMENTATION_INDEX.md` must be updated whenever a file is created, moved, or deleted

---

## 8. Diagram Conventions

All diagrams are embedded inline in their target architecture docs. When adding new diagrams:

- **Preferred format:** Mermaid (renders natively in GitHub)
- **Storage:** Source lives in `documentation/diagrams/`; diagrams are embedded inline in the relevant target doc
- **Color palette:** Follow the established palette — blue=frontend/API, green=backend/core, amber=database, purple=CMS/providers, sky=Azure, gray=CI/CD (see `documentation/diagrams/DIAGRAM_INDEX.md`)

---

## 9. Stakeholder Reading Paths

### New Contributor (any role)
`README.md` → `DOCUMENTATION_INDEX.md` → `CLAUDE.md`

### Backend Developer
`README.md` → `CLAUDE.md` → `documentation/architecture/SYSTEM_OVERVIEW.md` → `documentation/architecture/BACKEND_ARCHITECTURE.md` → `documentation/architecture/DATA_MODEL.md` → `documentation/testing/TESTING_STRATEGY.md`

### Frontend Developer
`README.md` → `CLAUDE.md` → `documentation/architecture/SYSTEM_OVERVIEW.md` → `documentation/architecture/FRONTEND_ARCHITECTURE.md` → `documentation/architecture/CMS_ARCHITECTURE.md` → `documentation/testing/TESTING_STRATEGY.md`

### Infrastructure Engineer
`README.md` → `deployment/README.md` → `documentation/operations/INFRASTRUCTURE_MANAGEMENT.md` → `documentation/operations/MONITORING_GUIDE.md` → `documentation/operations/RUNBOOK.md` → `deployment/github-secrets-setup.md`

### SRE / On-Call Engineer
`documentation/operations/RUNBOOK.md` → `documentation/operations/MONITORING_GUIDE.md` → `documentation/operations/DISASTER_RECOVERY.md` → `documentation/operations/INCIDENT_RESPONSE.md`

### Solutions Architect
`documentation/architecture/SYSTEM_OVERVIEW.md` → all `documentation/architecture/` files → `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` → `documentation/architecture/SECURITY_OVERVIEW.md`

### Security Engineer
`documentation/architecture/SECURITY_OVERVIEW.md` → `documentation/operations/INCIDENT_RESPONSE.md` → `documentation/operations/AUTH_SETUP_GUIDE.md`

---

## 10. What Goes Where — Quick Decision Guide

| "I need to document..." | Correct location |
|------------------------|-----------------|
| A new or changed Strapi CMS component schema | `documentation/cms-components/` |
| A new architectural pattern or component | `documentation/architecture/` |
| A technical decision with trade-offs | `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` |
| How to run or troubleshoot in production | `documentation/operations/RUNBOOK.md` |
| A deployment procedure for Azure | `deployment/` |
| A diagram or visual | `documentation/diagrams/` |
| Storybook stories for a UI component | Colocated with the component (`*.stories.tsx` next to component file) |
