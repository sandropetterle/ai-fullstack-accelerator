# API Reference Index

**Last Updated:** 2026-03-24
**Audience:** Developers, API consumers
**Purpose:** Overview of the AI Fullstack Accelerator REST API — base URLs, versioning, authentication, rate limiting, and links to each endpoint group.

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5255/api` |
| Production | Configure via `NEXT_PUBLIC_API_BASE_URL` environment variable |

---

## API Versioning

URL segment versioning. Current version: **v1**.

| Style | Example |
|-------|---------|
| Versioned | `/api/v1/articles` |
| Unversioned fallback | `/api/articles` |

Both forms are supported and functionally identical. Prefer the versioned form in new integrations.

---

## Authentication

Public endpoints require no authentication. Protected endpoints require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <access-token>
```

Tokens are issued by your OIDC provider (Entra External ID, Auth0, Cognito, etc.) via the OIDC flow. Roles are embedded in the token (`Admin`, `Editor`, `Viewer`).

| Role | Permissions |
|------|------------|
| `Viewer` | Read-only — same as unauthenticated |
| `Editor` | Create and update articles |
| `Admin` | Create, update, and delete articles |

See [SECURITY_OVERVIEW.md](../architecture/SECURITY_OVERVIEW.md) for the full authentication architecture.

---

## Rate Limiting

All API endpoints are protected by rate limiting. Exceeding a limit returns `429 Too Many Requests`.

| Policy | Limit | Applied To |
|--------|-------|------------|
| `api` (sliding window) | 50 req/min per IP | All `/articles` endpoints by default |
| `action` (fixed window) | 10 req/min per IP | `POST /articles/{id}/vote` only |

---

## Swagger / OpenAPI

Available at `/swagger` in **development only**. Disabled in production.

Local URL: `http://localhost:5255/swagger`

---

## Endpoint Groups

| Group | Endpoints | Reference |
|-------|-----------|-----------|
| Articles | 9 endpoints — CRUD, vote, featured, trending, related | [ARTICLES_API.md](ARTICLES_API.md) |
| Auth | 1 endpoint — current user info | [AUTH_API.md](AUTH_API.md) |
| Health | 2 endpoints — liveness and readiness probes | [HEALTH_API.md](HEALTH_API.md) |

---

## Standard Error Responses

All errors follow ASP.NET Core `ProblemDetails` format:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Bad Request",
  "status": 400,
  "errors": {
    "Title": ["'Title' must not be empty."],
    "Category": ["Invalid category. Valid values: General, Tutorial, Guide, Reference, News"]
  }
}
```

| Status | Meaning |
|--------|---------|
| `400` | Validation error — `errors` object contains field-level messages |
| `401` | Missing or invalid token |
| `403` | Valid token but insufficient role |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |
