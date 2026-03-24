# Technology Swap Guide

Each section covers one swappable component: what to change, what to leave alone, and known gotchas.

---

## Cloud Provider (Azure → Other)

**Current:** Azure (Bicep templates in `infrastructure/`, Azure Container Apps, Azure SQL, Azure Blob Storage)

**What to change:**
- Replace `infrastructure/` with Terraform (or CDK, Pulumi, etc.) targeting your chosen cloud
- Update `.github/workflows/` deploy jobs — remove Azure-specific steps (`azure/login`, `az acr`, `az containerapp`)
- Replace Azure Application Insights with your cloud's observability service (see Monitoring section below)
- Replace `ConnectionStrings__DefaultConnection` SQL Server string with your cloud's managed database connection string

**What to leave alone:**
- Application code — no Azure SDK calls in `app/`, `components/`, or `lib/`
- The Docker-based build pipeline — containers are portable
- Auth provider env vars — those are independent of the cloud provider

**Gotchas:**
- The Bicep `main.parameters.template.json` file contains parameter names used in GitHub Actions secrets. Update secret names in your repo if you change the IaC parameter surface.
- Azure Container Apps injects secrets as environment variables via the `secrets` and `env` sections in Bicep. Other platforms may use different injection mechanisms — update accordingly.

---

## Auth Provider (Azure Entra External ID → Any OIDC)

**Current:** Azure Entra External ID, configured in `auth.ts` via Next Auth v5

**What to change — env vars only:**

```env
AUTH_ENTRA_ISSUER=https://your-new-provider/issuer-url
AUTH_ENTRA_CLIENT_ID=your-new-client-id
AUTH_ENTRA_CLIENT_SECRET=your-new-client-secret
AUTH_API_SCOPE_READ=your-read-scope
AUTH_API_SCOPE_WRITE=your-write-scope
```

Backend (set in environment or `appsettings.json`):
```
Authentication__Authority=https://your-new-provider/issuer-url
Authentication__Audience=your-api-audience
Authentication__RequireHttpsMetadata=true
```

**What to leave alone:**
- `auth.ts` — provider-agnostic OIDC configuration, reads env vars
- `backend/src/Accelerator.Api/Program.cs` — JWT validation is provider-agnostic
- Authorization policies (`RequireAdmin`, `RequireEditor`) — role names are configurable

**Gotchas:**
- The backend reads roles from the `roles` claim (`RoleClaimType = "roles"` in `Program.cs`). If your provider uses a different claim name (e.g., `role`, `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`), update `RoleClaimType` in the `AddJwtBearer` block.
- Some providers (Auth0, Cognito) require a custom `ClaimActions` mapping. Add these in `auth.ts` if `session.user.roles` is empty after login.
- Entra External ID uses `/.well-known/openid-configuration` discovery. Providers that don't support OIDC discovery require manual `TokenValidationParameters` configuration.

---

## Database (SQLite / SQL Server → PostgreSQL)

**Current:** SQLite for development (auto-selected), SQL Server for production (connection-string-selected)

**What to change:**

1. Add the NuGet package:
   ```bash
   dotnet add backend/src/Accelerator.Data package Npgsql.EntityFrameworkCore.PostgreSQL
   ```

2. In `backend/src/Accelerator.Api/Program.cs`, replace the `UseSqlServer` branch:
   ```csharp
   // Before
   options.UseSqlServer(connectionString, sqlOptions => sqlOptions.EnableRetryOnFailure())

   // After
   options.UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.EnableRetryOnFailure())
   ```

3. Add `using Npgsql.EntityFrameworkCore.PostgreSQL;` to `Program.cs`

4. Remove `Microsoft.EntityFrameworkCore.SqlServer` from `Accelerator.Data.csproj` if not keeping SQL Server

5. Regenerate migrations (PostgreSQL has different SQL dialect):
   ```bash
   dotnet ef migrations remove --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api
   dotnet ef migrations add InitialCreate --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api
   dotnet ef database update --project backend/src/Accelerator.Data --startup-project backend/src/Accelerator.Api
   ```

6. Update connection string:
   ```
   ConnectionStrings__DefaultConnection=Host=localhost;Database=accelerator;Username=postgres;Password=yourpassword
   ```

**What to leave alone:**
- All entity classes, repository interfaces, and service code
- Test projects — they use EF Core InMemory, which is provider-independent
- The SQLite dev path — you can keep it for zero-dependency local dev

**Gotchas:**
- EF Core migrations are dialect-specific. You must regenerate them after switching providers.
- Npgsql maps `DateTime` to `timestamp without time zone` by default. If you use UTC-aware datetimes (`DateTimeKind.Utc`), add `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` or use `timestamptz` explicitly.

---

## CMS (Strapi 5 → Other / Remove)

**Current:** Strapi 5 in `cms/` directory, client in `lib/cms/`

**To remove entirely:** Follow `docs/CMS_REMOVAL_GUIDE.md`.

**To replace with another headless CMS (Contentful, Sanity, etc.):**

1. Replace `lib/cms/client.ts` with a client for the new CMS
2. Update `lib/cms/types.ts` to match the new content model schemas
3. Update the fetch calls in:
   - `app/page.tsx` (home page hero)
   - `app/about/page.tsx`
   - `app/docs/page.tsx`
4. Update `.env.example` / `.env.local` — replace `STRAPI_URL` / `STRAPI_API_TOKEN` with new provider's env vars
5. Remove `cms/` directory and Docker Compose CMS profile if not using Strapi

**What to leave alone:**
- `// CMS:` comments in source files mark CMS-dependent sections — these are your guide
- The fallback content pattern (hardcoded strings when CMS is unavailable) — replicate this for reliability

---

## CSS Framework (Tailwind + shadcn/ui → Other)

**Current:** Tailwind CSS v3 + shadcn/ui components (copy-pasted into `components/ui/`)

**What to change:**
- Replace `components/ui/` with components from your chosen library
- Remove Tailwind config (`tailwind.config.ts`, `postcss.config.js`) if switching away from Tailwind
- Update `app/globals.css` — remove CSS custom properties and `@tailwind` directives
- Remove `tailwindcss`, `autoprefixer`, `tailwind-merge`, `tailwindcss-animate` from `package.json`
- Remove `class-variance-authority` and `clsx` if not using CVA

**What to leave alone:**
- Component behavior and data fetching — only presentation changes
- `components/articles/` — update these to use your new component primitives

**Gotchas:**
- shadcn/ui components in `components/ui/` are copied source code, not npm packages. There is no package to uninstall — just delete the files.
- Tailwind purges unused classes at build time via the `content` array in `tailwind.config.ts`. If you add non-standard class sources, update that array.

---

## Monitoring (Azure Application Insights → Other)

**Current:** `AddApplicationInsightsTelemetry()` in `backend/src/Accelerator.Infrastructure/InfrastructureServiceCollectionExtensions.cs`

**What to change:**

1. Remove `Microsoft.ApplicationInsights.AspNetCore` NuGet package from `Accelerator.Infrastructure.csproj`
2. In `InfrastructureServiceCollectionExtensions.cs`, replace:
   ```csharp
   services.AddApplicationInsightsTelemetry(configuration);
   ```
   With your provider's registration call (e.g., OpenTelemetry, Datadog, New Relic)
3. Remove `APPLICATIONINSIGHTS_CONNECTION_STRING` from env vars / Bicep parameters

**What to leave alone:**
- No `TelemetryClient` is injected directly into application code — all telemetry goes through the ASP.NET Core middleware pipeline
- Health check endpoints (`/health`, `/health/ready`) — these are provider-independent

**Gotchas:**
- Application Insights auto-collects HTTP requests, SQL queries, and exceptions with no code changes. Other providers may require explicit instrumentation setup.

---

## Container Hosting (Azure Container Apps → Other)

**Current:** Azure Container Apps via Bicep in `infrastructure/`

**What to change:**
- Replace or remove `infrastructure/` Bicep templates
- Update `.github/workflows/` deploy jobs — the build step (Docker build + push to ACR) stays the same; only the deploy step changes
- Update secret/env injection to match the target platform (Kubernetes secrets, ECS task definitions, Fly.io secrets, etc.)

**What to leave alone:**
- `Dockerfile` (frontend and backend) — standard multi-stage builds, portable across all container platforms
- Application code
- The GitHub Actions build jobs (lint, test, Docker build) — only the deploy job changes

**Gotchas:**
- The `Dockerfile` exposes ports 3000 (frontend) and 8080 (backend). Update `EXPOSE` and your platform's port mapping if these conflict.
- Azure Container Apps uses managed identity for ACR pull. Other platforms use registry credentials — update your CI/CD secrets accordingly.
