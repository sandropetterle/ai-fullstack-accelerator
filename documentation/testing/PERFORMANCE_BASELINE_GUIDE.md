# Performance Baseline Guide — AI Fullstack Accelerator

**Last Updated:** 2026-03-24
**Audience:** Developers, QA Engineers, DevOps
**Purpose:** Define how to measure, record, and monitor performance baselines using Lighthouse and Chrome DevTools — and establish the target thresholds for Core Web Vitals.

---

## 1. Tools

| Tool | Purpose |
|------|---------|
| Lighthouse (Chrome DevTools / CLI) | Core Web Vitals, performance score |
| Chrome DevTools — Performance tab | Runtime profiling, call stacks |
| WebPageTest.org | Real-device testing, filmstrip view |
| Lighthouse CI (GitHub Actions) | Automated gate on every PR |

---

## 2. Lighthouse Testing Procedure

### Step 1: Prepare the Environment

```bash
# Start backend API
dotnet run --project backend/src/Accelerator.Api

# Build and start frontend in production mode
npm run build
npm start
```

> **Why production build?** `npm run dev` disables many Next.js optimizations. Lighthouse on a dev server produces inaccurate results.

### Step 2: Open Lighthouse

1. Open Chrome → `http://localhost:3000`
2. Open DevTools (`F12`)
3. Navigate to **Lighthouse** tab
4. Select: **Performance**, **Accessibility**, **Best Practices**, **SEO**
5. Device: **Desktop** first, then **Mobile**
6. Click **Analyze page load**

### Step 3: Pages to Audit

Run Lighthouse against each page listed below. Record results in the template (Section 4).

| Page | URL |
|------|-----|
| Home | `http://localhost:3000/` |
| Article Listing | `http://localhost:3000/articles` |
| Article Detail | `http://localhost:3000/articles/<any-slug>` |

### Step 4: Record Results

Use the template in Section 4 for each audit.

---

## 3. Performance Targets

### Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor | CI Gate |
|--------|------|-------------------|------|---------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5–4.0s | > 4.0s | < 2.5s |
| **FID** (First Input Delay) | < 100ms | 100–300ms | > 300ms | — |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 | < 0.1 |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8–3.0s | > 3.0s | < 1.8s |
| **TTI** (Time to Interactive) | < 3.8s | 3.8–7.3s | > 7.3s | < 5.0s |
| **TBT** (Total Blocking Time) | < 200ms | 200–600ms | > 600ms | — |
| **Speed Index** | < 3.4s | — | — | — |

### Page-Specific Targets

| Page | Desktop Score | Mobile Score | LCP | CLS | TTI |
|------|-------------|--------------|-----|-----|-----|
| Home | ≥ 90 | ≥ 80 | < 2.5s | < 0.1 | < 3.8s |
| Article Listing | ≥ 85 | ≥ 75 | < 3.0s | < 0.1 | < 4.0s |
| Article Detail | ≥ 90 | ≥ 80 | < 2.5s | < 0.1 | < 3.8s |

### Network & Bundle Targets

| Target | Threshold |
|--------|-----------|
| HTTP requests | < 50 per page |
| Compression | gzip or brotli on all text assets |
| Protocol | HTTP/2 |
| Cache-Control headers | Present on all static assets |
| Main JS bundle (gzipped) | < 200KB |
| CSS bundle (gzipped) | < 50KB |
| Total page weight | < 300KB (excluding images) |

---

## 4. Result Recording Template

Copy this template for each page and test run.

```markdown
## Performance Baseline — [Page Name]

**Date:** YYYY-MM-DD
**Environment:** Local production build / Staging / Production
**Build commit:** [git short hash]
**Frontend:** Next.js [version]
**Backend:** ASP.NET Core [version]

### Desktop

| Metric | Value | Target | Pass/Fail |
|--------|-------|--------|-----------|
| Lighthouse Performance Score | | ≥ 90 | |
| LCP | | < 2.5s | |
| FCP | | < 1.8s | |
| TTI | | < 3.8s | |
| TBT | | < 200ms | |
| CLS | | < 0.1 | |
| Speed Index | | < 3.4s | |

### Mobile

| Metric | Value | Target | Pass/Fail |
|--------|-------|--------|-----------|
| Lighthouse Performance Score | | ≥ 80 | |
| LCP | | < 2.5s | |
| FCP | | < 1.8s | |
| TTI | | < 5.0s | |
| CLS | | < 0.1 | |

### Notes

[Any issues found, opportunities, or observations]
```

---

## 5. Performance Optimization Checklist

### Images

- [ ] All images use `next/image` (automatic WebP conversion + lazy loading)
- [ ] Images have explicit `width` and `height` to prevent CLS
- [ ] Above-the-fold images use `priority` prop
- [ ] No raw `<img>` tags for content images

### JavaScript

- [ ] No unnecessary client components — prefer server components
- [ ] Large third-party libraries loaded dynamically with `next/dynamic`
- [ ] No synchronous blocking scripts in `<head>`

### Fonts

- [ ] Fonts loaded via `next/font` (automatic font subsetting + local fallback)
- [ ] No external Google Fonts requests at runtime

### API & Caching

- [ ] Article listing cached with ISR (revalidated on Strapi webhook)
- [ ] Featured articles cached in MemoryCache (backend)
- [ ] Trending articles cached in MemoryCache (backend)
- [ ] Cache-Control headers set on API responses

### Database

- [ ] Queries use `AsNoTracking()` for read-only operations
- [ ] N+1 queries eliminated (use `.Include()` or projections)
- [ ] Indexes on `Slug`, `Category`, `CreatedDate`, `VoteCount`

---

## 6. Lighthouse CI (GitHub Actions)

Lighthouse CI runs automatically on every PR and push to main.

**Configuration:** `lighthouserc.json` at project root.

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm start",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/articles"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.80}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "interactive": ["error", {"maxNumericValue": 5000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

---

## 7. Application Insights Browser Telemetry

In production, Application Insights captures real-user performance via browser SDK:

```kql
// Real-user LCP distribution (last 24h)
browserTimings
| where timestamp > ago(24h)
| summarize
    avg(networkDuration),
    percentiles(totalDuration, 50, 75, 95)
| project avg_network_ms = avg_networkDuration,
          p50_ms = percentile_totalDuration_50,
          p75_ms = percentile_totalDuration_75,
          p95_ms = percentile_totalDuration_95
```

---

## 8. Troubleshooting Low Scores

### Low Performance Score

| Symptom | Common Cause | Fix |
|---------|-------------|-----|
| High LCP | Hero image not prioritized | Add `priority` to hero `<Image>` |
| High TBT | Large JS bundle | Use `next/dynamic` for heavy components |
| High CLS | Images without dimensions | Add explicit `width`/`height` |
| Low score on mobile | Viewport misconfigured | Verify `<meta name="viewport">` in layout |

### LCP > 2.5s

1. Run `npm run build && npm start` — test in production mode
2. Check Lighthouse "Opportunities" — it identifies the specific LCP element
3. Check if the LCP element is an image: add `priority` prop
4. Check if the LCP element is text: ensure font is loaded via `next/font`
5. Check network tab — large API response blocking render?

### TTI > 5s

1. Check bundle size: `npm run build` output shows each route's JS size
2. Large page JS? Use `next/dynamic` with `{ ssr: false }` for client-only widgets
3. Check for hydration mismatches in the browser console (can stall React)

---

## 9. Related Documents

- [TESTING_STRATEGY.md](TESTING_STRATEGY.md) — Quality gates and Lighthouse CI thresholds
- [MONITORING_GUIDE.md](../operations/MONITORING_GUIDE.md) — Application Insights browser telemetry queries
