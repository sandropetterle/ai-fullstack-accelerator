# Testing Strategy — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** Developers, QA Engineers
**Purpose:** Define the testing approach, tool choices, coverage requirements, and CI quality gates for the accelerator.

---

## 1. Test Types

### 1.1 Unit Tests

**Scope:** Individual functions, services, components, and hooks in isolation.

**Backend (xUnit + Moq):**
- Service layer logic (ArticleService business rules, vote validation, caching)
- Validators (FluentValidation rules)
- Repository methods tested against EF Core InMemory provider
- Controller action methods (request handling, response mapping)

**Frontend (Jest + React Testing Library):**
- Individual React components render correctly
- Custom hooks behave as expected
- Utility functions and mappers (`lib/api/mappers.ts`)
- API client functions (`lib/api/articles.ts`)

**Target:** ≥70% statement/branch/function/line coverage (enforced by CI gate).

---

### 1.2 Integration Tests

**Backend:**
- EF Core repository integration (real queries against InMemory or SQLite provider)
- Full request/response cycle for controllers via `WebApplicationFactory`

**Frontend:**
- Server component rendering with mocked API responses
- Form submission flows with mocked fetch

---

### 1.3 End-to-End Tests (Playwright)

**Scope:** Full user journeys from browser to API.

**Cross-browser matrix:** Chromium, Firefox, WebKit

**E2E Auth Test Strategy (three tiers):**

| Tier | What's tested | CI | Local |
|------|--------------|-----|-------|
| Unauthenticated guards | Protected routes redirect to login; protected actions blocked | ✅ Always runs | ✅ |
| Authenticated UI | Login flow, session persistence, user indicator | ✅ With mock session | ✅ |
| Authenticated API writes | POST/PUT/DELETE via real auth token | ❌ Skipped (no token) | ✅ with `E2E_API_WRITES=true` |

**Running E2E locally:**
```bash
npx playwright test                       # All E2E tests
npx playwright test --headed             # With browser visible
E2E_API_WRITES=true npx playwright test  # Include auth write tests
```

---

### 1.4 Visual Regression Tests (Chromatic)

Storybook stories are published to Chromatic on every PR. Visual diffs must be approved by a reviewer before merging.

**Running Storybook locally:**
```bash
npm run storybook           # Dev server at http://localhost:6006
npm run build-storybook     # Static build
```

---

### 1.5 Performance Tests (Lighthouse CI)

Lighthouse CI runs in GitHub Actions against a production build.

**Thresholds:**
- LCP < 2500ms
- FCP < 1800ms
- TTI < 5000ms
- Performance score ≥ 0.80

See [PERFORMANCE_BASELINE_GUIDE.md](PERFORMANCE_BASELINE_GUIDE.md) for the full procedure.

---

### 1.6 Accessibility Tests (axe-core)

Playwright E2E tests include `axe-core` checks. No critical accessibility violations permitted.

---

### 1.7 Manual Tests

See [MANUAL_TEST_PLAN.md](MANUAL_TEST_PLAN.md) for the complete pre-release checklist.

---

## 2. Tools & Frameworks

| Layer | Framework | Purpose |
|-------|-----------|---------|
| Frontend unit/integration | Jest + React Testing Library | Component and hook tests |
| Frontend E2E | Playwright (Chromium/Firefox/WebKit) | Cross-browser user journeys |
| Frontend visual | Chromatic | Storybook visual regression |
| Frontend performance | Lighthouse CI | Core Web Vitals gate |
| Frontend accessibility | axe-core (via @axe-core/playwright) | Accessibility violations |
| Backend unit/integration | xUnit + Moq | Service, controller, validator tests |
| Backend database | EF Core InMemory / SQLite | Repository integration |
| Backend HTTP | WebApplicationFactory | Full request pipeline tests |

---

## 3. Folder Structure

### Backend Tests

```
backend/tests/
  Accelerator.Core.Tests/
    Services/          # ArticleService, VoteService unit tests
    Validators/        # FluentValidation rule tests
  Accelerator.Data.Tests/
    Repositories/      # EF Core repository integration tests
  Accelerator.Api.Tests/
    Controllers/       # ArticlesController, AuthController tests
    Middleware/        # Middleware pipeline tests
```

### Frontend Tests

```
__tests__/
  lib/
    api/               # articles.ts, client.ts, mappers.ts
    cms/               # Strapi client
  components/
    articles/          # ArticleCard, ArticleContent, ArticleForm, etc.
    ui/                # shadcn/ui primitives
  app/
    articles/          # Page component tests
e2e/
  articles.spec.ts     # Article listing, detail, search
  auth.spec.ts         # Login, session guards
  voting.spec.ts       # Vote interactions
```

---

## 4. Running Tests

### Frontend

```bash
# Run all Jest tests
npm test

# With coverage report
npm test -- --coverage

# Coverage CI gate (must pass ≥70% on all 4 metrics)
npm run test:ci

# E2E tests (Playwright)
npx playwright test

# E2E with browser visible
npx playwright test --headed

# Specific test file
npm test -- components/articles/ArticleCard.test.tsx
```

### Backend

```bash
# From project root
dotnet build && dotnet test

# From backend/ directory
cd backend
dotnet test

# With coverage
dotnet test --collect:"XPlat Code Coverage"
```

---

## 5. Coverage Verification Rule (MANDATORY)

This rule is enforced by the CI gate and must also be verified locally before pushing.

After any changes to `app/`, `components/`, or `lib/`:

```bash
npm run test:ci
```

**All four metrics must be ≥ 70%:**

| Metric | Minimum |
|--------|---------|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

Coverage thresholds are configured in `jest.config.mjs`:

```js
coverageThreshold: {
  global: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
},
```

---

## 6. Quality Gates (CI)

All gates must pass before a PR can merge:

| Gate | Tool | Threshold |
|------|------|-----------|
| Frontend unit/integration | Jest | 100% pass, ≥70% coverage |
| Backend unit/integration | xUnit | 100% pass |
| E2E (unauthenticated + authenticated UI) | Playwright | 100% pass on Chromium/Firefox/WebKit |
| Visual regression | Chromatic | Approved by reviewer |
| Performance | Lighthouse CI | LCP <2500ms, FCP <1800ms, Score ≥0.80 |
| Accessibility | axe-core | No critical violations |
| Infrastructure | az bicep build | Template compiles cleanly |

---

## 7. Mocking Patterns

### Frontend — API Mocking

```tsx
import { jest } from '@jest/globals';

jest.mock('@/lib/api/articles', () => ({
  getArticles: jest.fn().mockResolvedValue([mockArticle]),
  getArticleBySlug: jest.fn().mockResolvedValue(mockArticle),
}));
```

### Frontend — Next.js Router

```tsx
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
```

### Backend — Service Mocking with Moq

```csharp
var mockService = new Mock<IArticleService>();
mockService.Setup(s => s.GetArticlesAsync(It.IsAny<ArticleQueryParams>()))
    .ReturnsAsync(new PaginatedResult<ArticleListDto> { Items = articles });
```

### Backend — Render Function Props

When testing components that accept render functions as props:

```tsx
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: ({ children }) => <RouterContext>{children}</RouterContext> });
};
```

---

## 8. Known Browser-Specific Patterns

### WebKit — date input

WebKit does not support `type="date"` natively in Playwright. Use:

```ts
await page.fill('[name="publishedAt"]', '2025-01-15');
```

### Soft navigation — URL assertion

After client-side navigation, use Playwright's `toHaveURL` with `{ timeout: 5000 }`:

```ts
await expect(page).toHaveURL('/articles/my-slug', { timeout: 5000 });
```

### Comma-encoding in query strings

Next.js encodes commas in URL search params. Use `decodeURIComponent` when asserting:

```ts
expect(decodeURIComponent(page.url())).toContain('categories=General,Tutorial');
```

---

## 9. Current State

| Test Suite | Count | Status |
|-----------|-------|--------|
| Frontend (Jest) | 391 | Passing |
| Backend (xUnit) | 109 | Passing |
| E2E (Playwright, 3 browsers) | ~42 scenarios | Passing |

---

## 10. Related Documents

- [MANUAL_TEST_PLAN.md](MANUAL_TEST_PLAN.md) — Pre-release manual checklist
- [PERFORMANCE_BASELINE_GUIDE.md](PERFORMANCE_BASELINE_GUIDE.md) — Lighthouse testing procedure
- [CLAUDE.md](../../CLAUDE.md) — Coverage verification rule (quick ref)
