# Architecture Decisions

The key "why" decisions behind this accelerator — written for a developer joining the project who wants to understand the choices without reading all the architecture documentation.

Decisions are ordered thematically, not chronologically. The source of truth for individual decisions is `documentation/decisions/TECHNICAL_DECISIONS_LOG.md`.

---

## 1. Clean Architecture

**Decision:** The backend is structured in four layers — `Api`, `Core`, `Infrastructure`, `Data` — with a strict dependency rule: outer layers depend on inner layers, never the reverse.

**Why:** Clean Architecture's dependency rule makes the system testable at every level. The `Core` layer (entities, services, interfaces) has no framework or vendor dependencies — its only package reference is `Microsoft.Extensions.Caching.Abstractions` (interfaces only). Anything vendor-specific sits behind a Core-owned interface: telemetry goes through `IAppTelemetry`, implemented over Application Insights in `Infrastructure`. Core can be tested with plain unit tests, no database or HTTP context required. Swapping the database (SQLite → SQL Server → PostgreSQL) or adding a new delivery mechanism requires only changes to `Data` or `Api`; `Core` is untouched.

**The layers:**
```
Api/            (Controllers, DTOs, Middleware, Validators)
Infrastructure/ (AppInsights, MemoryCache, TimeProvider, HealthChecks, RateLimiter)
Core/           (Entities, Services, Interfaces, Enums) — no framework dependencies
Data/           (Repositories, DbContext, Migrations)
```

**Enforced, not just documented:** `backend/tests/Accelerator.Core.Tests/Architecture/CoreDependencyRuleTests.cs` fails the build if Core references ASP.NET Core, EF Core or Application Insights.

**Trade-off:** More files and indirection than a minimal API. The overhead pays off once the codebase grows beyond a handful of endpoints.

---

## 2. EF Core + Repository Pattern

**Decision:** Data access goes through repository interfaces defined in `Core` and implemented in `Data`. EF Core is the ORM. Tests use EF Core InMemory, not SQLite or a real SQL Server.

**Why:** Repository interfaces in `Core` mean services never import EF Core — they depend on `IArticleRepository`, not `DbContext`. This makes services trivially unit-testable with a mock repository. The InMemory provider in tests avoids I/O entirely while still exercising LINQ-to-Objects translation.

**What this is not:** A generic `IRepository<T>` abstraction over EF Core. Each repository has domain-specific methods (`GetBySlugAsync`, `GetFeaturedArticlesAsync`) that reflect actual query needs — not a CRUD wrapper that loses EF's expressive query API.

**Trade-off:** InMemory is not a relational database. It doesn't enforce constraints and can't run bulk operations such as `ExecuteUpdateAsync`, so `ArticleRepository.IncrementVoteCountAsync` has a relational path (an atomic `UPDATE ... SET VoteCount = VoteCount + 1`) and an InMemory fallback, and only the fallback runs in tests. The CI migrations job applies both schemas to real SQLite and SQL Server databases, but no test runs queries against them.

---

## 3. SQLite for Development, SQL Server for Production

**Decision:** EF Core selects the database provider at runtime from `ConnectionStrings:DefaultConnection` (any configuration source; in containers, the `ConnectionStrings__DefaultConnection` environment variable). Empty → SQLite. Non-empty → SQL Server.

**Why:** SQLite requires zero installation and creates its database file automatically. A developer can clone the repo and have a running backend in under two minutes with no Docker, no cloud, no database server. Switching an environment to SQL Server takes only a connection string, with no C# changes.

**Trade-off:** Two providers means two EF Core migration sets (`Accelerator.Data` for SQLite, `Accelerator.Data.SqlServer` for SQL Server), and every model change has to be added to both; CI fails if either set drifts from the model. Dev also doesn't match prod: SQLite's type system, collation and concurrency behaviour differ from SQL Server's, so provider-specific bugs only show up against SQL Server (`docker compose up -d` starts one locally).

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decisions 5 and 15.

---

## 4. Next.js App Router + Server Components

**Decision:** All page-level data fetching happens in React Server Components. Client components (`"use client"`) are used only for interactivity (forms, vote buttons, toasts).

**Why:** Server components fetch data at render time on the server, so no client-side loading spinners or fetch waterfalls. The HTML delivered to the browser is complete and SEO-indexable. Client JavaScript bundle size is reduced — components that never need browser APIs ship zero JS.

**ISR (Incremental Static Regeneration):** Article detail pages (`app/articles/[slug]/page.tsx`, `revalidate = 600`, pre-rendered via `generateStaticParams`) cache rendered HTML and regenerate it in the background, as do the home, About and Docs pages. See §5.

**Where rendering is dynamic instead:** The article listing reads `searchParams` (filters, search, sort, page), so Next.js renders it on every request; its `revalidate` export does not cache its HTML. Pages that depend on the signed-in user (`/articles/new`, `/articles/[slug]/edit`, `/login`) call `auth()`, which also makes them dynamic.

**Trade-off:** The server/client split is a boundary developers have to keep in their heads. Anything interactive needs its own `"use client"` component, and props crossing the boundary must be serializable. Getting it wrong shows up as build errors or hydration warnings rather than obvious bugs.

---

## 5. ISR over Pure SSR or Pure SSG

**Decision:** Article pages revalidate on a time interval (ISR), not on every request (SSR) or only at build time (SSG).

**Why:** SSG is too stale for a content platform — new articles only appear after a full rebuild. SSR renders on every request, so every page view costs a render plus an API call and a database query. ISR serves a cached render and regenerates it in the background once the revalidation window expires, so most requests never reach the API.

**Where the cache lives:** The frontend runs as a Next.js `standalone` server on Azure Container Apps, and the ISR cache is local to each container replica. It is not shared between replicas, and it is lost when the app scales to zero (§11), so the first request after an idle period pays a full render. The template does not provision a CDN. Putting Azure Front Door (or any CDN honouring `Cache-Control`) in front of the web app would give edge caching on top, at extra cost.

**Trade-off:** Visitors may see content that is up to `revalidate` seconds old. For an article platform this is acceptable. For real-time data (stock prices, live scores), use SSR or WebSockets. With several replicas, two visitors can briefly see different versions of the same page.

---

## 6. Provider-Agnostic Authentication

**Decision:** Auth.js (Next Auth v5) handles the frontend session using a generic OIDC provider definition. The backend validates JWTs from any OIDC-compliant provider.

**Why:** Locking to a single identity provider (Azure Entra, Auth0, Cognito) creates vendor dependency. The backend is fully provider-agnostic: `Authentication:Authority` and `Authentication:Audience` are its only configuration points. The frontend reads the issuer, client ID and client secret from environment variables (`AUTH_ENTRA_ISSUER`, `AUTH_ENTRA_CLIENT_ID`, `AUTH_ENTRA_CLIENT_SECRET`), so pointing it at another OIDC provider is mostly configuration.

**Local dev without an OIDC provider:** When `Authentication:Authority` is empty, the backend registers a scheme that never authenticates anyone. Public endpoints work; protected endpoints return 401 (covered by `UnconfiguredAuthenticationTests`). This keeps local development friction-free.

**Trade-off:** "Mostly configuration" is not "only configuration". The defaults are Entra-flavoured, and a few places need editing for another provider: the provider `id`/`name` and fallback API scopes in `auth.ts`, role extraction from a `roles` claim (`auth.ts`, and `RoleClaimType = "roles"` in the backend), and the CSP hosts `*.ciamlogin.com` / `login.microsoftonline.com` in `next.config.mjs`. The variable names keep an `ENTRA` prefix even when the provider isn't Entra.

**See also:** `docs/TECHNOLOGY_SWAP_GUIDE.md` Auth Provider section.

---

## 7. JWT Sessions (Not Database Sessions)

**Decision:** Auth.js is configured with the JWT session strategy. Session data is stored in a signed, encrypted cookie — no session table in the database.

**Why:** Database sessions require a sessions table, a cleanup job, and a database read on every authenticated request. JWT sessions are stateless — the server validates the token signature without any I/O. This scales horizontally without sticky sessions or shared session storage, which matters in a containerized deployment where instances come and go.

**Trade-off:** JWT sessions cannot be invalidated server-side before expiry. If you need immediate token revocation (security incident response), you must implement a token blocklist — which reintroduces server-side state. For most applications, short token lifetimes are an acceptable mitigation.

---

## 8. Rate Limiting in the API Layer

**Decision:** Rate limiting is implemented inside the ASP.NET Core application using the built-in `AddRateLimiter` / `UseRateLimiter` middleware, not at a gateway or load balancer.

**Why:** In-process rate limiting is testable in-process (no gateway to stand up), portable (works on any host — Azure Container Apps, Kubernetes, bare metal), and requires no additional infrastructure component. A gateway-level rate limiter is harder to test in CI.

**Where it lives:** `backend/src/Accelerator.Infrastructure/InfrastructureServiceCollectionExtensions.cs` — rate limiter registration is part of `AddInfrastructure()`. Three policies: `fixed` (100/min), `api` (sliding, 50/min) and `action` (10/min, applied to voting).

**Trade-off:** Limits are counted per container replica, so the effective limit scales with the replica count. As configured, each policy is also a single bucket shared by all clients rather than one per client, so one heavy client can use up the budget for everyone. Per-client partitioning needs the client IP, which behind Container Apps ingress means trusting `X-Forwarded-For` (`UseForwardedHeaders`). No test asserts a 429 yet.

---

## 9. shadcn/ui (Not a Component Library)

**Decision:** UI primitives come from shadcn/ui, which copies component source code into `components/ui/` rather than installing a versioned npm package.

**Why:** Traditional component libraries (Material UI, Ant Design) ship as npm packages. Upgrading a major version can break dozens of components at once. shadcn/ui components are copied source — you own the code. Customization is editing a file, not fighting a theme system. There is no bundle overhead from unused components.

**Trade-off:** No automatic updates to the copied components; new shadcn/ui versions must be copied in by hand. The copied code still depends on versioned packages underneath (`@radix-ui/*`, `class-variance-authority`), which Dependabot updates like any other dependency. This is a deliberate choice: stability over convenience.

---

## 10. Azure Bicep (Not Terraform)

**Decision:** Infrastructure-as-code uses Azure Bicep in `infrastructure/`.

**Why:** Bicep is Azure-native: it compiles directly to ARM templates, supports all Azure resource types on day one, and is maintained by the Azure team. For a project targeting Azure, Bicep has less abstraction overhead than Terraform's Azure provider, and there is no state file to store and lock. CI compiles `infrastructure/main.bicep` on every push (`az bicep build`), so syntax and type errors fail the build.

**Trade-off:** Bicep is Azure-only. Dependabot has no Bicep ecosystem, so resource API versions (for example `Microsoft.App/containerApps@2023-05-01`) are not bumped automatically and need a periodic manual review. If you move to AWS or GCP, replace `infrastructure/` with Terraform or the target platform's IaC tool. See `docs/TECHNOLOGY_SWAP_GUIDE.md`.

---

## 11. Azure Container Apps

**Decision:** Both the Next.js frontend and ASP.NET Core backend are deployed as containers to Azure Container Apps.

**Why:** Azure Container Apps offers scale-to-zero — containers cost nothing when idle. For a startup or accelerator project, this eliminates the baseline cost of always-on compute. Container Apps handles TLS termination, ingress, and horizontal scaling without requiring Kubernetes expertise. Secrets are injected as environment variables, keeping the application code infrastructure-agnostic.

**Why not App Service:** App Service does not scale to zero on the standard tier. Container Apps is the right abstraction level — more managed than Kubernetes, more flexible than App Service.

**Trade-off:** Scale-to-zero (`minReplicas: 0` for the API, web and CMS apps in `infrastructure/modules/containerApps.bicep`) means cold starts: the first request after an idle period waits for a container to start, and the per-replica ISR cache (§5) starts empty. Raise `minReplicas` to 1 for latency-sensitive environments, at the cost of always-on compute. Scale-to-zero only covers the containers; Azure SQL, MySQL, Key Vault and the registry are billed whether or not anything is running.

---

## 12. CMS Isolated Behind Docker Profile

**Decision:** Strapi 5 and MySQL only start when `docker compose --profile cms up -d` is used. Default `docker compose up -d` starts only SQL Server.

**Why:** Strapi and its MySQL instance add up to about 1 GB of RAM (each is capped at 512 MB in `docker-compose.yml`). Most developers working on the API or frontend do not need the CMS. Making CMS opt-in (via Docker Compose profiles) avoids penalizing the common case. The frontend falls back to hardcoded content when Strapi is unavailable, so CMS absence never breaks the application.

**Trade-off:** The CMS is bring-your-own. `cms/` holds only a `Dockerfile`, so `docker compose --profile cms up` fails until you scaffold a Strapi app into `cms/` (see the README's "Optional: Strapi CMS"). The Azure IaC, by contrast, always provisions the CMS resources (MySQL, Storage and a CMS container app), whether or not you use them.

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decisions 3 and 14, and `docs/CMS_REMOVAL_GUIDE.md`.

---

## 13. "Article" as the Example Domain Entity

**Decision:** The accelerator uses `Article` as its example entity, with a rename script (`scripts/rename-entity.sh`, or `scripts/rename-entity.ps1` on Windows) to replace it with the user's domain entity.

**Why:** Article is rich enough to demonstrate all operation types — list, detail, create, update, delete, vote, search, filter by category, pagination, related items, tags (many-to-many), and status management — without requiring domain-specific business logic. It maps naturally to a wide range of real-world domains: blog posts, knowledge base articles, product descriptions, documentation.

**Why not a generic name like "Item":** Abstract names produce abstract examples that don't demonstrate real-world patterns. `Article` reads naturally in URLs (`/articles/my-title`), component names (`ArticleCard`), and API paths.

**Trade-off:** A rename is text substitution, not a refactor. The script replaces every occurrence of `Article`/`article` (and the project name) in source, config and docs, then renames matching files and folders. Article-specific behaviour (slugs from titles, voting, featured/trending flags, the seed content) stays and has to be adapted or removed by hand. It also rewrites the existing migrations in place. That is right for a fresh clone, but it means the script must run before any database has been created from those migrations.

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decision 1.

---

## 14. Generic `items` Field in Paginated Responses

**Decision:** The paginated response DTO uses `items` as the field name for the results array on both the backend (`PaginatedResponse<T>.Items`) and frontend (`PaginatedResponse<T>.items`).

**Why:** An entity-specific field name (e.g., `articles`) crosses the API boundary. After running `rename-entity.sh` to rename `Article` to `Product`, a field named `articles` would be inconsistent with the new domain. `items` is entity-agnostic and survives renames untouched in the wire format and the API types on both sides.

**Trade-off:** The neutrality stops at the API client. `mapPaginatedResponse()` in `lib/api/mappers.ts` re-exposes the list as `articles` for components, so a rename still touches that frontend field (the rename script handles it).

**See also:** `documentation/decisions/TECHNICAL_DECISIONS_LOG.md` Decision 2.

---

## 15. Category Enum Mapping at the API Boundary

**Decision:** Category values cross the API boundary only through `lib/api/mappers.ts`: `mapCategoryFromApi()` (backend enum → display string) and `mapCategoryToApi()` (display string → backend enum). Unknown values from the API fall back to `General` with a console warning.

**Why:** Backend enum identifiers (PascalCase, no spaces or symbols) and UI display strings are different vocabularies that only happen to coincide for the current values (`General`, `Tutorial`, `Guide`, `Reference`, `News`). The first category whose display name can't be a C# identifier (`Q&A`, `How-to`) would otherwise need string conversions scattered across components. With one mapping point it is a one-line change in one file, and the mapping is unit-tested in isolation.

**Trade-off:** For today's values the mapping is an identity table, so it is indirection with no immediate payoff. It is kept because removing it later is trivial, while re-introducing it after components have started comparing raw API strings is not.

**Rule:** Never convert category values inline in components. Always go through `lib/api/mappers.ts`.

---

## 16. Configured for AI-Assisted Development

**Decision:** The template ships with what an AI coding assistant needs to work in it: a root `CLAUDE.md` (commands, architecture quick-reference, mandatory rules), a documentation governance model (`documentation/GOVERNANCE.md`), and ready-to-use prompts for recurring maintenance (`docs/UPDATE_GUIDE.md`). This is about how code gets written in projects built from the template. The application itself has no AI features.

**Why:** Projects started from this template are expected to be developed with an assistant in the loop. An assistant starts every session knowing nothing about the repository. Without written context it guesses at commands, puts files in the wrong place and skips steps a team member would know about. So the scaffolding has to carry the project's rules as well as its code, in a form the assistant reads every time.

The rules that matter most are backed by CI rather than prose:

- the 70% coverage threshold lives in `jest.config.mjs` and fails `npm run test:ci`
- the Clean Architecture dependency rule (§1) is a unit test
- EF Core model drift fails the migrations job

An assistant can ignore a sentence in `CLAUDE.md`, but it cannot get a red build merged, and lowering a threshold shows up in the diff a reviewer reads.

**Trade-off:**
- *Tool coupling.* `CLAUDE.md` is the file Claude Code loads automatically. Other assistants look for their own file names (`AGENTS.md`, `.github/copilot-instructions.md`), so a team on another tool has to link or copy it. The content is plain Markdown and tool-neutral; only the file name is not.
- *Harness files go stale.* `CLAUDE.md` restates facts that also live in the code, and nothing checks that they agree. A September 2026 review found it naming mapper functions that had been renamed and a documentation folder that was never created. Keep it short, and prefer rules CI can check over descriptions it cannot.
- *Guardrails apply to humans too.* A quick hand-written spike that drops coverage below 70% fails CI exactly as an assistant's would. That is the point, since a gate anyone can route around protects nothing, but it is real friction.
- *Some rules are still conventions.* Recording decisions in the log and filing documents in the right folder are asked for in `CLAUDE.md` and the PR template, but not checked.
