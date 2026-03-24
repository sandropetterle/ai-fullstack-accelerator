# Articles API Reference

**Last Updated:** 2026-03-24
**Audience:** Developers, API consumers
**Purpose:** Complete reference for all `/articles` endpoints — request shapes, response shapes, validation rules, query parameters, and error codes.

See [API_REFERENCE_INDEX.md](API_REFERENCE_INDEX.md) for base URLs, auth, and rate limiting.

---

## Endpoint Summary

| Method | Endpoint | Auth | Rate Limit | Notes |
|--------|----------|------|------------|-------|
| GET | `/articles` | None | `api` | Paginated list with filtering and sorting |
| GET | `/articles/featured` | None | `api` | Featured articles, cached 5 min |
| GET | `/articles/trending` | None | `api` | Trending articles, cached 5 min |
| GET | `/articles/{slug}` | None | `api` | Single article by slug |
| GET | `/articles/{slug}/related` | None | `api` | Related articles, cached 5 min per slug |
| POST | `/articles/{id}/vote` | None | `action` (10/min) | Increment vote count |
| POST | `/articles` | RequireEditor | `api` | Create new article |
| PUT | `/articles/{id}` | RequireEditor | `api` | Update existing article |
| DELETE | `/articles/{id}` | RequireAdmin | `api` | Delete article |

---

## DTOs

### ArticleListDto

Returned by list endpoints (`GET /articles`, `/featured`, `/trending`, `/related`). Excludes `fullContent` for performance.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string (uuid)` | Article unique identifier |
| `title` | `string` | Article title |
| `slug` | `string` | URL-safe identifier (e.g. `my-article-title`) |
| `shortDescription` | `string` | One-paragraph summary |
| `category` | `string` | PascalCase enum value — see [Category Values](#category-values) |
| `tags` | `string[]` | Tag names |
| `author` | `string \| null` | Author name |
| `createdDate` | `string (ISO 8601)` | Creation timestamp |
| `updatedDate` | `string (ISO 8601)` | Last update timestamp |
| `voteCount` | `number` | Total votes |
| `status` | `string` | `"draft"` or `"published"` |
| `isFeatured` | `boolean` | Appears on featured list |
| `isTrending` | `boolean` | Appears on trending list |

### ArticleDetailDto

Returned by single-article endpoints (`GET /articles/{slug}`, `POST /articles`, `PUT /articles/{id}`). Adds `fullContent`.

All fields from `ArticleListDto` plus:

| Field | Type | Description |
|-------|------|-------------|
| `fullContent` | `string \| null` | Full Markdown content body |

### PaginatedResponse

Wrapper returned by `GET /articles`.

| Field | Type | Description |
|-------|------|-------------|
| `items` | `ArticleListDto[]` | Page of results |
| `totalCount` | `number` | Total matching records |
| `currentPage` | `number` | Current page number (1-based) |
| `pageSize` | `number` | Items per page |
| `totalPages` | `number` | Total page count |

### VoteResponse

Returned by `POST /articles/{id}/vote`.

| Field | Type | Description |
|-------|------|-------------|
| `articleId` | `string (uuid)` | Article that was voted on |
| `voteCount` | `number` | New total vote count |

### CreateArticleDto

Request body for `POST /articles`.

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `title` | `string` | Yes | Max 255 chars |
| `shortDescription` | `string` | Yes | Max 500 chars |
| `fullContent` | `string` | No | Max 50,000 chars |
| `category` | `string` | Yes | Must be a valid [Category Value](#category-values) |
| `tags` | `string[]` | No | Max 10 tags; each tag max 50 chars |
| `author` | `string` | No | Max 100 chars |

### UpdateArticleDto

Request body for `PUT /articles/{id}`. All fields required (full replacement).

All fields from `CreateArticleDto` plus:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `isFeatured` | `boolean` | Yes | Promotes to featured list |
| `isTrending` | `boolean` | Yes | Promotes to trending list |

---

## Category Values

Categories use PascalCase on the API. The frontend maps them to display strings via `lib/api/mappers.ts`.

| API Value | Display |
|-----------|---------|
| `General` | General |
| `Tutorial` | Tutorial |
| `Guide` | Guide |
| `Reference` | Reference |
| `News` | News |

See [DATA_MODEL.md](../architecture/DATA_MODEL.md) for the full mapping and frontend mapper function.

---

## GET /articles

Returns a paginated, filterable, sortable list of articles.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `integer` | `1` | Page number (1-based, min 1) |
| `pageSize` | `integer` | `9` | Items per page (min 1, max 100) |
| `sortBy` | `string` | `recent` | Sort order — `recent`, `votes`, `alphabetical` |
| `category` | `string` | — | Filter by PascalCase category value |
| `tags` | `string` | — | Comma-separated tag names — e.g. `cloud,resilience` |
| `tagMode` | `string` | `any` | Tag matching — `any` (OR) or `all` (AND) |
| `search` | `string` | — | Full-text search across title, description, tags, and content (max 200 chars) |
| `dateFrom` | `date` | — | Include only articles created on or after this date (ISO 8601 date) |
| `dateTo` | `date` | — | Include only articles created on or before this date (ISO 8601 date) |

### Example Request

```
GET /api/articles?page=1&pageSize=9&sortBy=votes&category=Tutorial&tags=cloud,api&tagMode=any
```

### Example Response

```json
{
  "items": [
    {
      "id": "b0000000-0000-0000-0000-000000000001",
      "title": "Getting Started with Clean Architecture",
      "slug": "getting-started-clean-architecture",
      "shortDescription": "A practical guide to layered architecture in .NET.",
      "category": "Tutorial",
      "tags": ["dotnet", "clean-architecture"],
      "author": "Jane Smith",
      "createdDate": "2024-01-15T10:00:00Z",
      "updatedDate": "2024-06-01T08:30:00Z",
      "voteCount": 42,
      "status": "published",
      "isFeatured": true,
      "isTrending": false
    }
  ],
  "totalCount": 6,
  "currentPage": 1,
  "pageSize": 9,
  "totalPages": 1
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Invalid query parameter (e.g. `pageSize` out of range) |
| `429` | Rate limit exceeded |

**Frontend client:** `getArticles(params)` in [lib/api/articles.ts](../../lib/api/articles.ts)

---

## GET /articles/featured

Returns all articles with `isFeatured = true`. Cached for 5 minutes.

### Example Response

```json
[
  {
    "id": "b0000000-0000-0000-0000-000000000001",
    "title": "Getting Started with Clean Architecture",
    "slug": "getting-started-clean-architecture",
    ...
  }
]
```

**Frontend client:** `getFeaturedArticles()` in [lib/api/articles.ts](../../lib/api/articles.ts)

---

## GET /articles/trending

Returns all articles with `isTrending = true`. Cached for 5 minutes.

Same response shape as `/articles/featured`.

**Frontend client:** `getTrendingArticles()` in [lib/api/articles.ts](../../lib/api/articles.ts)

---

## GET /articles/{slug}

Returns full details for a single article by its URL slug.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Article slug (e.g. `getting-started-clean-architecture`) |

### Example Response

```json
{
  "id": "b0000000-0000-0000-0000-000000000001",
  "title": "Getting Started with Clean Architecture",
  "slug": "getting-started-clean-architecture",
  "shortDescription": "A practical guide to layered architecture in .NET.",
  "fullContent": "## Overview\n\nClean Architecture separates...",
  "category": "Tutorial",
  "tags": ["dotnet", "clean-architecture"],
  "author": "Jane Smith",
  "createdDate": "2024-01-15T10:00:00Z",
  "updatedDate": "2024-06-01T08:30:00Z",
  "voteCount": 42,
  "status": "published",
  "isFeatured": true,
  "isTrending": false
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | No article with that slug |
| `429` | Rate limit exceeded |

**Frontend client:** `getArticleBySlug(slug)` in [lib/api/articles.ts](../../lib/api/articles.ts) — returns `null` on 404.

---

## GET /articles/{slug}/related

Returns up to 3 related articles ordered by: same category first, then tag overlap, then vote count. Cached 5 minutes per slug.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Slug of the source article |

Response is an array of `ArticleListDto`. Returns an empty array if the slug is not found (graceful fallback).

**Frontend client:** `getRelatedArticles(slug)` in [lib/api/articles.ts](../../lib/api/articles.ts) — returns `[]` on any error.

---

## POST /articles/{id}/vote

Increments the vote count for an article by 1. **Requires** the article ID (UUID), not the slug.

Rate limited to **10 requests per minute per IP** (stricter than general `api` policy).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Article ID |

### Example Response

```json
{
  "articleId": "b0000000-0000-0000-0000-000000000001",
  "voteCount": 43
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `404` | No article with that ID |
| `429` | Vote rate limit exceeded (10/min per IP) |

**Frontend client:** `voteForArticle(id)` in [lib/api/articles.ts](../../lib/api/articles.ts)

---

## POST /articles

Creates a new article. **Requires `Editor` role.**

### Request Body

`CreateArticleDto` — see [DTOs section](#createarticledto).

### Example Request

```json
{
  "title": "Building REST APIs with ASP.NET Core",
  "shortDescription": "A comprehensive guide to building production-ready REST APIs.",
  "fullContent": "## Overview\n\nThis guide covers...",
  "category": "Guide",
  "tags": ["dotnet", "rest-api", "backend"],
  "author": "Jane Smith"
}
```

### Example Response

`201 Created` with `Location: /api/articles/{slug}` header and full `ArticleDetailDto` body.

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Validation error — see `errors` object |
| `401` | No token provided |
| `403` | Token present but role is not `Editor` or `Admin` |
| `429` | Rate limit exceeded |

**Frontend client:** `createArticle(data, token)` in [lib/api/articles.ts](../../lib/api/articles.ts)

---

## PUT /articles/{id}

Replaces all fields of an existing article. **Requires `Editor` role.**

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Article ID |

### Request Body

`UpdateArticleDto` — see [DTOs section](#updatearticledto). All fields are required (full replacement, not partial update).

### Example Response

`200 OK` with updated `ArticleDetailDto` body.

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Validation error |
| `401` | No token |
| `403` | Insufficient role |
| `404` | No article with that ID |
| `429` | Rate limit exceeded |

**Frontend client:** `updateArticle(id, data, token)` in [lib/api/articles.ts](../../lib/api/articles.ts)

---

## DELETE /articles/{id}

Deletes an article permanently. **Requires `Admin` role.**

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (uuid)` | Article ID |

### Response

`204 No Content` on success.

### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | No token |
| `403` | Insufficient role (requires `Admin`) |
| `404` | No article with that ID |
| `429` | Rate limit exceeded |

**Controller source:** [ArticlesController.cs](../../backend/src/Accelerator.Api/Controllers/ArticlesController.cs)
