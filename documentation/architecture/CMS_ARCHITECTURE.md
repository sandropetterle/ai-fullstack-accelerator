# CMS Architecture

**Last Updated:** 2026-03-24
**Audience:** Frontend Developers, Solutions Architects, Infrastructure Engineers
**Purpose:** Document the Strapi 5 CMS integration — content model, deployment, ISR revalidation webhook, and known operational gotchas.

---

## 1. Overview

Strapi 5 (headless CMS) manages all **static site content** — page copy, labels, navigation text, and marketing sections. Article data (the application's core domain entities) is stored in Azure SQL and managed via the API, not Strapi.

**CMS is optional.** The frontend falls back to hardcoded defaults when Strapi is unavailable. CMS is isolated behind Docker's `--profile cms` flag — it doesn't start by default. See `docs/CMS_REMOVAL_GUIDE.md` for complete removal instructions.

---

## 2. Content Model

Strapi content types and their purpose:

| Content Type | Purpose |
|-------------|---------|
| `home-page` | Home page content (Dynamic Zone: hero, featured articles, stats) |
| `global-layout` | Shared navigation, footer, site-wide labels |
| `about-page` | About page Dynamic Zone |
| `docs-page` | Documentation page Dynamic Zone |
| `login-page` | Login page labels |
| `error-page` | Error page content with fallback |
| `not-found-page` | 404 page content |
| `article-listing-labels` | Labels for SearchBar, FilterPanel, SortSelector, EmptyState, Pagination |
| `article-detail-labels` | Labels for all article detail sub-components |
| `article-form-labels` | Labels for ArticleForm create/edit |

**Dynamic Zones** allow page-specific component sections to be managed from the CMS without code changes.

For the full component schema reference (field tables, dependency map, reuse guide), see [documentation/cms-components/COMPONENT_INDEX.md](../cms-components/COMPONENT_INDEX.md).

---

## 3. Infrastructure

| Component | Value |
|-----------|-------|
| CMS Framework | Strapi 5 |
| CMS Database (Production) | Azure MySQL Flexible Server |
| CMS Database (Development) | SQLite (via Docker Compose) |
| Media Storage | Azure Blob Storage |
| Hosting | Azure Container App |

**Local development** uses SQLite for the CMS database (via Docker Compose) — no MySQL needed locally.

---

## 4. Local Development

```bash
# Start Strapi + MySQL locally (requires --profile cms; they don't start by default)
docker compose --profile cms up -d

# Stop CMS containers when not in use
docker compose --profile cms down

# Access admin panel
http://localhost:1337/admin

# Seed content
STRAPI_API_TOKEN=<full-access-token> npx tsx cms/data/seed.ts
# Note: use full-access token for seeding (read-only token can't PUT); revoke after seeding
```

> **Note:** MySQL and Strapi are assigned the `cms` profile to avoid running them by default — they each consume ~512 MB RAM. Only start them when actively working on CMS content.

---

## 5. Frontend CMS Client

**`lib/cms/client.ts`** — `fetchStrapi(path, options)`:
- Wraps `fetch()` with error handling
- Network errors (ECONNREFUSED, AggregateError) throw `CmsUnavailableError`
- Enables graceful fallback to hardcoded defaults when Strapi is unavailable

**`lib/cms/queries.ts`** — Content type query functions:
- `getHomePage()`, `getGlobalLayout()`, etc.
- Each uses `populate` parameters to include nested components

**`lib/cms/types.ts`** — TypeScript types for all Strapi responses

**`lib/cms/components.tsx`** — Dynamic Zone component renderers mapped by `__component` field

---

## 6. ISR Revalidation

On-demand revalidation ensures Next.js ISR cache is cleared when content changes in Strapi.

**Webhook:** Strapi fires a POST to `https://<frontend>/api/revalidate?secret=<REVALIDATE_SECRET>` on every entry event (create, update, delete, publish, unpublish).

**Route handler:** `app/api/revalidate/route.ts`
- Validates the `secret` query parameter
- Calls `revalidatePath()` for the affected page(s)
- Returns `{revalidated: true, paths: [...]}` on success
- Returns `{message: "Model not handled"}` for unknown content types

**Expected responses:**
| Scenario | Response |
|----------|---------|
| Wrong/missing secret | 401 |
| Valid secret + known model | 200 `{revalidated: true, paths: [...]}` |
| Valid secret + unknown model | 200 `{message: "Model not handled"}` |

**ISR revalidation times:**
| Route | Time-based TTL | On-demand |
|-------|---------------|-----------|
| Home (`/`) | 300s | ✅ |
| Global layout | 3600s | ✅ |
| Article listings | 120s | — |
| Article details | 600s | — |

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#EDE9FE', 'primaryBorderColor': '#7C3AED', 'primaryTextColor': '#3B0764', 'noteBkgColor': '#FEF3C7', 'noteTextColor': '#78350F'}}}%%
sequenceDiagram
    actor Editor as ✏️ Content Editor
    participant Strapi as 📝 Strapi CMS
    participant Route as ⚡ /api/revalidate
    participant Cache as 🔄 ISR Cache
    actor User as 👤 End User

    Editor->>Strapi: Publish / update content
    Strapi->>Route: POST /api/revalidate?secret=***

    alt Secret invalid
        Route-->>Strapi: 401 Unauthorized
    else Secret valid
        Route->>Cache: revalidatePath(affected paths)
        Cache-->>Route: Paths invalidated
        Route-->>Strapi: 200 {revalidated: true, paths: [...]}
    end

    Note over Cache: Stale pages rebuild<br/>on the next request

    User->>Cache: GET / (any CMS-driven route)
    Cache->>Strapi: Fetch fresh content
    Strapi-->>Cache: Updated content
    Cache-->>User: Fresh rebuilt page
```

---

## 7. Populate API Quirks

> ⚠️ **Known gotcha:** `populate[component]=*` fails with HTTP 400 if the component has a Media relation field (e.g., `seo.ogImage`). Use explicit field selection instead:

```
# ❌ Fails when component has media relation:
populate[seo]=*

# ✅ Use explicit field selection:
populate[seo][fields][0]=title&populate[seo][fields][1]=description
```

Wildcard `*` only works for scalar fields within a component.

---

## 8. Deployment Gotchas

These are hard-won lessons from CMS deployment. Ignoring them will cause cryptic failures.

1. **`@strapi/provider-upload-azure-storage` does not exist on npm.** Use `strapi-provider-upload-azure-storage-v5` (v1.1.0).

2. **Production Dockerfile must include `tsconfig.json` + `config/` source files.** Strapi 5 needs both at runtime to resolve compiled config paths. Without them: crash with `Cannot destructure property 'client' of 'db.config.connection'`.

3. **Pre-create `/app/database/migrations` in Dockerfile** with non-root ownership. The `strapi` user can't `mkdir` at runtime.

4. **Azure Container Apps `:latest` tag can serve stale images.** Use explicit `@sha256:DIGEST` when deploying to force-pull the new image.

5. **Use `npm install` not `npm ci`** in the Dockerfile (no lockfile in Strapi).

6. **`DATABASE_CLIENT` must be `mysql`** not `mysql2` (Strapi 5 dialect names changed).

7. **`tsconfig.json` must include `"./src/**/*.json"`** so JSON schema files are copied to `dist/`.

8. **`docker compose restart` doesn't pick up env var changes.** Use `docker compose up -d --force-recreate`.

9. **On-demand revalidation webhook local URL** uses `host.docker.internal:3000`, not `localhost:3000`.

---

## 9. Key Files

| File | Purpose |
|------|---------|
| `cms/` | Strapi 5 project root |
| `cms/data/seed.ts` | Seeds all hardcoded content into Strapi |
| `cms/Dockerfile` | Production container build |
| `deployment/scripts/provision-cms.ps1` | Provisions Azure MySQL + Container App + Blob Storage |
| `.github/workflows/cms-container-deploy.yml` | CI/CD workflow for CMS deployment |
| `lib/cms/client.ts` | Frontend CMS HTTP client |
| `lib/cms/queries.ts` | Content type query functions |
| `docs/CMS_REMOVAL_GUIDE.md` | Step-by-step guide to remove CMS entirely |
