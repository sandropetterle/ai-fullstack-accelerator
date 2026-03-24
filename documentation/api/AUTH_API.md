# Auth API Reference

**Last Updated:** 2026-03-24
**Audience:** Developers
**Purpose:** Reference for the `/auth` endpoints — current user identity and role retrieval.

See [API_REFERENCE_INDEX.md](API_REFERENCE_INDEX.md) for base URLs, auth, and rate limiting.

---

## Endpoint Summary

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/auth/me` | Required (any role) | Returns current user identity and roles |

---

## GET /auth/me

Returns the identity and roles of the currently authenticated user. Used by the frontend to verify session validity and determine role-based UI rendering.

### Request

No request body. Requires a valid Bearer token in the `Authorization` header.

### Example Response

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "roles": ["Editor"]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Subject claim (`sub`) or object ID (`oid`) from the token |
| `name` | `string \| null` | `name` claim from the token |
| `email` | `string \| null` | `email` or `preferred_username` claim |
| `roles` | `string[]` | All `roles` claims — `Admin`, `Editor`, and/or `Viewer` |

### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |

---

## Auth Architecture

The authentication flow for API requests:

```
Browser → Next.js (Auth.js v5) → OIDC Provider
                ↓ (access token in Authorization header)
          ASP.NET Core API (JwtBearer validation via OIDC discovery)
```

- **Provider-agnostic:** Works with any OIDC provider — Entra External ID, Auth0, Cognito, Okta, Keycloak
- **Token format:** JWT — validated via OIDC discovery endpoint (`.well-known/openid-configuration`)
- **Roles:** Embedded in the JWT `roles` claim via the OIDC provider's App Roles or custom claims
- **Backend guard:** `JwtBearer` middleware is only registered when `Authentication:Authority` is configured — the API works without any OIDC setup in local/test environments

For full details see [SECURITY_OVERVIEW.md](../architecture/SECURITY_OVERVIEW.md).

**Controller source:** [AuthController.cs](../../backend/src/Accelerator.Api/Controllers/AuthController.cs)
