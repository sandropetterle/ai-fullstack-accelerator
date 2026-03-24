# Technical Decisions Log — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** Solutions Architects, Senior Developers
**Purpose:** Append-only log of architectural, security, infrastructure, performance, and technology decisions made during accelerator construction and by teams using it.

> **5 active decisions | 0 archived**
>
> Add new entries at the **top** (newest first). See [DECISION_TEMPLATE.md](DECISION_TEMPLATE.md) for the entry format and [GOVERNANCE.md](../GOVERNANCE.md) Section 6 for the compaction process.

---

## Decision 5: SQLite for Development, SQL Server for Production

**Date:** 2026-03-24
**Title:** Split database provider — SQLite dev, SQL Server prod
**Category:** Infrastructure
**Status:** Active

### Context / Problem

The accelerator needs to work out-of-the-box with zero cloud infrastructure for local development, while being ready for production-grade Azure SQL without code changes.

### Decision

EF Core provider is selected at runtime based on the `ConnectionStrings__DefaultConnection` environment variable:
- **Unset or empty** → `UseSqlite` with a local `accelerator.db` file
- **Non-empty** → `UseSqlServer` with the supplied connection string

SQLite file is created automatically on first `dotnet ef database update`.

### Rationale

SQLite requires zero installation, runs in-process, and creates its database file on first run — the ideal zero-friction experience for anyone cloning the accelerator. The EF Core abstraction means the switch to SQL Server requires only a connection string; no C# changes.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Always SQL Server (via Docker) | Requires Docker Desktop running; adds ~2 minutes to first-run setup |
| Always SQLite (no SQL Server) | Production-grade apps need a real SQL server; SQLite has concurrency limitations |
| PostgreSQL with Npgsql | Azure SQL is the natural fit for Azure Container Apps; keeps infrastructure cohesive |

### Consequences

- Developers never need Docker for the backend
- EF Core InMemory provider is used in tests (not SQLite) to keep tests fast and side-effect-free
- Production migrations must be run manually — not auto-applied on startup

### Files Changed

- `backend/src/Accelerator.Api/Program.cs` — provider selection logic
- `backend/src/Accelerator.Data/ApplicationDbContext.cs` — seed data

### Tests Added

- Repository integration tests use EF Core InMemory provider (not SQLite)

---

## Decision 4: Namespace "Accelerator"

**Date:** 2026-03-24
**Title:** Use "Accelerator" as the C# namespace and project name prefix
**Category:** Architecture
**Status:** Active

### Context / Problem

The accelerator is extracted from a domain-specific project. All C# namespaces, project names, and solution file references needed a generic name that reads well, conveys purpose, and is easily replaced by users running the rename script.

### Decision

All C# projects use the `Accelerator` namespace prefix:
- `Accelerator.Api`, `Accelerator.Core`, `Accelerator.Data`, `Accelerator.Infrastructure`
- Test projects: `Accelerator.Core.Tests`, `Accelerator.Data.Tests`, `Accelerator.Api.Tests`
- Solution file: `Accelerator.sln`

### Rationale

"Accelerator" is generic, professional, and directly communicates the purpose of the codebase. It is short enough to type but distinctive enough that find-and-replace via `scripts/rename-entity.sh` won't produce false positives.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `MyApp` | Too generic; reads poorly in code |
| `Template` | Implies it won't be compiled or run; misleading |
| Keep original project name | Would expose the source project in the public repo |

### Consequences

- Users running `scripts/rename-entity.sh --project-name "YourProject"` will replace all `Accelerator` references
- The rename script must handle both namespace references and file/folder names

### Files Changed

- All `backend/src/` and `backend/tests/` C# project files
- `Accelerator.sln`

### Tests Added

- No tests specifically for naming; all 109 existing tests verify the namespace compiles correctly

---

## Decision 3: CMS Isolated Behind Docker Profile

**Date:** 2026-03-24
**Title:** Strapi CMS only starts with explicit `--profile cms` Docker flag
**Category:** CMS
**Status:** Active

### Context / Problem

The CMS (Strapi 5 + MySQL) adds ~1 GB RAM overhead and is optional for most users of the accelerator. Including it in the default `docker compose up` would penalize all developers who don't need it and create a confusing startup experience.

### Decision

Strapi and MySQL services in `docker-compose.yml` are assigned `profiles: ["cms"]`. They only start when explicitly requested:

```bash
docker compose --profile cms up -d   # Start with CMS
docker compose up -d                  # Start without CMS (default)
```

The frontend falls back to hardcoded defaults when Strapi is unavailable (`CmsUnavailableError` handling in `lib/cms/client.ts`).

### Rationale

Docker Compose profiles are the idiomatic mechanism for optional service groups. Zero startup cost for the common case; explicit opt-in for CMS work. The fallback system means CMS absence never breaks the application.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| Separate `docker-compose.cms.yml` | Requires `-f` flag; non-standard; harder to discover |
| Always include CMS | 1 GB RAM overhead; MySQL startup time; confusing for non-CMS work |
| Remove CMS entirely | CMS is a key differentiator of the accelerator |

### Consequences

- Developers must remember to add `--profile cms` when working on CMS content
- The fallback system adds complexity to each CMS-dependent frontend component
- CMS removal guide (`docs/CMS_REMOVAL_GUIDE.md`) documents how to strip CMS entirely

### Files Changed

- `docker-compose.yml` — `profiles: ["cms"]` on MySQL and Strapi services
- `lib/cms/client.ts` — `CmsUnavailableError` handling
- All CMS-dependent page components — fallback content

### Tests Added

- Frontend tests mock the CMS client to test both success and `CmsUnavailableError` paths

---

## Decision 2: PaginatedResponse.Items as Generic Field Name

**Date:** 2026-03-24
**Title:** Use `items` (not an entity-specific name) for the paginated results array
**Category:** Architecture
**Status:** Active

### Context / Problem

The backend `PaginatedResponse<T>` DTO originally had a domain-specific field name for the results array. When users rename the example entity (Article → Product, etc.), the field name would also need renaming — or the API and frontend would go out of sync.

### Decision

The paginated response DTO uses the generic field name `items` on both the backend C# DTO and the frontend TypeScript type:

```csharp
// C#
public record PaginatedResponse<T>(
    IEnumerable<T> Items, int TotalCount, int CurrentPage, int PageSize, int TotalPages);
```

```typescript
// TypeScript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number; currentPage: number; pageSize: number; totalPages: number;
}
```

### Rationale

`items` is entity-agnostic. After running `scripts/rename-entity.sh`, the API contract remains stable — no consumer needs to know or update the field name. This is the single most important field to genericize because it crosses the API boundary.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `articles` / `products` (entity-specific) | Breaks on entity rename; requires API versioning or migration |
| `data` | Too ambiguous; common source of confusion with response envelopes |
| `results` | Acceptable, but `items` is the most common convention in paginated APIs |

### Consequences

- All list endpoints return `{ items: [...], ... }` — consistent regardless of entity type
- `lib/api/types.ts` uses `PaginatedResponse<ArticleListItem>` with `items` field
- Frontend components access `response.items` — survives entity renames untouched

### Files Changed

- `backend/src/Accelerator.Api/DTOs/PaginatedResponse.cs`
- `lib/api/types.ts`
- All frontend components consuming paginated results

### Tests Added

- Backend: serialization tests confirm field is named `items` in JSON output
- Frontend: API client tests assert `response.items` is correctly mapped

---

## Decision 1: "Article" as Example Domain Entity

**Date:** 2026-03-24
**Title:** Use Article as the example CRUD entity throughout the accelerator
**Category:** Architecture
**Status:** Active

### Context / Problem

The accelerator needs exactly one example entity that demonstrates every operation type (list, detail, create, update, delete, vote, search, filter, pagination, related items). The entity name appears in URLs, code, tests, and documentation — it must read naturally in all contexts.

### Decision

`Article` is the example entity with these fields: `Title`, `Slug`, `ShortDescription`, `FullContent`, `Category` (enum), `Author`, `Status`, `IsFeatured`, `IsTrending`, `VoteCount`, `Tags` (many-to-many), `CreatedDate`, `UpdatedDate`.

Routes: `/articles`, `/articles/[slug]`, `/articles/new`, `/articles/[slug]/edit`.

Users replace `Article` with their domain entity via `scripts/rename-entity.sh --entity-name "Product"`.

### Rationale

Articles map to a wide range of real-world domains (blog posts, knowledge base entries, documentation, product listings with descriptions). The slug-based URL (`/articles/my-article-title`) is immediately recognizable. The entity is rich enough to demonstrate all CRUD operations, voting, tags, categories, status management, and search — without requiring domain-specific business logic.

### Alternatives Evaluated

| Alternative | Why Rejected |
|------------|-------------|
| `Product` | E-commerce specific; pricing/inventory fields confuse the generic demo |
| `Post` | Too blog-specific; "post" doesn't read well in all contexts |
| `Item` | Too abstract; doesn't communicate anything about the entity's shape |
| `Todo` | Classic demo entity but too trivial — doesn't cover all operation types |

### Consequences

- All code, tests, and documentation refer to "Article" until `rename-entity.sh` is run
- 6 seed articles and 18 tags are pre-loaded for an immediate working demo
- The rename script must handle singular/plural and PascalCase/camelCase/kebab-case variants

### Files Changed

- All backend entity, service, repository, controller, and test files
- All frontend page, component, type, and test files
- All documentation examples

### Tests Added

- 109 backend tests (all using Article entity)
- 391 frontend tests (all using Article entity)
