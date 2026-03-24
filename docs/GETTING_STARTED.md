# Getting Started

A complete guide for getting the AI Fullstack Accelerator running from a fresh clone.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | `node --version` to check |
| .NET SDK | 8.0+ | `dotnet --version` to check |
| Git | Any | |
| Docker Desktop | Any | Optional — only needed if you want SQL Server or the CMS locally; SQLite works out of the box |

---

## Step 1: Clone the repo

```bash
git clone <your-repo-url>
cd ai-fullstack-accelerator
```

---

## Step 2: (Optional) Rename the example entity

The accelerator ships with `Article` as the example domain entity. If your project uses a different name (e.g., `Product`, `Post`, `Listing`), run the rename script before doing anything else.

```bash
./scripts/rename-entity.sh --entity-name "Product" --project-name "MyProject"
```

What the script does:
- Replaces `Article`/`article`/`articles` with your entity name in all files (singular, plural, PascalCase, camelCase, kebab-case)
- Replaces the `Accelerator` C# namespace prefix with your project name
- Updates file and folder names

If you skip this step, everything still works — you just keep the `Article` entity and `Accelerator` namespace.

---

## Step 3: Run the setup script

```bash
./scripts/setup-project.sh
```

This installs npm dependencies (`npm install`) and restores .NET packages (`dotnet restore`). On first run it also applies EF Core migrations to create the local SQLite database with seed data.

---

## Step 4: Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in values. For local development most values can stay as-is:

```env
# Already correct for local dev — leave as-is
NEXT_PUBLIC_API_BASE_URL=http://localhost:5255/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Generate once and set this
AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_TRUST_HOST=true

# Leave empty for local dev without an OIDC provider
AUTH_ENTRA_ISSUER=
AUTH_ENTRA_CLIENT_ID=
AUTH_ENTRA_CLIENT_SECRET=
AUTH_API_SCOPE_READ=
AUTH_API_SCOPE_WRITE=

# Leave as-is for CMS (only needed if running docker compose --profile cms up -d)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=
```

The backend reads its own config from `backend/src/Accelerator.Api/appsettings.Development.json`. No backend `.env` file is needed for local development — SQLite is used automatically when no connection string is set.

---

## Step 5: Start the backend

```bash
dotnet run --project backend/src/Accelerator.Api
```

The API starts at **http://localhost:5255**. On first run, EF Core automatically applies migrations and seeds 6 sample articles. You should see:

```
info: Now listening on: http://localhost:5255
```

---

## Step 6: Start the frontend

In a separate terminal:

```bash
npm run dev
```

The Next.js dev server starts at **http://localhost:3000**.

---

## Tour of the Running App

### URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | Next.js dev server |
| Backend API | http://localhost:5255/api | ASP.NET Core |
| Swagger UI | http://localhost:5255/swagger | Dev only |
| Storybook | http://localhost:6006 | Run `npm run storybook` |

### What to look at

**Home page** (`http://localhost:3000`)
- Hero section and featured articles are CMS-driven with hardcoded fallbacks — they work without Strapi running.

**Articles listing** (`http://localhost:3000/articles`)
- Shows paginated articles from the backend API. Demonstrates server component data fetching with ISR.
- Try the category filter and search.

**Article detail** (`http://localhost:3000/articles/[slug]`)
- Full article with rendered Markdown, related articles, and vote button.
- The slug is derived from the article title.

**Login** (`http://localhost:3000/login`)
- Auth.js login page. Without OIDC env vars configured, login will fail gracefully — this is expected in local dev.

**Swagger UI** (`http://localhost:5255/swagger`)
- All API endpoints with request/response schemas. Try `GET /api/articles` to see the paginated response format.

---

## Where to Look When You Need to Change Things

### Add a new field to the entity

Follow this chain from back to front:

1. **Entity** — `backend/src/Accelerator.Core/Entities/Article.cs` — add the property
2. **Migration** — run `dotnet ef migrations add AddMyField --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api`, then `dotnet ef database update ...`
3. **Repository** — `backend/src/Accelerator.Data/Repositories/ArticleRepository.cs` — include the field in queries if needed
4. **DTO** — `backend/src/Accelerator.Api/DTOs/` — add to the relevant request/response DTO
5. **Controller** — `backend/src/Accelerator.Api/Controllers/ArticlesController.cs` — map the field in create/update actions
6. **Frontend types** — `lib/api/types.ts` — add the property to the TypeScript interface
7. **API client** — `lib/api/articles.ts` — pass the field in create/update calls if needed
8. **Component** — `components/articles/` — display the new field

### Add a new page

Next.js App Router: create a file at the path you want.

```
app/my-new-page/page.tsx        # → /my-new-page
app/my-new-page/[id]/page.tsx   # → /my-new-page/123
```

Server components fetch data directly. Use `lib/api/` functions for backend calls.

### Add a new API endpoint

1. **Controller** — add a new action method in `backend/src/Accelerator.Api/Controllers/ArticlesController.cs` (or create a new controller)
2. **Service interface** — add the method signature to `backend/src/Accelerator.Core/Interfaces/IArticleService.cs`
3. **Service implementation** — implement in `backend/src/Accelerator.Core/Services/ArticleService.cs`
4. **Repository interface** — if the endpoint needs new data access, add to `backend/src/Accelerator.Core/Interfaces/IArticleRepository.cs`
5. **Repository implementation** — implement in `backend/src/Accelerator.Data/Repositories/ArticleRepository.cs`

### Category enum mapping

The backend uses PascalCase enums; the frontend displays spaced strings. Always go through `lib/api/mappers.ts`:
- `mapBackendCategory()` — backend → frontend display string
- `mapFrontendCategory()` — frontend string → backend enum value

Do not bypass these functions.

---

## Customization Checklist

### Branding

| What | Where |
|------|-------|
| Site name | `app/layout.tsx` — update `metadata.title` |
| Primary color | `app/globals.css` — update CSS custom properties (`--primary`, `--primary-foreground`) |
| Color palette | `tailwind.config.ts` — extend or replace the color tokens |
| Logo | Replace `public/logo.svg` (or add your own and update references) |
| Favicon | `app/favicon.ico` |

### Metadata

`app/layout.tsx` — update the exported `metadata` object:

```typescript
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
};
```

### Authentication provider

All OIDC providers (Azure Entra External ID, Auth0, Cognito, Okta, Keycloak, etc.) work via env vars only — no code changes needed:

```env
AUTH_ENTRA_ISSUER=https://your-provider/.well-known/openid-configuration
AUTH_ENTRA_CLIENT_ID=your-client-id
AUTH_ENTRA_CLIENT_SECRET=your-client-secret
AUTH_API_SCOPE_READ=your-read-scope
AUTH_API_SCOPE_WRITE=your-write-scope
```

On the backend, set:
```
Authentication__Authority=https://your-provider
Authentication__Audience=your-api-audience
```

See `docs/TECHNOLOGY_SWAP_GUIDE.md` for provider-specific notes.
