# Documentation Index — AI Fullstack Accelerator

**Last Updated:** 2026-09-24
**Audience:** All contributors
**Purpose:** Central map of every documentation file in the accelerator. Use this as your starting point when you need to find or update documentation.

> Governed by [documentation/GOVERNANCE.md](documentation/GOVERNANCE.md). Update this index whenever a file is created, moved, or deleted.

---

## Entry Points

| File | Purpose |
|------|---------|
| [README.md](README.md) | Project overview, quick-start setup, tech stack summary |
| [CLAUDE.md](CLAUDE.md) | AI assistant context — commands, architecture quick-ref, mandatory rules |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | This file — map of all documentation |

---

## Accelerator Guides (`docs/`)

Task-oriented guides for someone adopting the template. `documentation/` below is the reference for the system itself.

| File | Purpose |
|------|---------|
| [GETTING_STARTED.md](docs/GETTING_STARTED.md) | Full setup walkthrough from a fresh clone, plus a tour of the codebase |
| [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) | The 16 key "why" decisions, each with its trade-off |
| [TECHNOLOGY_SWAP_GUIDE.md](docs/TECHNOLOGY_SWAP_GUIDE.md) | Replacing a component (database, auth provider, cloud, CMS, telemetry) |
| [UPDATE_GUIDE.md](docs/UPDATE_GUIDE.md) | Dependency updates, major-version upgrades, AI-assisted update prompts |
| [CMS_REMOVAL_GUIDE.md](docs/CMS_REMOVAL_GUIDE.md) | Stripping the optional Strapi integration |

---

## Architecture

| File | Purpose |
|------|---------|
| [SYSTEM_OVERVIEW.md](documentation/architecture/SYSTEM_OVERVIEW.md) | Vision, tech stack, high-level architecture diagram, data flow |
| [BACKEND_ARCHITECTURE.md](documentation/architecture/BACKEND_ARCHITECTURE.md) | Clean Architecture layers, ArticleService, EF Core, caching, rate limiting |
| [FRONTEND_ARCHITECTURE.md](documentation/architecture/FRONTEND_ARCHITECTURE.md) | Next.js App Router, server/client components, ISR, auth flow |
| [CMS_ARCHITECTURE.md](documentation/architecture/CMS_ARCHITECTURE.md) | Strapi 5 setup, content types, ISR webhook, deployment |
| [DATA_MODEL.md](documentation/architecture/DATA_MODEL.md) | Article entity, enums (ArticleCategory/ArticleStatus), ERD, migrations |
| [SECURITY_OVERVIEW.md](documentation/architecture/SECURITY_OVERVIEW.md) | Auth architecture, OIDC flow, authorization policies, security headers |

---

## API Reference

| File | Purpose |
|------|---------|
| [API_REFERENCE_INDEX.md](documentation/api/API_REFERENCE_INDEX.md) | Base URLs, versioning, authentication, error format, rate limiting |
| [ARTICLES_API.md](documentation/api/ARTICLES_API.md) | All 9 article endpoints with request/response DTOs and examples |
| [AUTH_API.md](documentation/api/AUTH_API.md) | `/auth/me` — current user profile endpoint |
| [HEALTH_API.md](documentation/api/HEALTH_API.md) | `/health` and `/health/ready` endpoints |

---

## Operations

| File | Purpose |
|------|---------|
| [RUNBOOK.md](documentation/operations/RUNBOOK.md) | Step-by-step operational procedures, troubleshooting, deployment commands |
| [MONITORING_GUIDE.md](documentation/operations/MONITORING_GUIDE.md) | Application Insights, KQL queries, alert thresholds, dashboards |
| [DISASTER_RECOVERY.md](documentation/operations/DISASTER_RECOVERY.md) | RTO/RPO targets, backup strategy, recovery procedures |
| [INCIDENT_RESPONSE.md](documentation/operations/INCIDENT_RESPONSE.md) | Security incident classification, response phases, communication templates |
| [INFRASTRUCTURE_MANAGEMENT.md](documentation/operations/INFRASTRUCTURE_MANAGEMENT.md) | Bicep IaC structure, deploy workflow, secrets management |
| [AUTH_SETUP_GUIDE.md](documentation/operations/AUTH_SETUP_GUIDE.md) | OIDC provider setup guide (Azure Entra as reference implementation) |

---

## Testing

| File | Purpose |
|------|---------|
| [TESTING_STRATEGY.md](documentation/testing/TESTING_STRATEGY.md) | Test types, tools, folder structure, coverage gates, E2E auth strategy |
| [MANUAL_TEST_PLAN.md](documentation/testing/MANUAL_TEST_PLAN.md) | Pre-release manual test checklist (91 test cases across 9 suites) |
| [PERFORMANCE_BASELINE_GUIDE.md](documentation/testing/PERFORMANCE_BASELINE_GUIDE.md) | Lighthouse procedure, Core Web Vitals targets, Lighthouse CI config |

---

## Technical Decisions

| File | Purpose |
|------|---------|
| [TECHNICAL_DECISIONS_LOG.md](documentation/decisions/TECHNICAL_DECISIONS_LOG.md) | Append-only log of architectural and technology decisions |
| [DECISION_TEMPLATE.md](documentation/decisions/DECISION_TEMPLATE.md) | Template for new decision entries |

---

## CMS Components

| File | Purpose |
|------|---------|
| [COMPONENT_INDEX.md](documentation/cms-components/COMPONENT_INDEX.md) | Master index of all Strapi CMS component schemas |

---

## Diagrams

| File | Purpose |
|------|---------|
| [DIAGRAM_INDEX.md](documentation/diagrams/DIAGRAM_INDEX.md) | Inventory of all 14 Mermaid diagrams and color palette conventions |

---

## Governance

| File | Purpose |
|------|---------|
| [GOVERNANCE.md](documentation/GOVERNANCE.md) | Folder rules, naming conventions, lifecycle policies, stakeholder reading paths |

---

## Deployment

| File | Purpose |
|------|---------|
| [infrastructure/README.md](infrastructure/README.md) | What the Bicep provisions, deploying and tearing it down, turning on the opt-in deploy workflows |
| [.github/REPO_VARIABLES.md](.github/REPO_VARIABLES.md) | GitHub secrets and variables for the deploy workflows, including the `AZURE_DEPLOY_ENABLED` gate |
| `deployment/*.ps1` | Scripts: GitHub OIDC federation (`setup-github-oidc.ps1`), registry pull access (`configure-acr-access.ps1`), resource cleanup (`azure-cleanup.ps1`) |

---

## Repository

| File | Purpose |
|------|---------|
| [CONTRIBUTING.md](.github/CONTRIBUTING.md) | Local setup, commit conventions, PR checklist |
| [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) | PR checklist (tests, coverage, docs, decision log) |
| [SECURITY.md](.github/SECURITY.md) | How to report a vulnerability |
| [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md) | Contributor Covenant |
