# CMS Removal Guide

If you don't need Strapi CMS, follow these steps to strip it from the accelerator.

## Files and Directories to Delete

```
cms/                          # Entire Strapi 5 project
lib/cms/                      # CMS client, types, queries, sanitize, components
```

## App Pages to Update

The following pages use CMS content with hardcoded fallbacks. Remove the CMS fetch and keep the fallback (or replace with your own content):

- `app/page.tsx` — Hero section, home page content
- `app/about/page.tsx` — About page content
- `app/docs/page.tsx` — Docs page content

Look for `// CMS:` comments in source files — these mark CMS-dependent sections that have hardcoded fallbacks.

## Config Files to Update

### `next.config.mjs`
Remove the Strapi hostname from `images.remotePatterns` if you added one.

### `docker-compose.yml`
Remove the `cms` profile services:
- `mysql` service
- `strapi` service

### `.env.example` / `.env.local`
Remove:
```
STRAPI_URL=
STRAPI_API_TOKEN=
```

### `.github/workflows/`
Delete `cms-container-deploy.yml`.

### `infrastructure/`
Remove MySQL and CMS-related Bicep modules if using Azure IaC.

## Components to Update

Search for imports from `@/lib/cms` and remove or replace them:

```bash
grep -r "lib/cms" app/ components/ --include="*.tsx" --include="*.ts"
```

## Storybook

Remove any stories that depend on CMS components from `lib/cms/components.tsx`.

## Verification

After removal:
```bash
npm run build    # Should compile without errors
npm test         # All tests should pass
```
