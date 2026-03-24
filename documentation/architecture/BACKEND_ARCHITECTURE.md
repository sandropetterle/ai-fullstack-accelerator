# Backend Architecture

**Last Updated:** 2026-03-24
**Audience:** Backend Developers, Solutions Architects
**Purpose:** Describe the ASP.NET Core 8 backend structure, Clean Architecture layers, patterns used, and links to the full API reference.

---

## 1. Clean Architecture Layers

```
Accelerator.Api            ← HTTP layer: Controllers, DTOs, Middleware, Validators, Filters
        ↓ depends on
Accelerator.Infrastructure ← Cross-cutting: AppInsights, Caching, HealthChecks, RateLimiter
        ↓ depends on
Accelerator.Core           ← Domain layer: Entities, Services, Interfaces, Enums, Value Objects
Accelerator.Data           ← Persistence layer: Repositories, DbContext, Migrations
```

**Dependency rule:** Outer layers depend on inner layers. No reverse dependencies. `Api` also directly references `Core` and `Data` for composition-root decisions (DbContext config, CORS, Auth) that stay in `Program.cs`.

```mermaid
flowchart TD
    %% ── Api Layer ────────────────────────────────────────────────────────────
    subgraph API["🌐  .Api — HTTP Layer"]
        direction TB
        A1["🎮 Controllers<br/>ArticlesController · AuthController"]
        A2["📋 DTOs<br/>Request · Response models"]
        A3["✅ Validators<br/>FluentValidation"]
        A4["🔒 Middleware<br/>Error handling"]
    end

    %% ── Infrastructure Layer ─────────────────────────────────────────────────
    subgraph Infra["🔧  .Infrastructure — Cross-cutting Layer"]
        direction TB
        I1["📊 AddApplicationInsightsTelemetry()"]
        I2["💾 AddMemoryCache() · TimeProvider.System"]
        I3["❤️ AddHealthChecks() + DbContextCheck"]
        I4["🚦 AddRateLimiter() — fixed · api · action"]
    end

    %% ── Core Layer ───────────────────────────────────────────────────────────
    subgraph Core["⚙️  .Core — Domain Layer"]
        direction TB
        C1["🏗️ Entities<br/>Article · Tag"]
        C2["🔌 Interfaces<br/>IArticleRepository · IArticleService"]
        C3["🔧 Services<br/>ArticleService"]
        C4["🗺️ Mappers · Value Objects<br/>ArticleMapper · Slug"]
    end

    %% ── Data Layer ───────────────────────────────────────────────────────────
    subgraph Data["🗄️  .Data — Persistence Layer"]
        direction TB
        D1["📂 Repositories<br/>ArticleRepository · UnitOfWork"]
        D2["🔗 DbContext<br/>ApplicationDbContext"]
        D3["🔄 Migrations<br/>EF Core code-first"]
    end

    %% ── Dependency Direction ─────────────────────────────────────────────────
    API -->|"AddInfrastructure()"| Infra
    API -->|"depends on"| Core
    API -->|"depends on"| Data
    Infra -->|"DbContextCheck"| Data
    Infra -->|"depends on"| Core
    Core -->|"depends on"| Data

    %% ── Styles ───────────────────────────────────────────────────────────────
    classDef api   fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A,font-weight:bold
    classDef infra fill:#F3F4F6,stroke:#374151,stroke-width:2px,color:#111827,font-weight:bold
    classDef core  fill:#D1FAE5,stroke:#059669,stroke-width:2px,color:#064E3B,font-weight:bold
    classDef data  fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#78350F,font-weight:bold

    class A1,A2,A3,A4 api
    class I1,I2,I3,I4 infra
    class C1,C2,C3,C4 core
    class D1,D2,D3 data
```

---

## 2. Key Patterns & Components

### Repository Pattern
- Interface defined in `Core`: `IArticleRepository`
- Implementation in `Data`: `ArticleRepository`
- `GetRelatedArticlesAsync(slug, limit=3)` — category-first + tag-overlap + vote-sorted, `AsNoTracking`

### Unit of Work
- `IUnitOfWork` registered as scoped service in DI
- `ArticleService` calls `repository.SaveAsync()` directly

### ArticleMapper
- Dedicated mapper class (not AutoMapper) in `Core`
- `ToDto`: `Article` → `ArticleListDto` (excludes `FullContent` for list queries)
- `ToDetailDto`: `Article` → `ArticleDetailDto` (includes tags, full content)
- **Category mapping:** Backend enum `General` → frontend string `"General"` (see [DATA_MODEL.md](DATA_MODEL.md))

### Value Objects
- `Slug`: immutable value object with `GeneratedRegex` validation (lowercase alphanumeric + hyphens)

### Memory Caching
- `IMemoryCache` for featured, trending, and related articles
- Cache keys: `featured_articles`, `trending_articles`, `related_articles_{slug}`
- TTL: 5 minutes; `VoteForArticleAsync` invalidates `featured_articles` + `trending_articles`
- Cache hit/miss emitted as `FeaturedArticlesCacheHit` / `TrendingArticlesCacheHit` metrics via `TelemetryClient`

### Business Telemetry
- `TelemetryClient` injected into `ArticleService`
- Events: `ArticleViewed` (slug, category), `ArticleVoted` (articleId), `ArticleSearched` (search, category, tagCount), `ArticleCreated` (slug, category), `ArticleUpdated` (slug, category)
- Metrics: `FeaturedArticlesCacheHit`, `TrendingArticlesCacheHit` (1 = hit, 0 = miss)

### Rate Limiting (Fixed Window)
| Policy | Limit | Window |
|--------|-------|--------|
| `fixed` | 100 req/min | Per IP |
| `api` | 50 req/min | Per IP |
| `action` | 10 req/min | Per IP |

### TimeProvider
- `TimeProvider.System` injected via DI for testable time operations

---

## 3. API Reference

> Full API reference has moved to **[`documentation/api/`](../api/API_REFERENCE_INDEX.md)** — includes DTOs, validation rules, request/response examples, and query parameter details.

Quick links:
- [API Reference Index](../api/API_REFERENCE_INDEX.md) — base URLs, versioning, auth, rate limiting, error shapes
- [Articles API](../api/ARTICLES_API.md) — all `/articles` endpoints with full DTO tables and examples
- [Auth API](../api/AUTH_API.md) — `/auth/me`
- [Health API](../api/HEALTH_API.md) — `/health`, `/health/ready`

---

## 3a. Article Vote Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#D1FAE5', 'primaryBorderColor': '#059669', 'primaryTextColor': '#064E3B', 'noteBkgColor': '#FEF3C7', 'noteTextColor': '#78350F'}}}%%
sequenceDiagram
    actor Client as 👤 Client
    participant RL as 🚦 Rate Limiter<br/>(action: 10/min per IP)
    participant Ctrl as 🎮 ArticlesController
    participant Svc as 🔧 ArticleService
    participant DB as 🗄️ Database

    Client->>RL: POST /api/articles/{id}/vote

    alt Rate limit exceeded
        RL-->>Client: 429 Too Many Requests
    else Within limit
        RL->>Ctrl: Forward request
        Ctrl->>Ctrl: Validate article ID (GUID)

        alt Invalid GUID
            Ctrl-->>Client: 400 Bad Request
        else Valid GUID
            Ctrl->>Svc: VoteForArticleAsync(articleId)
            Note over Svc,DB: Relational (SQLite/SQL Server): atomic ExecuteUpdateAsync()<br/>InMemory (tests): FindAsync() + SaveChangesAsync()
            Svc->>DB: UPDATE Articles SET VoteCount = VoteCount + 1<br/>WHERE Id = @id

            alt Article not found (0 rows updated)
                DB-->>Svc: rowsAffected = 0
                Svc-->>Ctrl: voteCount = -1
                Ctrl-->>Client: 404 Not Found
            else Vote recorded
                DB-->>Svc: rowsAffected = 1
                Svc->>DB: SELECT VoteCount WHERE Id = @id
                DB-->>Svc: voteCount = N
                Svc-->>Ctrl: voteCount = N
                Ctrl-->>Client: 200 OK {articleId, voteCount: N}
                Note over Client: Optimistic UI update confirmed
            end
        end
    end
```

---

## 4. Data Validation

- `FluentValidation` applied to all DTOs: `CreateArticleDto`, `UpdateArticleDto`, `GetArticlesQuery`
- All text fields have `MaxLength` constraints
- Tags must not be empty or contain only whitespace
- Category validated via `Enum.TryParse` in FluentValidation; controller uses `Enum.Parse` (safe — FluentValidation runs first)
- Automatic model validation via `AddValidatorsFromAssembly` + `AddFluentValidationAutoValidation`

---

## 5. Error Handling

- Global error handling middleware (`ExceptionHandlingMiddleware`): returns consistent JSON error responses
- `OperationCanceledException` from client disconnects caught separately, logged at `Information` (not `Error`) to reduce noise
- Other exceptions logged at `Error` level with full details (server-side only — not exposed to clients)
- No exception details leaked to clients in production

---

## 6. Performance Optimizations

- **EF Core projections:** `Select()` excludes `FullContent` from list queries (only fetched on detail)
- **Atomic SQL updates:** `ExecuteUpdateAsync()` for vote operations to prevent race conditions
- **Memory caching:** Featured, trending, and related articles cached for 5 minutes
- **Efficient indexing:** Database indexed on slug, category, and tags
- **Pagination:** All list endpoints paginate to limit data transfer
- **`AsNoTracking()`** on all read-only queries

---

## 6a. Article Lifecycle

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#D1FAE5', 'primaryBorderColor': '#059669', 'primaryTextColor': '#064E3B', 'noteBkgColor': '#FEF3C7', 'noteTextColor': '#78350F'}}}%%
stateDiagram-v2
    [*] --> Draft : Editor creates article

    Draft --> Published : Set status = Published
    Published --> Draft : Set status = Draft
    Draft --> Draft : Editor saves edits
    Published --> Published : Editor saves edits
    Published --> Deleted : Admin deletes
    Draft --> Deleted : Admin deletes
    Deleted --> [*]

    note right of Draft
        Not returned by GET /articles<br/>Visible to Editor+ via direct URL
    end note

    note right of Published
        Returned by all list + search<br/>endpoints. Visible to all users.
    end note
```

---

## 7. Project Structure

```
backend/
├── src/
│   ├── Accelerator.Api/
│   │   ├── Controllers/
│   │   │   ├── ArticlesController.cs
│   │   │   └── AuthController.cs
│   │   ├── DTOs/
│   │   ├── Middleware/
│   │   ├── Validators/
│   │   ├── Filters/
│   │   └── Program.cs
│   ├── Accelerator.Core/
│   │   ├── Entities/          ← Article, Tag
│   │   ├── Enums/             ← ArticleCategory, ArticleStatus
│   │   ├── Interfaces/        ← IArticleRepository, IArticleService, IUnitOfWork
│   │   ├── Services/          ← ArticleService
│   │   ├── Mappers/           ← ArticleMapper
│   │   └── ValueObjects/      ← Slug
│   └── Accelerator.Data/
│       ├── Repositories/      ← ArticleRepository, UnitOfWork
│       ├── Migrations/
│       └── ApplicationDbContext.cs
└── tests/
    ├── Accelerator.Core.Tests/
    ├── Accelerator.Data.Tests/
    └── Accelerator.Api.Tests/   ← includes integration tests
```

---

## 7a. Backend Domain Model

```mermaid
classDiagram
    class Article {
        +Guid Id
        +string Title
        +Slug Slug
        +string ShortDescription
        +string FullContent
        +ArticleCategory Category
        +string Author
        +DateTime CreatedDate
        +DateTime UpdatedDate
        +int VoteCount
        +ArticleStatus Status
        +bool IsFeatured
        +bool IsTrending
        +ICollection~Tag~ Tags
    }

    class Tag {
        +Guid Id
        +string Name
        +ICollection~Article~ Articles
    }

    class IArticleRepository {
        <<interface>>
        +GetAllAsync(query) Task~PagedResult~
        +GetBySlugAsync(slug) Task~Article~
        +GetFeaturedAsync() Task~IEnumerable~
        +GetTrendingAsync() Task~IEnumerable~
        +GetRelatedArticlesAsync(slug, limit) Task~IEnumerable~
        +CreateAsync(article) Task
        +UpdateAsync(article) Task
        +DeleteAsync(id) Task~bool~
        +VoteAsync(id) Task~Article~
        +SaveAsync() Task
    }

    class IArticleService {
        <<interface>>
        +GetAllAsync(query) Task~PagedResult~
        +GetBySlugAsync(slug) Task~ArticleDetailDto~
        +GetFeaturedAsync() Task~IEnumerable~
        +GetTrendingAsync() Task~IEnumerable~
        +GetRelatedArticlesAsync(slug) Task~IEnumerable~
        +CreateAsync(dto) Task~ArticleDetailDto~
        +UpdateAsync(id, dto) Task~ArticleDetailDto~
        +DeleteAsync(id) Task~bool~
        +VoteAsync(id) Task~ArticleDetailDto~
    }

    class ArticleService {
        -IArticleRepository _repository
        -IMemoryCache _cache
    }

    class ArticleRepository {
        -ApplicationDbContext _context
    }

    class IUnitOfWork {
        <<interface>>
        +IArticleRepository Articles
        +SaveAsync() Task
    }

    class ArticleMapper {
        <<static>>
        +ToDto(article)$ ArticleListDto
        +ToDetailDto(article)$ ArticleDetailDto
    }

    class Slug {
        <<value object>>
        +string Value
        +Slug(value)
    }

    Article "1" --> "0..*" Tag : many-to-many via ArticleTag
    ArticleService ..|> IArticleService
    ArticleRepository ..|> IArticleRepository
    ArticleService --> IArticleRepository : uses
    ArticleMapper --> Article : maps to DTOs
    Article --> Slug : value object
```

---

## 8. Testing

- **Framework:** xUnit + Moq + FluentAssertions
- **Repository tests:** EF Core InMemory provider
- **Integration tests:** `WebApplicationFactory` with `TestAuthHandler` (header-driven auth via `X-Test-Roles`)
- **Current count:** 109 tests passing
- **Coverage:** ~85% on testable code

See [../testing/TESTING_STRATEGY.md](../testing/TESTING_STRATEGY.md) for full testing approach.

---

## 9. Configuration

```bash
# Backend environment variables
ConnectionStrings__DefaultConnection=   # Empty/unset = SQLite (local dev); non-empty = SQL Server (production)
FrontendUrl=http://localhost:3000        # Single CORS origin (legacy); production uses FrontendUrls array
FrontendUrls__0=https://example.com     # Multiple CORS origins (current); localhost:3000 auto-added in Development only
Authentication__Authority=              # OIDC authority (optional; auth disabled if not set)
Authentication__Audience=               # API app client ID
Authentication__RequireHttpsMetadata=true
```

See [../../deployment/github-secrets-setup.md](../../deployment/github-secrets-setup.md) for production secrets configuration.
