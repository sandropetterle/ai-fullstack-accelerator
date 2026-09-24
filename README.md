# AI Fullstack Accelerator

[![Test Suite](https://github.com/sandropetterle/ai-fullstack-accelerator/actions/workflows/test.yml/badge.svg)](https://github.com/sandropetterle/ai-fullstack-accelerator/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/sandropetterle/ai-fullstack-accelerator/branch/master/graph/badge.svg)](https://codecov.io/gh/sandropetterle/ai-fullstack-accelerator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Use this template](https://img.shields.io/badge/Use%20this-template-2ea44f?logo=github&logoColor=white)](https://github.com/sandropetterle/ai-fullstack-accelerator/generate)

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![.NET 10](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Strapi 5](https://img.shields.io/badge/Strapi-5-4945FF?logo=strapi&logoColor=white)](https://strapi.io)
[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-0078D4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/products/container-apps)

> **Production-ready full-stack blueprint** — Next.js 16 + ASP.NET Core 10 + optional Strapi 5 CMS + Azure IaC.
> Clone, rename your entity, and ship.

## What the "AI" in the name means

It describes how you build with the template, not what the template does. The running application has no AI features: nothing calls a model, and there is nothing AI-related to configure or remove.

The repository ships set up for development with an AI coding assistant:

- **[`CLAUDE.md`](CLAUDE.md)**: commands, an architecture quick-reference and the working rules. Claude Code loads it at the start of every session; it is plain Markdown, so other assistants can be pointed at it.
- **Rules CI enforces.** Neither an assistant nor a person can skip these without a red build or a visible diff:
  - frontend statements, branches, functions and lines must each stay at 70% or more (`coverageThreshold` in `jest.config.mjs`, run by `npm run test:ci` in CI)
  - `Core` must not reference ASP.NET Core, EF Core or Application Insights (`CoreDependencyRuleTests`, see [Decision 1](docs/ARCHITECTURE_DECISIONS.md#1-clean-architecture))
  - no pending EF Core model changes for either database provider
  - lint, type-check and production build
- **Rules that are conventions.** `CLAUDE.md` and the PR template ask for every architectural, security and infrastructure decision to be recorded in the [decision log](documentation/decisions/TECHNICAL_DECISIONS_LOG.md), each kind of document to go in its designated folder, and category values to go through `lib/api/mappers.ts`. Nothing checks these automatically.
- **Update prompts.** [docs/UPDATE_GUIDE.md](docs/UPDATE_GUIDE.md#ai-assisted-update-prompts) has ready-to-use prompts for dependency updates, major-version upgrade reviews and vulnerability triage.

Why ship it this way, and what it costs: [Decision 16](docs/ARCHITECTURE_DECISIONS.md#16-configured-for-ai-assisted-development).

## What's Included

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | ASP.NET Core 10, Clean Architecture, Entity Framework Core 10, FluentValidation |
| Auth | Auth.js v5 + any OIDC provider (Entra, Auth0, Cognito, Okta, Keycloak) |
| CMS | Optional headless CMS (Strapi 5): bring your own, see [Optional: Strapi CMS](#optional-strapi-cms) |
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

## Database Migrations

The API uses SQLite when no `ConnectionStrings:DefaultConnection` is configured (local dev) and SQL Server otherwise. Each provider has its own EF Core migration set ([Decision 15](documentation/decisions/TECHNICAL_DECISIONS_LOG.md)), so add every model change to **both**:

```bash
# SQLite (dev default) -> backend/src/Accelerator.Data/Migrations
dotnet ef migrations add MyChange --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api

# SQL Server -> backend/src/Accelerator.Data.SqlServer/Migrations
# The connection string after `--` is what makes the API select the SQL Server provider.
dotnet ef migrations add MyChange --project backend/src/Accelerator.Data.SqlServer --startup-project backend/src/Accelerator.Api \
  -- --ConnectionStrings:DefaultConnection "Server=localhost,1433;Database=AcceleratorDb;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True"

# Apply: same --project / connection-string pairing, with `database update`
dotnet ef database update --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api
dotnet ef database update --project backend/src/Accelerator.Data.SqlServer --startup-project backend/src/Accelerator.Api \
  -- --ConnectionStrings:DefaultConnection "<SQL Server connection string>"
```

The SQL Server connection string above matches the `sqlserver` service in `docker-compose.yml` (`docker compose up -d`). CI applies both sets to fresh databases and runs `dotnet ef migrations has-pending-model-changes` for each.

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

## Optional: Strapi CMS

The accelerator's frontend can read hero/labels/page content from a headless CMS, but that CMS is **bring your own** — it is not committed to this repo. `cms/` currently holds only a `Dockerfile` (and `.dockerignore`) as a starting point for a production container build; there is no Strapi application source checked in.

To use it:

1. Scaffold a Strapi 5 app into `cms/`: `npx create-strapi@latest cms` (check the Strapi docs for the current flags for your use case — non-interactive/quickstart options change between releases).
2. Set `STRAPI_URL` and `STRAPI_API_TOKEN` in `.env.local` (see `.env.example`).
3. Start it alongside the rest of the stack with `docker compose --profile cms up -d` (see [Decision 3](documentation/decisions/TECHNICAL_DECISIONS_LOG.md)).

The frontend does **not** require Strapi to run. `lib/cms/client.ts`'s `fetchStrapi()` catches network/HTTP failures and throws `CmsUnavailableError`; `safeFetch()` in `lib/cms/queries.ts` catches it and returns hardcoded fallbacks (nav/footer, pages, labels). So the app runs fine with `STRAPI_URL` unset/unreachable — you only need to scaffold and run Strapi if you want to manage that content from a CMS instead of hardcoding it. See [CMS Removal Guide](docs/CMS_REMOVAL_GUIDE.md) if you don't want the integration at all.

## Project Structure

```
.
├── app/                    # Next.js App Router pages
├── components/             # React components (ui/, layout/, articles/, home/)
├── lib/                    # API client, types, CMS client, hooks
├── backend/                # ASP.NET Core 10 (Clean Architecture)
│   └── src/
│       ├── Accelerator.Api/          # Controllers, DTOs, Middleware, Validators
│       ├── Accelerator.Core/         # Entities, Services, Interfaces, Enums
│       ├── Accelerator.Data/         # Repositories, DbContext, SQLite migrations
│       ├── Accelerator.Data.SqlServer/ # SQL Server migrations
│       └── Accelerator.Infrastructure/ # AppInsights, Caching, Rate Limiting
├── cms/                    # Dockerfile only — scaffold Strapi 5 yourself, see Optional: Strapi CMS above
├── infrastructure/         # Azure Bicep IaC
├── deployment/             # Deployment scripts and guides
├── docs/                   # Accelerator guides (getting started, tech swap, etc.)
├── documentation/          # Architecture, API, testing, operations docs
├── scripts/                # rename-entity + setup-project scripts
└── e2e/                    # Playwright cross-browser E2E tests
```

## License

MIT — see [LICENSE](LICENSE).
