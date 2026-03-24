# Security Overview

**Last Updated:** 2026-03-24
**Audience:** Security Engineers, Solutions Architects, Backend Developers, Infrastructure Engineers
**Purpose:** Document the security architecture, authentication flow, protection measures against common vulnerabilities, and security headers configuration.

---

## 1. Authentication Architecture

```
Browser
  │
  ▼
Next.js (Auth.js v5 — OIDC client)
  │  - Encrypted JWT session cookie
  │  - No database session table
  │
  ▼
OIDC Provider (Entra External ID / Auth0 / Cognito / Okta / Keycloak)
  │  - Handles sign-in, MFA, branding
  │  - Issues ID token + access token
  │  - Roles embedded in access token via App Roles / claims
  │
  ▼
ASP.NET Core API (JwtBearer middleware)
  - Validates JWT via OIDC discovery endpoint
  - Provider-agnostic — standard AddJwtBearer()
```

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryBorderColor': '#2563EB', 'primaryTextColor': '#1E3A8A', 'noteBkgColor': '#FEF3C7', 'noteTextColor': '#78350F'}}}%%
sequenceDiagram
    actor Browser as 👤 Browser
    participant NextJS as ⚡ Next.js<br/>(Auth.js v5)
    participant OIDC as 🔐 OIDC Provider<br/>(any)
    participant API as 🔧 ASP.NET Core<br/>API

    Browser->>NextJS: GET /login
    NextJS-->>Browser: Redirect to /api/auth/signin
    Browser->>NextJS: GET /api/auth/signin
    NextJS-->>Browser: Redirect to OIDC /authorize URL

    Browser->>OIDC: GET /authorize (OIDC)
    OIDC-->>Browser: Sign-in page
    Browser->>OIDC: Submit credentials

    alt Authentication successful
        OIDC-->>Browser: Redirect with authorization code
        Browser->>NextJS: GET /api/auth/callback?code=...
        NextJS->>OIDC: POST /token (code exchange)
        OIDC-->>NextJS: ID token + access token (roles embedded)
        NextJS->>NextJS: Encrypt session → JWT cookie
        NextJS-->>Browser: Set-Cookie: authjs.session-token
        Note over Browser,NextJS: User is now authenticated
    else Authentication failed
        OIDC-->>Browser: Error redirect
        NextJS-->>Browser: Show error page
    end

    Note over Browser,API: Subsequent API calls (protected endpoints)
    Browser->>NextJS: Submit create/edit article form
    NextJS->>API: POST /api/articles<br/>(Authorization: Bearer access_token)
    API->>OIDC: GET /.well-known/openid-configuration
    OIDC-->>API: JWKS URI
    API->>API: Validate JWT signature + roles claim
    API-->>NextJS: 201 Created
    NextJS-->>Browser: Article saved
```

**Provider-agnostic design:** Swapping OIDC providers requires only changing environment variables. The code uses Auth.js generic `type: "oidc"` provider. See [../operations/AUTH_SETUP_GUIDE.md](../operations/AUTH_SETUP_GUIDE.md) for provider-specific configuration.

**Guard clause:** JwtBearer is only registered when `Authentication:Authority` is configured. Tests and local development work without any OIDC provider configured.

---

## 2. Authorization Model

### Roles

Roles are embedded in the JWT access token via the OIDC provider's App Roles or custom claims.

| Role | Permissions |
|------|------------|
| `Admin` | Full access — create, edit, delete articles |
| `Editor` | Create and edit articles |
| `Viewer` | Read-only (same access as anonymous users) |

### Authorization Policies

Policies are always registered (even without OIDC configured), required for `[Authorize]` attributes to function in tests:

| Policy | Required Role | Applied To |
|--------|-------------|-----------|
| `RequireAdmin` | Admin | DELETE `/articles/{id}` |
| `RequireEditor` | Editor or Admin | POST `/articles`, PUT `/articles/{id}` |
| `RequireViewer` | Any authenticated | GET `/auth/me` |

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryBorderColor': '#2563EB', 'primaryTextColor': '#1E3A8A', 'noteBkgColor': '#FEF3C7', 'noteTextColor': '#78350F'}}}%%
stateDiagram-v2
    [*] --> Unauthenticated : Initial visit

    Unauthenticated --> SigningIn : Click Sign In
    SigningIn --> Unauthenticated : Cancel or auth error
    SigningIn --> Authenticated : OIDC callback success

    state Authenticated {
        [*] --> Viewer
        Viewer --> Editor : Has Editor role
        Viewer --> Admin : Has Admin + Editor roles
        Editor --> Admin : Has Admin role
    }

    Authenticated --> Unauthenticated : Sign out / session expired

    note right of Unauthenticated
        Can browse articles and vote.
        No write access.
    end note

    note right of Authenticated
        Viewer: read-only (same as anonymous)<br/>Editor: create + edit articles<br/>Admin: + delete articles
    end note
```

### Public Endpoints

All GET article endpoints and the vote endpoint are public (no authentication required):
- `GET /articles`, `/articles/featured`, `/articles/trending`, `/articles/{slug}`, `/articles/{slug}/related`
- `POST /articles/{id}/vote`
- `GET /health`, `/health/ready`

---

## 3. Input Validation

| Layer | Mechanism |
|-------|----------|
| Backend DTOs | FluentValidation (`CreateArticleDto`, `UpdateArticleDto`) |
| Backend query params | `GetArticlesQuery` with `Range` / `MaxLength` constraints |
| All text inputs | `MaxLength` constraints on all fields |
| Automatic enforcement | Model validation filter (`AddValidatorsFromAssembly` + validation filter) |

---

## 4. Protection Against Common Vulnerabilities

### XSS (Cross-Site Scripting)
- `rehype-sanitize` on all markdown content rendered on the frontend
- Content Security Policy (CSP) headers on all responses
- `sanitizeCmsHtml()` wraps all `dangerouslySetInnerHTML` calls in CMS components

### CSRF (Cross-Site Request Forgery)
- `SameSite` cookie policy on Auth.js session cookies

### SQL Injection
- EF Core parameterized queries throughout — no raw SQL strings
- No dynamic query construction

### Information Disclosure
- No exception details in API responses (production)
- Swagger/OpenAPI UI disabled in production
- `ProblemDetails` format with generic error messages

### Rate Limiting
- Fixed window rate limiter on vote/action endpoint: 10 requests/minute per IP
- API endpoints: 50 requests/minute per IP
- General: 100 requests/minute per IP

---

## 5. CORS Configuration

Backend CORS policy (`AllowFrontend`) is environment-specific:

| Setting | Value |
|---------|-------|
| Allowed origins | Development: `http://localhost:3000` (auto-added) + any `FrontendUrl`/`FrontendUrls` config. Production: `FrontendUrl`/`FrontendUrls` config only — localhost never added. |
| Allowed methods | GET, POST, PUT, DELETE, OPTIONS |
| Allowed headers | Content-Type, Authorization, X-Requested-With |
| Credentials | Allowed |

---

## 6. Security Headers (Backend)

Applied to all ASP.NET Core API responses via inline middleware in `Program.cs`:

| Header | Value | Scope |
|--------|-------|-------|
| `X-Content-Type-Options` | `nosniff` | All environments |
| `X-Frame-Options` | `DENY` | All environments |
| `X-XSS-Protection` | `1; mode=block` | All environments |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | All environments |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Production only |

---

## 6a. Security Headers (Frontend)

Applied to all Next.js responses via `next.config.mjs`:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Restricts scripts, styles, images, fonts; includes OIDC provider domain |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `origin-when-cross-origin` |
| `Permissions-Policy` | Restricts camera, microphone, geolocation |

> **Note:** Update the CSP `connect-src` directive in `next.config.mjs` to include your OIDC provider's domain (e.g., `*.ciamlogin.com` for Entra, `*.auth0.com` for Auth0).

---

## 7. Secrets Management

| Secret | Storage |
|--------|---------|
| Database connection string | Azure Key Vault |
| OIDC client secret | Azure Key Vault (via Container App secret references) |
| Strapi API token | Azure Key Vault / Container App secrets |
| Revalidation webhook secret | Azure Key Vault / Container App secrets |
| GitHub CI/CD credentials | GitHub Secrets (OIDC federated identity) |

**No secrets in code or committed files.** Deployment scripts use `az keyvault secret` for all sensitive values.

---

## 8. Container Security

- All 3 Dockerfiles use multi-stage builds
- All `FROM` lines SHA-pinned to immutable digest — mutable tag kept as a comment; Dependabot Docker ecosystem keeps pins current
- Backend runtime uses `aspnet:8.0-alpine` — minimal attack surface
- All containers run as non-root users (`appuser`, `nextjs`, `strapi`)
- Ports <1024 require root; backend uses port 8080 inside container
- Container images stored in Azure Container Registry with RBAC access

---

## 9. Cryptographic Security

- Deployment scripts use `System.Security.Cryptography.RandomNumberGenerator` for password generation
- Auth.js `AUTH_SECRET` generated with `openssl rand -base64 32`

---

## 10. Security Operations

| Topic | Reference |
|-------|----------|
| Setting up an OIDC provider | [../operations/AUTH_SETUP_GUIDE.md](../operations/AUTH_SETUP_GUIDE.md) |
| Incident response procedures | [../operations/INCIDENT_RESPONSE.md](../operations/INCIDENT_RESPONSE.md) |
