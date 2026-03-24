# Architecture Decisions

The key "why" decisions behind this accelerator — written for a developer joining the project who wants to understand the choices without reading all the architecture documentation.

Decisions are ordered thematically, not chronologically. The source of truth for individual decisions is `documentation/decisions/TECHNICAL_DECISIONS_LOG.md`.

---

## 1. Clean Architecture

**Decision:** The backend is structured in four layers — `Api`, `Core`, `Infrastructure`, `Data` — with a strict dependency rule: outer layers depend on inner layers, never the reverse.

**Why:** Clean Architecture's dependency rule makes the system testable at every level. The `Core` layer (entities, services, interfaces) has zero framework dependencies — it can be tested with plain unit tests, no database or HTTP context required. Swapping the database (SQLite → SQL Server → PostgreSQL) or adding a new delivery mechanism requires only changes to `Data` or `Api`; `Core` is untouched.

**The layers:**
```
Api/            (Controllers, DTOs, Middleware, Validators)
Infrastructure/ (AppInsights, MemoryCache, TimeProvider, HealthChecks, RateLimiter)
Core/           (Entities, Services, Interfaces, Enums) — no framework dependencies
Data/           (Repositories, DbContext, Migrations)
```

**Trade-off:** More files and indirection than a minimal API. The overhead pays off once the codebase grows beyond a handful of endpoints.

---

## 2. EF Core + Repository Pattern

**Decision:** Data access goes through repository interfaces defined in `Core` and implemented in `Data`. EF Core is the ORM. Tests use EF Core InMemory, not SQLite or a real SQL Server.

**Why:** Repository interfaces in `Core` mean services never import EF Core — they depend on `IArticleRepository`, not `DbContext`. This makes services trivially unit-testable with a mock repository. The InMemory provider in tests avoids I/O entirely while still exercising LINQ-to-Objects translation.

**What this is not:** A generic `IRepository<T>` abstraction over EF Core. Each repository has domain-specific methods (`GetBySlugAsync`, `GetFeaturedAsync`) that reflect actual query needs — not a CRUD wrapper that loses EF's expressive query API.

---

## 3. SQLite for Development, SQL Server for Production

**Decision:** EF Core selects the database provider at runtime based on the `ConnectionStrings__DefaultConnection` environment variable. Empty → SQLite. Non-empty → SQL Server.

**Why:** SQLite requires zero installation and creates its database file automatically. A developer can clone the repo and have a running backend in under two minutes with no Docker, no cloud, no database server. The EF Core abstraction means the switch to SQL Server requires only a connection string — no C# changes.

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decision 5.

---

## 4. Next.js App Router + Server Components

**Decision:** All page-level data fetching happens in React Server Components. Client components (`"use client"`) are used only for interactivity (forms, vote buttons, toasts).

**Why:** Server components fetch data at render time on the server, so no client-side loading spinners or fetch waterfalls. The HTML delivered to the browser is complete and SEO-indexable. Client JavaScript bundle size is reduced — components that never need browser APIs ship zero JS.

**ISR (Incremental Static Regeneration):** Article listing and detail pages use `revalidate` to cache rendered HTML and regenerate it in the background. This gives static-site performance with near-real-time freshness — without the full rebuild cycle of traditional SSG.

**When SSR would be preferred:** User-specific pages (profile, dashboard) that cannot be cached. Those use `cache: 'no-store'` on fetch calls.

---

## 5. ISR over Pure SSR or Pure SSG

**Decision:** Article pages revalidate on a time interval (ISR), not on every request (SSR) or only at build time (SSG).

**Why:** SSG is too stale for a content platform — new articles only appear after a full rebuild. SSR renders on every request, which is expensive at scale and eliminates CDN caching. ISR caches the rendered page at the CDN edge and regenerates it in the background after the revalidation window expires. This gives CDN-speed responses with acceptable freshness.

**Trade-off:** Visitors may see content that is up to `revalidate` seconds old. For an article platform this is acceptable. For real-time data (stock prices, live scores), use SSR or WebSockets.

---

## 6. Provider-Agnostic Authentication

**Decision:** Auth.js (Next Auth v5) handles the frontend session. The backend validates JWTs from any OIDC-compliant provider. Switching providers requires only env var changes.

**Why:** Locking to a single identity provider (Azure Entra, Auth0, Cognito) creates vendor dependency. By reading `AUTH_ENTRA_ISSUER`, `AUTH_ENTRA_CLIENT_ID`, and `AUTH_ENTRA_CLIENT_SECRET` from environment variables, any OIDC-compliant provider works without code changes. The backend's JWT validation is equally provider-agnostic — `Authentication:Authority` and `Authentication:Audience` are the only configuration points.

**Local dev without an OIDC provider:** When `Authentication:Authority` is empty, the backend boots without an authentication scheme. Public endpoints work; protected endpoints return 401. This is intentional — it keeps local development friction-free.

**See also:** `docs/TECHNOLOGY_SWAP_GUIDE.md` Auth Provider section.

---

## 7. JWT Sessions (Not Database Sessions)

**Decision:** Auth.js is configured with the JWT session strategy. Session data is stored in a signed, encrypted cookie — no session table in the database.

**Why:** Database sessions require a sessions table, a cleanup job, and a database read on every authenticated request. JWT sessions are stateless — the server validates the token signature without any I/O. This scales horizontally without sticky sessions or shared session storage, which matters in a containerized deployment where instances come and go.

**Trade-off:** JWT sessions cannot be invalidated server-side before expiry. If you need immediate token revocation (security incident response), you must implement a token blocklist — which reintroduces server-side state. For most applications, short token lifetimes are an acceptable mitigation.

---

## 8. Rate Limiting in the API Layer

**Decision:** Rate limiting is implemented inside the ASP.NET Core application using the built-in `AddRateLimiter` / `UseRateLimiter` middleware, not at a gateway or load balancer.

**Why:** In-process rate limiting is testable (integration tests can hit the limiter and assert 429 responses), portable (works on any host — Azure Container Apps, Kubernetes, bare metal), and requires no additional infrastructure component. A gateway-level rate limiter is easier to bypass and harder to test in CI.

**Where it lives:** `backend/src/Accelerator.Infrastructure/InfrastructureServiceCollectionExtensions.cs` — rate limiter registration is part of `AddInfrastructure()`.

---

## 9. shadcn/ui (Not a Component Library)

**Decision:** UI primitives come from shadcn/ui, which copies component source code into `components/ui/` rather than installing a versioned npm package.

**Why:** Traditional component libraries (Material UI, Ant Design) ship as npm packages. Upgrading a major version can break dozens of components at once. shadcn/ui components are copied source — you own the code. Customization is editing a file, not fighting a theme system. There is no package version to pin, no breaking-change upgrade path, and no bundle overhead from unused components.

**Trade-off:** No automatic updates. New shadcn/ui component versions must be manually copied in. This is a deliberate choice — stability over convenience.

---

## 10. Azure Bicep (Not Terraform)

**Decision:** Infrastructure-as-code uses Azure Bicep in `infrastructure/`.

**Why:** Bicep is Azure-native: it compiles directly to ARM templates, supports all Azure resource types on day one, and is maintained by the Azure team. For a project targeting Azure, Bicep has less abstraction overhead than Terraform's Azure provider. Bicep files are checked into the repo, so Dependabot can track Azure resource API version updates (e.g., `2024-01-01` → `2024-03-01`) and open PRs.

**Trade-off:** Bicep is Azure-only. If you move to AWS or GCP, replace `infrastructure/` with Terraform or the target platform's IaC tool. See `docs/TECHNOLOGY_SWAP_GUIDE.md`.

---

## 11. Azure Container Apps

**Decision:** Both the Next.js frontend and ASP.NET Core backend are deployed as containers to Azure Container Apps.

**Why:** Azure Container Apps offers scale-to-zero — containers cost nothing when idle. For a startup or accelerator project, this eliminates the baseline cost of always-on compute. Container Apps handles TLS termination, ingress, and horizontal scaling without requiring Kubernetes expertise. Secrets are injected as environment variables, keeping the application code infrastructure-agnostic.

**Why not App Service:** App Service does not scale to zero on the standard tier. Container Apps is the right abstraction level — more managed than Kubernetes, more flexible than App Service.

---

## 12. CMS Isolated Behind Docker Profile

**Decision:** Strapi 5 and MySQL only start when `docker compose --profile cms up -d` is used. Default `docker compose up -d` starts only SQL Server.

**Why:** Strapi adds approximately 1 GB RAM overhead and a MySQL instance. Most developers working on the API or frontend do not need the CMS. Making CMS opt-in (via Docker Compose profiles) avoids penalizing the common case. The frontend falls back to hardcoded content when Strapi is unavailable, so CMS absence never breaks the application.

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decision 3 and `docs/CMS_REMOVAL_GUIDE.md`.

---

## 13. "Article" as the Example Domain Entity

**Decision:** The accelerator uses `Article` as its example entity, with a rename script (`scripts/rename-entity.sh`) to replace it with the user's domain entity.

**Why:** Article is rich enough to demonstrate all operation types — list, detail, create, update, delete, vote, search, filter by category, pagination, related items, tags (many-to-many), and status management — without requiring domain-specific business logic. It maps naturally to a wide range of real-world domains: blog posts, knowledge base articles, product descriptions, documentation.

**Why not a generic name like "Item":** Abstract names produce abstract examples that don't demonstrate real-world patterns. `Article` reads naturally in URLs (`/articles/my-title`), component names (`ArticleCard`), and API paths.

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decision 1.

---

## 14. Generic `items` Field in Paginated Responses

**Decision:** The paginated response DTO uses `items` as the field name for the results array on both the backend (`PaginatedResponse<T>.Items`) and frontend (`PaginatedResponse<T>.items`).

**Why:** An entity-specific field name (e.g., `articles`) crosses the API boundary. After running `rename-entity.sh` to rename `Article` to `Product`, a field named `articles` would be inconsistent with the new domain. `items` is entity-agnostic and survives renames untouched on both sides of the API.

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decision 2.

---

## 15. Category Enum Mapping at the API Boundary

**Decision:** Backend enums use PascalCase (`TechnologyAndAI`). Frontend displays spaced strings (`Technology & AI`). All mapping happens in `lib/api/mappers.ts` via `mapBackendCategory()` and `mapFrontendCategory()`.

**Why:** Keeping the mapping in one file means it is easy to find, easy to extend, and impossible to forget. If the mapping were spread across components, a new category value would require hunting through multiple files. Centralizing it also makes the mapping testable in isolation.

**Rule:** Never convert category values inline in components. Always go through `lib/api/mappers.ts`.
