/**
 * Authenticated E2E Tests
 *
 * Tests that exercise pages and actions that require a signed-in user.
 * Auth state is set up by e2e/global.setup.ts (runs before all tests) using
 * direct session injection — no Entra CIAM browser login needed.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Describe block          │ Auth required │ When it runs                  │
 * ├─────────────────────────────────────────────────────────────────────────│
 * │ Unauthenticated guards  │ None          │ Always                        │
 * │ Authenticated — UI      │ Session only  │ Always (AUTH_SECRET required)  │
 * │ Authenticated — API     │ Real token    │ Only when E2E_API_WRITES=true  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * "Authenticated — UI" tests use the synthetic session cookie created by
 * global.setup.ts. They verify server-side auth() checks and client-side
 * useSession() rendering without making protected API calls.
 *
 * "Authenticated — API writes" tests (create/edit/delete articles) require a
 * real Entra access token in the session because the ASP.NET Core API validates
 * tokens against Entra's JWKS endpoint. These tests are skipped unless the
 * E2E_API_WRITES env var is set to "true". To enable them, obtain a real
 * session via a full Entra CIAM browser login and replace admin.json manually.
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Mirror the storage path from global.setup.ts
const ADMIN_STORAGE = path.resolve(process.cwd(), 'e2e/.auth/admin.json')

/**
 * True when the admin.json storageState contains at least one cookie — meaning
 * global.setup.ts successfully created a session (either direct injection or
 * a real Entra login). False when AUTH_SECRET was missing or setup failed.
 */
function hasValidSession(): boolean {
  try {
    const state = JSON.parse(fs.readFileSync(ADMIN_STORAGE, 'utf-8'))
    return Array.isArray(state.cookies) && state.cookies.length > 0
  } catch {
    return false
  }
}

/**
 * API-write tests require a real Entra access token so the backend's JWKS
 * validation passes. Opt in by setting E2E_API_WRITES=true in the environment.
 */
const runApiTests = process.env.E2E_API_WRITES === 'true'

// ---------------------------------------------------------------------------
// Unauthenticated access guards — no credentials required
// ---------------------------------------------------------------------------

test.describe('Unauthenticated access guards', () => {
  test('/articles/new redirects to /login when not signed in', async ({ page }) => {
    await page.goto('/articles/new')
    // Auth.js server-side auth() call redirects to /login when there is no session
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(
      page.getByRole('button', { name: /Continue with Microsoft/i })
    ).toBeVisible()
  })

  test('/articles/[slug]/edit redirects to /login when not signed in', async ({ page }) => {
    await page.goto('/articles/building-restful-apis-aspnet-core/edit')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(
      page.getByRole('button', { name: /Continue with Microsoft/i })
    ).toBeVisible()
  })

  test('Edit and Delete buttons are not shown to unauthenticated users', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')
    // ArticleActions returns null when session is absent or lacks Editor role
    await expect(page.getByRole('link', { name: 'Edit', exact: true })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).not.toBeVisible()
  })

  test('New Article button is not shown to unauthenticated users', async ({ page }) => {
    await page.goto('/articles')
    // Give the client-rendered NewArticleButton time to hydrate
    await page.waitForTimeout(2_000)
    await expect(page.getByRole('link', { name: '+ New Article' })).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Authenticated flows — UI checks (session injection, no Entra credentials needed)
// ---------------------------------------------------------------------------

test.describe('Authenticated — UI', () => {
  test.skip(
    !hasValidSession(),
    'Skipped: AUTH_SECRET not set or global.setup failed to create session'
  )
  test.use({ storageState: ADMIN_STORAGE })

  test('New Article button is visible on the articles listing', async ({ page }) => {
    await page.goto('/articles')
    await expect(
      page.getByRole('link', { name: '+ New Article' })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('navigating to /articles/new shows the create form (no redirect)', async ({ page }) => {
    await page.goto('/articles/new')
    // Confirm the form rendered (not redirected). .first() tolerates a transient
    // duplicate form node that the production build can briefly emit during
    // hydration (observed as a strict-mode "2 elements" flake), without masking a
    // real redirect — if auth failed we'd be on /login with no form at all.
    await expect(
      page.locator('[aria-label="Create article form"]').first()
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Create Article/i })).toBeVisible()
  })

  test('Edit button is visible on article detail page', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('link', { name: 'Edit', exact: true })
    ).toBeVisible({ timeout: 5_000 })
  })

  test('Delete button is visible on article detail page', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('button', { name: 'Delete', exact: true })
    ).toBeVisible({ timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// Authenticated flows — API writes (require real Entra access token)
// ---------------------------------------------------------------------------

test.describe('Authenticated — API writes', () => {
  test.skip(
    !runApiTests,
    'Skipped: set E2E_API_WRITES=true with a real Entra session to run create/edit/delete tests'
  )
  test.use({ storageState: ADMIN_STORAGE })

  test('can create a new article end-to-end', async ({ page }) => {
    const title = `E2E Test Article ${Date.now()}`

    await page.goto('/articles/new')
    await expect(
      page.locator('[aria-label="Create article form"]').first()
    ).toBeVisible({ timeout: 10_000 })

    await page.fill('#title', title)
    await page.fill('#shortDescription', 'Created by Playwright E2E test suite.')
    await page.getByRole('button', { name: /Create Article/i }).click()

    // Successful creation redirects to the new article's detail page
    await page.waitForURL(/\/articles\/[a-z0-9-]+$/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title)
  })

  test('can edit an existing article and save changes', async ({ page }) => {
    await page.goto('/articles/building-restful-apis-aspnet-core/edit')
    await expect(
      page.locator('[aria-label="Edit article form"]').first()
    ).toBeVisible({ timeout: 10_000 })

    // Update the author field (safe — doesn't affect the slug or break other tests)
    await page.fill('#author', `E2E Edited ${Date.now()}`)
    await page.getByRole('button', { name: /Save Changes/i }).click()

    // Successful edit redirects to the article detail page
    await page.waitForURL(/\/articles\/building-restful-apis-aspnet-core$/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('RESTful APIs')
  })

  test('can create and immediately delete an article end-to-end', async ({ page }) => {
    const title = `E2E Delete Test ${Date.now()}`

    // Step 1: Create a temporary article
    await page.goto('/articles/new')
    await expect(
      page.locator('[aria-label="Create article form"]').first()
    ).toBeVisible({ timeout: 10_000 })
    await page.fill('#title', title)
    await page.fill('#shortDescription', 'Temporary article created for the delete E2E test.')
    await page.getByRole('button', { name: /Create Article/i }).click()

    await page.waitForURL(/\/articles\/[a-z0-9-]+$/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title)

    // Step 2: Delete the article via the AlertDialog
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByText('Delete Article?')).toBeVisible()

    // The confirm button inside the dialog (distinct from the trigger button)
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

    // Deletion redirects to /articles
    await page.waitForURL(/\/articles$/, { timeout: 20_000 })
    await expect(
      page.getByRole('heading', { name: 'Browse Articles', level: 1 })
    ).toBeVisible()
  })
})
