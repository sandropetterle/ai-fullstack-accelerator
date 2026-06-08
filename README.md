# AI Fullstack Accelerator

[![Test Suite](https://github.com/sandropetterle/ai-fullstack-accelerator/actions/workflows/test.yml/badge.svg)](https://github.com/sandropetterle/ai-fullstack-accelerator/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/sandropetterle/ai-fullstack-accelerator/branch/master/graph/badge.svg)](https://codecov.io/gh/sandropetterle/ai-fullstack-accelerator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Use this template](https://img.shields.io/badge/Use%20this-template-2ea44f?logo=github&logoColor=white)](https://github.com/sandropetterle/ai-fullstack-accelerator/generate)

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![.NET 8](https://img.shields.io/badge/.NET-8-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Strapi 5](https://img.shields.io/badge/Strapi-5-4945FF?logo=strapi&logoColor=white)](https://strapi.io)
[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-0078D4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/products/container-apps)

> **Production-ready full-stack blueprint** — Next.js 16 + ASP.NET Core 8 + Strapi 5 CMS + Azure IaC.
> Clone, rename your entity, and ship.

## What's Included

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | ASP.NET Core 8, Clean Architecture, Entity Framework Core 8, FluentValidation |
| Auth | Auth.js v5 + any OIDC provider (Entra, Auth0, Cognito, Okta, Keycloak) |
| CMS | Strapi 5 (optional, Docker-profiled) |
| Database | SQLite (dev) / SQL Server (prod) |
| IaC | Azure Bicep (Container Apps, Key Vault, SQL, MySQL, Storage, ACR) |
| CI/CD | GitHub Actions (test → build → deploy gate) |
| Testing | Jest + RTL, xUnit + Moq, Playwright (cross-browser), Lighthouse CI, Chromatic |
| Observability | Azure Application Insights (backend telemetry + frontend-ready) |

## Quick Start

```bash
# 1. Clone and enter
git clone https://github.com/YOUR_USERNAME/ai-fullstack-accelerator.git my-project
cd my-project

# 2. Rename the example entity ("Article") to your domain entity
./scripts/rename-entity.sh --entity-name "Product" --project-name "MyProject"
# or on Windows:
# .\scripts\rename-entity.ps1 -EntityName "Product" -ProjectName "MyProject"

# 3. Install dependencies and initialise the database
./scripts/setup-project.sh
# or: .\scripts\setup-project.ps1

# 4. Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 5. Start the backend
cd backend && dotnet run --project src/Accelerator.Api

# 6. Start the frontend (new terminal, project root)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you have a running full-stack application.

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/GETTING_STARTED.md) | Full setup walkthrough and tour |
| [Technology Swap Guide](docs/TECHNOLOGY_SWAP_GUIDE.md) | Replace any component (DB, auth, cloud, CMS) |
| [Update Guide](docs/UPDATE_GUIDE.md) | Dependency updates, major version upgrades |
| [Architecture Decisions](docs/ARCHITECTURE_DECISIONS.md) | Key "why" decisions explained |
| [CMS Removal Guide](docs/CMS_REMOVAL_GUIDE.md) | Strip Strapi if you don't need it |
| [Auth Setup Guide](documentation/operations/AUTH_SETUP_GUIDE.md) | Configure your OIDC provider |
| [Infrastructure](infrastructure/README.md) | Bicep IaC deployment guide |

## Project Structure

```
.
├── app/                    # Next.js App Router pages
├── components/             # React components (ui/, layout/, articles/, home/)
├── lib/                    # API client, types, CMS client, hooks
├── backend/                # ASP.NET Core 8 (Clean Architecture)
│   └── src/
│       ├── Accelerator.Api/          # Controllers, DTOs, Middleware, Validators
│       ├── Accelerator.Core/         # Entities, Services, Interfaces, Enums
│       ├── Accelerator.Data/         # Repositories, DbContext, Migrations
│       └── Accelerator.Infrastructure/ # AppInsights, Caching, Rate Limiting
├── cms/                    # Strapi 5 (optional; start with --profile cms)
├── infrastructure/         # Azure Bicep IaC
├── deployment/             # Deployment scripts and guides
├── docs/                   # Accelerator guides (getting started, tech swap, etc.)
├── documentation/          # Architecture, API, testing, operations docs
├── scripts/                # rename-entity + setup-project scripts
└── e2e/                    # Playwright cross-browser E2E tests
```

## License

MIT — see [LICENSE](LICENSE).
