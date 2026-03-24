# Authentication Setup Guide — OIDC Provider Configuration

**Last Updated:** 2026-03-24
**Audience:** Infrastructure Engineers, Solutions Architects
**Purpose:** Step-by-step guide for configuring an OIDC provider for frontend (Auth.js) and backend (JwtBearer) authentication. Includes detailed steps for Azure Entra External ID and a provider-swap reference.

The accelerator is **provider-agnostic** — swapping providers requires only environment variable changes, no code changes.

---

## Prerequisites

- An OIDC provider account (Entra External ID, Auth0, Cognito, Okta, Keycloak, or any OIDC-compliant provider)
- Redirect URIs for each environment (see Step 3)

---

## Provider: Azure Entra External ID

This section covers full setup for Entra External ID (free tier, <50,000 MAU).

### Cost Summary

| Resource | Cost |
|----------|------|
| Entra External Tenant | Free |
| App Registrations | Free |
| First 50,000 MAU | **Free** |
| Email OTP MFA | Free |
| SMS MFA | **Avoid — paid per SMS** |
| **Total for <10 users** | **$0/month** |

**Rule:** Always use email + password with email OTP for MFA. Never enable SMS MFA.

### Step 1: Create External Tenant

1. Go to **Azure Portal** → Microsoft Entra ID → Manage tenants → **Create**
2. Select tenant type: **External** (not Workforce)
3. Fill in:
   - **Tenant name:** `<your-project>-external`
   - **Domain name:** `<your-project>` → results in `<your-project>.onmicrosoft.com`
   - **Region:** Match your application region
4. Click **Review + Create** → **Create**
5. Wait ~2 minutes, then **Switch to the new tenant**

> **Important:** Record the **Tenant ID** from the tenant overview.

### Step 2: Register Backend API

1. **App registrations** → **New registration**
2. Fill in:
   - **Name:** `<YourProject>-API`
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:** Leave blank
3. Click **Register** → Record the **Application (client) ID**

#### 2a. Set Application ID URI

1. **Expose an API** → **Set** (next to Application ID URI)
2. Set to: `api://<yourproject>-api`
3. Click **Save**

#### 2b. Add API Scopes

1. Click **Add a scope**
2. Scope 1: `articles.read` — Admins and users — State: Enabled
3. Scope 2: `articles.write` — Admins only — State: Enabled

#### 2c. Define App Roles

1. **App roles** → **Create app role**
2. Role: **Admin** — Value: `Admin` — Allowed member types: Users/Groups
3. Role: **Editor** — Value: `Editor`
4. Role: **Viewer** — Value: `Viewer`

### Step 3: Register Frontend App

1. **App registrations** → **New registration**
2. Fill in:
   - **Name:** `<YourProject>-Web`
   - **Redirect URI (Web):**
     - `http://localhost:3000/api/auth/callback/entra-external-id` (dev)
     - `https://<your-production-url>/api/auth/callback/entra-external-id` (prod)
3. Click **Register** → Record **Application (client) ID**

#### 3a. Enable Tokens

1. **Authentication** → Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens

#### 3b. Create Client Secret

1. **Certificates & secrets** → **New client secret**
2. **Description:** `nextauth-secret`
3. **Copy the secret Value immediately** — this is your `AUTH_ENTRA_CLIENT_SECRET`

#### 3c. Grant API Permissions

1. **API permissions** → **Add a permission** → **My APIs** → `<YourProject>-API`
2. Select **Delegated permissions**: `articles.read`, `articles.write`
3. Click **Grant admin consent**

### Step 4: Configure Sign-Up/Sign-In User Flow

1. **User flows** → **New user flow** → **Sign up and sign in**
2. Fill in:
   - **Identity providers:** Email + password
   - **MFA:** Email one-time password (free — **do not select Phone/SMS**)
3. **User attributes to collect:** Display name, Email address
4. **Token claims to return:** Display name, Email address, User's object ID

### Step 5: Assign Roles to Users

1. **Enterprise applications** → `<YourProject>-API`
2. **Users and groups** → **Add user/group**
3. Select user → Select appropriate role (Admin, Editor, or Viewer)
4. Click **Assign**

> **Note:** A user with no role assigned will receive 403 on write operations. Read endpoints remain anonymous.

### Step 6: Gather Environment Variables

```bash
# Auth.js
AUTH_SECRET=<generate: openssl rand -base64 32>
AUTH_TRUST_HOST=true

# Entra External ID — Frontend App
AUTH_ENTRA_ISSUER=https://<tenant-id>.ciamlogin.com/<tenant-id>/v2.0
AUTH_ENTRA_CLIENT_ID=<Frontend App (client) ID>
AUTH_ENTRA_CLIENT_SECRET=<Frontend App client secret value>

# API scopes
AUTH_API_SCOPE_READ=api://<yourproject>-api/articles.read
AUTH_API_SCOPE_WRITE=api://<yourproject>-api/articles.write
```

> **Finding the issuer:** Fetch from the OIDC discovery document:
> ```bash
> curl https://<tenant-id>.ciamlogin.com/<tenant-id>/v2.0/.well-known/openid-configuration | jq .issuer
> ```
> For Entra External ID CIAM tenants the issuer uses the **tenant ID as the subdomain**, not the friendly name.

### Step 7: Backend Configuration

Add to `appsettings.Development.json` (local dev):

```json
{
  "Authentication": {
    "Authority": "https://<tenant-id>.ciamlogin.com/<tenant-id>/v2.0",
    "Audience": "api://<yourproject>-api",
    "RequireHttpsMetadata": false
  }
}
```

Production (Azure Container Apps environment variables):

| Name | Value |
|------|-------|
| `Authentication__Authority` | `https://<tenant-id>.ciamlogin.com/<tenant-id>/v2.0` |
| `Authentication__Audience` | `api://<yourproject>-api` |
| `Authentication__RequireHttpsMetadata` | `true` |

---

## Verification Checklist

- [ ] `GET /api/articles` returns 200 without any token (anonymous)
- [ ] `POST /api/articles` returns 401 without a token
- [ ] `POST /api/articles` returns 403 with a Viewer-role token
- [ ] `POST /api/articles` returns 201 with an Editor-role token
- [ ] `DELETE /api/articles/{id}` returns 403 with Editor token
- [ ] `DELETE /api/articles/{id}` returns 204 with Admin token
- [ ] `GET /api/auth/me` returns user info with a valid token
- [ ] `/login` page renders sign-in button
- [ ] After signing in, header shows user name and role badge
- [ ] Sign Out button clears session

---

## Swapping to a Different OIDC Provider

| Change | What to update |
|--------|---------------|
| Provider issuer | `AUTH_ENTRA_ISSUER` env var → new issuer URL |
| Client credentials | `AUTH_ENTRA_CLIENT_ID` / `AUTH_ENTRA_CLIENT_SECRET` → new values |
| API scopes | `AUTH_API_SCOPE_READ` / `AUTH_API_SCOPE_WRITE` → new scope names |
| Backend Authority | `Authentication__Authority` → new issuer URL |
| Backend Audience | `Authentication__Audience` → new audience value |
| Role claim type | `Program.cs`: `RoleClaimType` — check if provider uses `roles`, `https://yourapp.com/roles`, or `realm_access.roles` |

No other code changes are needed.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 401 on all requests | Backend Authority not set or wrong | Check `appsettings.json`, verify issuer matches token |
| 403 even with correct role | Roles not in access token | Ensure app role assignment in Enterprise Applications, not just App Registration |
| Redirect loop on /login | AUTH_SECRET mismatch | Regenerate `AUTH_SECRET`, ensure same value across restarts |
| "OAuthCallback" error | Redirect URI mismatch | Add exact callback URL to Frontend app registration |
| Token has no `roles` claim | Role assigned to wrong app | Assign roles via Enterprise Applications → API app (not the frontend app) |
| OIDC provider domain blocked by CSP | CSP `connect-src` too restrictive | Add provider domain to `next.config.mjs` CSP connect-src |
