# System Overview

**Last Updated:** 2026-03-24
**Audience:** Solutions Architect, all developers, new contributors
**Purpose:** High-level overview of the AI Fullstack Accelerator system — what it is, what it does, and how its major components interact.

---

## 1. Vision

The AI Fullstack Accelerator is a production-ready full-stack blueprint that developers can clone, rename their domain entity, and ship.

Each "Article" in the accelerator represents an example CRUD entity demonstrating every operation type — list, detail, create, update, delete, vote, search, and filter. Users rename it to their domain entity (Product, Order, Recipe, etc.) via `scripts/rename-entity.sh`.

The platform demonstrates enterprise-grade development practices (Clean Architecture, SOLID, DRY) and is designed for extensibility:

- Provider-agnostic authentication (any OIDC: Entra, Auth0, Cognito, Okta, Keycloak)
- Optional headless CMS (Strapi 5 — isolated behind Docker profile, easy to remove)
- Azure-native IaC with Bicep (swap to Terraform for other clouds)
- Comprehensive testing: unit, integration, E2E, visual regression, performance, accessibility

---

## 2. Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router, React 19) | Server-side rendering, routing, ISR |
| TypeScript | Type safety throughout |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component primitives |
| Auth.js v5 (NextAuth) | Authentication (OIDC provider-agnostic) |
| react-markdown + rehype-sanitize | Safe markdown rendering |
| Sonner | Toast notifications |
| Lucide | Icon library |
| next/image | Optimized image loading |

### Backend

| Technology | Purpose |
|-----------|---------|
| ASP.NET Core 8 (Web API) | RESTful API server |
| C# 12 | Implementation language |
| Entity Framework Core 8 | ORM with code-first migrations |
| FluentValidation | DTO and query validation |
| xUnit + Moq | Testing framework |

### Infrastructure & Platform

| Technology | Purpose |
|-----------|---------|
| Azure Container Apps | Primary hosting (scale-to-zero) |
| Azure SQL | Production database |
| Azure Container Registry | Docker image storage |
| Azure Application Insights | Monitoring and telemetry |
| Azure Key Vault | Secrets management |
| Azure Blob Storage | CMS media files |
| GitHub Actions | CI/CD pipelines |

### CMS (Optional)

| Technology | Purpose |
|-----------|---------|
| Strapi 5 | Headless CMS for all static site content |
| MySQL (Azure Flexible Server) | Strapi production database |
| Docker Compose | Local CMS development (opt-in via `--profile cms`) |

### Development Environment

| Environment | Database | API |
|------------|---------|-----|
| Development | SQLite | http://localhost:5255 |
| Production | Azure SQL | Azure Container Apps URL |

---

## 3. Architecture Components

The system has three distinct application tiers and a shared infrastructure layer:

```
Browser
  │
  ▼
Next.js Frontend (Azure Container App)
  │  - Server Components for ISR/SSR
  │  - Client Components for interactive UI
  │  - Auth.js for session management
  │
  ├──► ASP.NET Core API (Azure Container App)
  │      - RESTful endpoints
  │      - JWT validation via OIDC discovery
  │      - Rate limiting, caching, validation
  │      └──► Azure SQL Database
  │
  └──► Strapi CMS (Azure Container App) [optional]
         - Static content management
         - On-demand ISR revalidation webhook
         └──► Azure MySQL Database
```

```mermaid
flowchart TD
    %% ── External Actor ─────────────────────────────────────────────────────
    User(["👤  User / Browser"])

    %% ── Azure Container Apps ────────────────────────────────────────────────
    subgraph ACA["☁️  Azure Container Apps Environment"]
        FE["⚡ Next.js 16<br/>App Router · ISR · Auth.js v5"]
        API["🔧 ASP.NET Core 8<br/>REST API · JWT · Rate Limiting"]
        CMS["📝 Strapi 5<br/>Headless CMS · Webhook (optional)"]
    end

    %% ── Databases ───────────────────────────────────────────────────────────
    subgraph DB["💾  Databases"]
        direction LR
        SQLDB[("Azure SQL<br/>Articles & Tags")]
        MySQL[("Azure MySQL<br/>CMS Content")]
    end

    %% ── Azure Platform Services ─────────────────────────────────────────────
    subgraph Platform["🔷  Azure Platform Services"]
        direction LR
        OIDC["🔐 OIDC Provider<br/>(Entra / Auth0 / etc.)"]
        Blob["📦 Blob Storage<br/>Media Files"]
        AI["📊 Application Insights<br/>Monitoring"]
    end

    %% ── CI/CD Pipeline ──────────────────────────────────────────────────────
    subgraph CICD["🔄  CI/CD Pipeline"]
        direction LR
        GHA["⚙️  GitHub Actions"]
        ACR["🐳  Container Registry"]
    end

    %% ── Primary Flows ───────────────────────────────────────────────────────
    User -->|"HTTPS"| FE
    FE -->|"REST / JSON"| API
    FE -->|"Content API"| CMS
    FE <-->|"OIDC"| OIDC
    CMS -->|"ISR Webhook"| FE
    API --> SQLDB
    CMS --> MySQL
    CMS -->|"Media Upload"| Blob

    %% ── Secondary Flows (dashed) ────────────────────────────────────────────
    GHA -->|"Push image"| ACR
    ACR -.->|"Pull"| FE
    ACR -.->|"Pull"| API
    ACR -.->|"Pull"| CMS
    FE -.->|"Telemetry"| AI
    API -.->|"Telemetry"| AI

    %% ── Node Styles ─────────────────────────────────────────────────────────
    classDef user     fill:#F9FAFB,stroke:#6B7280,stroke-width:2px,color:#111827,font-weight:bold
    classDef frontend fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A,font-weight:bold
    classDef backend  fill:#D1FAE5,stroke:#059669,stroke-width:2px,color:#064E3B,font-weight:bold
    classDef cms      fill:#EDE9FE,stroke:#7C3AED,stroke-width:2px,color:#3B0764,font-weight:bold
    classDef database fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#78350F,font-weight:bold
    classDef azure    fill:#E0F2FE,stroke:#0284C7,stroke-width:2px,color:#0C4A6E,font-weight:bold
    classDef cicd     fill:#F3F4F6,stroke:#374151,stroke-width:2px,color:#111827,font-weight:bold

    class User user
    class FE frontend
    class API backend
    class CMS cms
    class SQLDB,MySQL database
    class OIDC,Blob,AI azure
    class GHA,ACR cicd
```

---

## 4. Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5255 |
| Strapi CMS (optional) | http://localhost:1337 |
| Swagger (dev only) | http://localhost:5255/swagger |

Production URLs are determined by your Azure Container Apps deployment (configured via `infrastructure/main.parameters.prod.json`).

---

## 5. Key Architectural Decisions

The most significant architectural choices are recorded in `documentation/decisions/TECHNICAL_DECISIONS_LOG.md`. Notable patterns:

- **Authentication:** Auth.js v5 + any OIDC provider — provider-agnostic by design
- **CMS:** Strapi 5 optional headless CMS — isolated behind Docker `--profile cms`
- **Deployment:** Azure Container Apps (scale-to-zero, low-cost)
- **Entity example:** Article — rename via `scripts/rename-entity.sh`
- **API design:** RESTful with versioning, rate limiting, caching, pagination
- **Security:** JWT sessions, CORS, CSP, rate limiting, non-root containers

---

## 6. Further Reading

| Topic | Document |
|-------|---------|
| Backend layer details, API reference, data model | [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) |
| Frontend App Router, auth flow, component structure | [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md) |
| Strapi CMS content model, webhooks, gotchas | [CMS_ARCHITECTURE.md](CMS_ARCHITECTURE.md) |
| Entity model, seeding, enum mapping | [DATA_MODEL.md](DATA_MODEL.md) |
| Auth, CORS, CSP, rate limiting, security headers | [SECURITY_OVERVIEW.md](SECURITY_OVERVIEW.md) |
| Bicep IaC, resource inventory, deploy workflow | [../operations/INFRASTRUCTURE_MANAGEMENT.md](../operations/INFRASTRUCTURE_MANAGEMENT.md) |
| Azure deployment guide | [../../deployment/README.md](../../deployment/README.md) |
