# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Fullstack Accelerator: Next.js 16 + ASP.NET Core 8 + Strapi 5 CMS with Clean Architecture.
Example domain entity: **Article** (rename via `scripts/rename-entity.sh`).

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Sonner, react-markdown with rehype-sanitize
- **Backend:** ASP.NET Core 8, Entity Framework Core 8, FluentValidation, API Versioning, Rate Limiting
- **Database:** SQLite (development), SQL Server (production)
- **Deployment:** Azure Container Apps
- **Testing:** Jest + React Testing Library (frontend), xUnit + Moq (backend), Playwright (E2E, cross-browser), Lighthouse CI, Chromatic
- **CMS:** Strapi 5 (headless, `cms/` directory), MySQL (production), Azure Blob Storage (media)

## Development Commands

### Frontend (from project root)
```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm run storybook    # Storybook dev server at http://localhost:6006
npm run build-storybook  # Static Storybook build
```

### Backend (from project root)
```bash
dotnet run --project backend/src/Accelerator.Api    # Start API at http://localhost:5255
dotnet build && dotnet test                          # Build and test (from backend/)
dotnet ef database update --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api
dotnet ef migrations add MigrationName --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api
```

Swagger (dev only): http://localhost:5255/swagger

### Docker / CMS (from project root)
```bash
docker compose up -d                    # Start SQL Server only (default)
docker compose --profile cms up -d     # Also start MySQL + Strapi (CMS profile)
docker compose --profile cms down      # Stop CMS containers when not needed
docker compose down                    # Stop all containers
```

## Architecture

### Backend
```
Api/ (Controllers, DTOs, Middleware, Validators)
  ↓ Infrastructure/ (AddInfrastructure: AppInsights, MemoryCache, TimeProvider, HealthChecks, RateLimiter)
  ↓ Core/ (Entities, Services, Interfaces, Enums)
  ↓ Data/ (Repositories, DbContext, Migrations)
```

### Frontend
```
app/articles/page.tsx          # Listing (server component)
app/articles/[slug]/page.tsx   # Detail by slug (server component)
app/login/page.tsx             # Login page
components/ui/                 # shadcn/ui primitives
components/articles/           # Article-specific components
lib/api/                       # client.ts, articles.ts, mappers.ts, types.ts
lib/cms/                       # Strapi CMS client
lib/types/                     # Frontend types
auth.ts                        # Auth.js configuration
```

### Category Enum Mapping
Backend uses PascalCase enums, frontend expects spaced strings.
**Always use `lib/api/mappers.ts`:** `mapBackendCategory()` / `mapFrontendCategory()`

### API Endpoints

Base: `http://localhost:5255/api`

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/articles` | None |
| GET | `/articles/featured` | None |
| GET | `/articles/trending` | None |
| GET | `/articles/{slug}` | None |
| GET | `/articles/{slug}/related` | None |
| POST | `/articles/{id}/vote` | None |
| POST | `/articles` | RequireEditor |
| PUT | `/articles/{id}` | RequireEditor |
| DELETE | `/articles/{id}` | RequireAdmin |
| GET | `/auth/me` | Authorize |
| GET | `/health`, `/health/ready` | None |

## Coverage Verification Rule (MANDATORY)

Whenever you add or modify code in `app/`, `components/`, or `lib/`:
```bash
npm run test:ci   # stmt/branch/fn/line must all be ≥ 70%
```

## Technical Decision Log (MANDATORY)

Update `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` whenever you make an architectural, security, infrastructure, performance, or technology decision.

## Documentation Rules

| Content Type | Folder |
|-------------|--------|
| Architecture | `documentation/architecture/` |
| REST API reference | `documentation/api/` |
| CMS schemas | `documentation/cms-components/` |
| Requirements | `documentation/requirements/` |
| Decisions | `documentation/decisions/` |
| Testing | `documentation/testing/` |
| Operations | `documentation/operations/` |
| Accelerator guides | `docs/` |
