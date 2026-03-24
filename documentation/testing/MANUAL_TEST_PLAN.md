# Manual Test Plan — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** QA Engineers, Developers
**Purpose:** Pre-release manual test checklist covering all functional areas of the accelerator.

---

## Test Environment

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5255 |
| Database | SQLite (accelerator.db, auto-created) |
| Browser | Playwright/Chromium or Chrome |

**Viewports:**
- Desktop: 1920×1080
- Tablet: 768×1024
- Mobile: 375×667

---

## Suite 1 — Home Page

### 1.1 Layout & Navigation

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 1 | Load home page | Page loads without errors | |
| 2 | Navigation bar renders | Logo, nav links, auth button visible | |
| 3 | Click nav logo | Navigates to `/` | |
| 4 | Click "Articles" nav link | Navigates to `/articles` | |

### 1.2 Featured Articles

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 5 | Featured section renders | Up to 3 featured articles displayed | |
| 6 | Featured article card | Title, category, vote count visible | |
| 7 | Click featured article | Navigates to `/articles/[slug]` | |

### 1.3 Trending Articles

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 8 | Trending section renders | Articles ordered by vote count | |
| 9 | Trending article displays vote count | Numeric vote count shown | |

### 1.4 Category Overview

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 10 | Category list renders | All categories shown (General, Tutorial, Guide, Reference, News) | |
| 11 | Click category | Navigates to `/articles?category=<name>` | |

---

## Suite 2 — Article Listing

### 2.1 Display

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 12 | Article listing page loads | Article cards rendered in grid | |
| 13 | Article card content | Title, category, vote count, excerpt shown | |
| 14 | Article count shown | Total count displayed above list | |

### 2.2 Category Filtering

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 15 | Filter by "Tutorial" | Only Tutorial articles shown | |
| 16 | Filter by multiple categories | Articles matching any selected category shown | |
| 17 | Clear category filter | All articles returned | |
| 18 | URL reflects filter | `?category=Tutorial` in URL when filtering | |

### 2.3 Search

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 19 | Search by title | Matching articles returned | |
| 20 | Search by description | Articles with matching description returned | |
| 21 | Search by tag | Articles tagged with search term returned | |
| 22 | No results | "No articles found" message shown | |
| 23 | Clear search | All articles restored | |

### 2.4 Sorting

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 24 | Sort by "Most Voted" | Highest vote count first | |
| 25 | Sort by "Newest" | Most recently created first | |
| 26 | Sort by "Recently Updated" | Most recently updated first | |

### 2.5 Pagination

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 27 | Page 1 shows first N articles | Default page size respected | |
| 28 | Navigate to page 2 | Next set of articles shown | |
| 29 | URL reflects page | `?page=2` in URL | |
| 30 | Page controls disabled at boundaries | Prev disabled on page 1; Next disabled on last page | |

---

## Suite 3 — Article Detail

### 3.1 Content Display

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 31 | Article detail page loads | Title, content, metadata rendered | |
| 32 | Markdown content renders | Headers, bold, code blocks formatted correctly | |
| 33 | Tags displayed | Tag list shown below content | |
| 34 | Category badge shown | Category label visible | |
| 35 | Author and date shown | Metadata rendered correctly | |

### 3.2 Voting

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 36 | Vote button visible | Vote count and button rendered | |
| 37 | Click vote | Vote count increments by 1 | |
| 38 | Vote persists on reload | Incremented count shown after page refresh | |
| 39 | Rate limit respected | Rapid repeat votes do not spam API | |

### 3.3 Related Articles

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 40 | Related articles section | Up to 3 related articles shown | |
| 41 | Related article links work | Clicking navigates to correct article | |

### 3.4 Navigation

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 42 | Breadcrumb / back link | Returns to article listing | |
| 43 | Browser back button | Returns to previous page without full reload | |

### 3.5 SEO / Metadata

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 44 | Page title set | `<title>` matches article title | |
| 45 | Meta description set | OpenGraph description populated | |
| 46 | Canonical URL correct | Canonical points to correct slug URL | |

---

## Suite 4 — Authentication

### 4.1 Login Flow

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 47 | Visit `/login` | Login page rendered | |
| 48 | Click sign-in provider | Redirects to OIDC provider | |
| 49 | Complete authentication | Redirected back, user indicator shown | |
| 50 | Session persists on refresh | User still logged in after page reload | |
| 51 | Sign out | Session cleared, user indicator removed | |

### 4.2 Protected Routes

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 52 | Visit `/articles/new` unauthenticated | Redirected to `/login` | |
| 53 | Try to delete article unauthenticated | 401 Unauthorized returned | |
| 54 | Editor can create article | Create form accessible | |
| 55 | Non-admin cannot delete | Delete button not shown / 403 returned | |

---

## Suite 5 — Article Management (Editor/Admin)

### 5.1 Create Article

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 56 | Create form renders | All fields shown (title, content, category, tags) | |
| 57 | Submit valid article | Article created; redirected to new article | |
| 58 | Submit with empty title | Validation error shown | |
| 59 | Submit with invalid category | Validation error shown | |

### 5.2 Edit Article

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 60 | Edit form pre-populated | Existing article data loaded | |
| 61 | Update and save | Changes reflected immediately | |
| 62 | Cancel edit | Returns to article without saving | |

### 5.3 Delete Article (Admin)

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 63 | Delete confirmation shown | Confirmation dialog before delete | |
| 64 | Confirm delete | Article removed; redirected to listing | |
| 65 | Cancel delete | Article not deleted | |

---

## Suite 6 — Visual & Responsive

| # | Test Case | Desktop | Tablet | Mobile |
|---|-----------|---------|--------|--------|
| 66 | Home page layout | | | |
| 67 | Article listing grid | | | |
| 68 | Article detail layout | | | |
| 69 | Navigation (hamburger on mobile) | N/A | ✓ | ✓ |
| 70 | Article card responsive | | | |
| 71 | Vote button accessible | | | |

---

## Suite 7 — API Integration

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|----------------|-----------|
| 72 | API health check | `GET /health` returns 200 Healthy | |
| 73 | Article listing API | `GET /api/articles` returns paginated items | |
| 74 | Article detail API | `GET /api/articles/{slug}` returns article | |
| 75 | Featured articles API | `GET /api/articles/featured` returns array | |
| 76 | Trending articles API | `GET /api/articles/trending` returns array | |
| 77 | Vote API | `POST /api/articles/{id}/vote` increments count | |
| 78 | 404 for unknown slug | Returns 404 with error body | |
| 79 | CORS headers present | `Access-Control-Allow-Origin` on API responses | |

---

## Suite 8 — Performance

| # | Test Case | Threshold | Pass/Fail |
|---|-----------|-----------|-----------|
| 80 | Home page Lighthouse score (Desktop) | ≥ 90 | |
| 81 | Home page Lighthouse score (Mobile) | ≥ 80 | |
| 82 | Article listing Lighthouse (Desktop) | ≥ 85 | |
| 83 | Article listing LCP | < 3.0s | |
| 84 | Article detail LCP | < 2.5s | |
| 85 | API response time (articles list) | < 200ms (local SQLite) | |
| 86 | Images use next/image | No unoptimized `<img>` tags | |

---

## Suite 9 — Cross-Browser

| # | Test Case | Chrome/Edge | Firefox | Safari |
|---|-----------|-------------|---------|--------|
| 87 | Home page renders | | | |
| 88 | Article listing filters work | | | |
| 89 | Article detail markdown renders | | | |
| 90 | Login flow completes | | | |
| 91 | Vote interaction works | | | |

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________
**Environment:** Local dev / Staging
**Build / Commit:** _______________

| Suite | Total Tests | Passed | Failed | Blocked |
|-------|------------|--------|--------|---------|
| 1 — Home Page | 11 | | | |
| 2 — Article Listing | 19 | | | |
| 3 — Article Detail | 16 | | | |
| 4 — Authentication | 9 | | | |
| 5 — Article Management | 10 | | | |
| 6 — Visual & Responsive | 6 | | | |
| 7 — API Integration | 8 | | | |
| 8 — Performance | 7 | | | |
| 9 — Cross-Browser | 5 | | | |
| **Total** | **91** | | | |

**Issues Found:**

| # | Suite | Description | Severity | Status |
|---|-------|-------------|----------|--------|
| | | | | |

---

## Related Documents

- [TESTING_STRATEGY.md](TESTING_STRATEGY.md) — Automated testing approach and quality gates
- [PERFORMANCE_BASELINE_GUIDE.md](PERFORMANCE_BASELINE_GUIDE.md) — Lighthouse testing procedure
