/**
 * E2E Tests — Critical User Flows
 *
 * Covers the core journeys a real user takes through the app.
 * Selectors use semantic HTML (role, label, placeholder, text) because no
 * data-testid attributes exist in the production components.
 *
 * Prerequisites (handled by the CI workflow):
 *   - Backend running on http://localhost:5255
 *   - Frontend running on http://localhost:3000
 */

import { test, expect, type Page } from '@playwright/test'

/**
 * Set a date input value in a way that reliably triggers React's synthetic
 * onChange across all browsers, including webkit.
 *
 * webkit's native date-picker widget can intercept page.fill() and prevent
 * the synthetic change event from firing. Using the native HTMLInputElement
 * value setter + manual event dispatch bypasses that and correctly signals
 * React that the controlled value changed.
 */
async function fillDateInput(page: Page, selector: string, value: string) {
  // .first() guards against a Firefox-only quirk where the production build can
  // render a duplicate date <input> during hydration (see the date-range
  // beforeEach). Callers pass a `:visible` selector so we target the desktop
  // FilterPanel input; .first() then collapses any identical twin to one node.
  await page.locator(selector).first().evaluate((el, val: string) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

test.describe('Home Page', () => {
  test('loads with hero heading', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'AI Fullstack Accelerator', level: 1 })
    ).toBeVisible()
  })

  test('displays featured article cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // ArticleCard renders as <Link href="/articles/[slug]"> → <a>
    const articleLinks = page.locator('a[href^="/articles/"]')
    await expect(articleLinks.first()).toBeVisible({ timeout: 15_000 })
  })

  test('"Browse Articles" CTA navigates to the listing page', async ({ page }) => {
    await page.goto('/')

    // Hero renders a "Browse Articles" link button
    await page.getByRole('link', { name: /Browse Articles/i }).first().click()

    // Wait for heading rather than URL — Turbopack may take a moment to compile the
    // /articles route the first time, so allow a generous timeout.
    await expect(
      page.getByRole('heading', { name: 'Browse Articles', level: 1 })
    ).toBeVisible({ timeout: 60_000 })
  })
})

// ---------------------------------------------------------------------------
// Browse Articles Page
// ---------------------------------------------------------------------------

test.describe('Browse Articles Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')
  })

  test('displays heading, search bar and article cards', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Browse Articles', level: 1 })
    ).toBeVisible()

    await expect(page.getByPlaceholder('Search articles...')).toBeVisible()

    await expect(page.locator('a[href^="/articles/"]').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('search updates the URL with the q parameter', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search articles...')
    await searchInput.fill('architecture')
    await searchInput.press('Enter')

    // SearchBar uses `q` — NOT `search`
    await page.waitForURL(/\/articles\?.*q=architecture/)
    expect(page.url()).toContain('q=architecture')
  })

  test('clearing the search removes the q parameter', async ({ page }) => {
    await page.goto('/articles?q=architecture')

    // Wait for the clear button directly — proves the page loaded with the
    // query applied. Avoids waitForLoadState('networkidle') which times out
    // in CI because Next.js production builds prefetch link targets
    // indefinitely, preventing the idle state from ever being reached.
    const clearButton = page.getByRole('button', { name: /Clear search/i })
    await expect(clearButton).toBeVisible({ timeout: 15_000 })
    await clearButton.click()

    await page.waitForURL((url) => !url.href.includes('q='))
    expect(page.url()).not.toContain('q=')
  })

  test('category filter button updates URL with category parameter', async ({ page }) => {
    // FilterPanel is visible only on lg screens (Desktop Chrome viewport is wide enough).
    // Buttons use aria-pressed to indicate active state.
    const tutorialBtn = page
      .locator('button[aria-pressed]')
      .filter({ hasText: 'Tutorial' })
      .first()

    await expect(tutorialBtn).toBeVisible({ timeout: 5_000 })
    await tutorialBtn.click()

    await page.waitForURL(/\/articles\?.*category=Tutorial/)
    expect(page.url()).toContain('category=Tutorial')
  })

  test('active category filter can be cleared', async ({ page }) => {
    await page.goto('/articles?category=Tutorial')

    // Wait for "Clear all" directly — proves the filter is active and the
    // FilterPanel rendered. Avoids waitForLoadState('networkidle') timeout
    // caused by Next.js production prefetching.
    const clearAll = page.getByRole('button', { name: 'Clear all' })
    await expect(clearAll).toBeVisible({ timeout: 15_000 })
    await clearAll.click()

    await page.waitForURL((url) => !url.href.includes('category='))
    expect(page.url()).not.toContain('category=')
  })

  test('tag checkbox toggles a tags parameter in the URL', async ({ page }) => {
    // Tags are rendered as labelled checkboxes: <Checkbox id="tag-{tag}"> + <label>
    const cleanArchCheckbox = page.getByRole('checkbox', { name: 'Architecture' })

    await expect(cleanArchCheckbox).toBeVisible({ timeout: 5_000 })
    await cleanArchCheckbox.click()

    await page.waitForURL(/\/articles\?.*tags=/)
    expect(page.url()).toContain('tags=')
  })
})

// ---------------------------------------------------------------------------
// Article Detail Page
// ---------------------------------------------------------------------------

test.describe('Article Detail Page', () => {
  test('loads the seeded article by slug and shows correct heading', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Clean Architecture')
  })

  test('shows the voting button in an enabled state', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    // VotingButton renders: <Button>…{voteCount} <span>votes</span></Button>
    const voteButton = page.getByRole('button', { name: /votes/i })
    await expect(voteButton).toBeVisible({ timeout: 5_000 })
    await expect(voteButton).toBeEnabled()
  })

  test('voting increments the displayed count optimistically', async ({ page }) => {
    // Intercept the vote fetch at the JavaScript level before any page scripts run.
    // page.addInitScript runs in the browser before the app bundle loads, so it
    // overrides window.fetch for ALL client-side calls including the vote handler.
    // A 500 ms delay lets us observe the optimistic count+1 in the DOM before the
    // mock response arrives (React commits the +1 synchronously in the event handler,
    // before the first await in handleVote).
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/vote')) {
          await new Promise<void>(r => setTimeout(r, 500))
          return new Response(
            JSON.stringify({ voteCount: 99, articleId: 'mocked' }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return orig(input, init)
      }
    })

    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    const voteButton = page.getByRole('button', { name: /votes/i })
    await expect(voteButton).toBeEnabled({ timeout: 5_000 })

    const initialText = await voteButton.textContent() ?? ''
    const initialCount = parseInt(initialText.match(/(\d+)/)?.[1] ?? '0', 10)

    await voteButton.click()

    // React commits count+1 SYNCHRONOUSLY in the event handler before the
    // first await, so the optimistic value is visible in the DOM immediately
    // after the click (well before the 500 ms mock delay expires).
    await expect(voteButton).toContainText(`${initialCount + 1}`, { timeout: 3_000 })
  })

  test('vote button is disabled after voting to prevent duplicate votes', async ({
    page,
  }) => {
    // Same fetch intercept strategy: override window.fetch before page scripts
    // so the vote call succeeds instantly, keeping hasVoted=true permanently.
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/vote')) {
          return new Response(
            JSON.stringify({ voteCount: 43, articleId: 'mocked' }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return orig(input, init)
      }
    })

    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    const voteButton = page.getByRole('button', { name: /votes/i })
    await expect(voteButton).toBeEnabled({ timeout: 5_000 })
    await voteButton.click()

    // setHasVoted(true) is synchronous — button becomes disabled immediately.
    // With the mock returning 201 the API call succeeds, so hasVoted stays true
    // and the button remains disabled after the response is processed.
    await expect(voteButton).toBeDisabled({ timeout: 5_000 })
  })

  test('breadcrumb contains links back to Home and Articles', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    // Breadcrumb renders as <nav> + <ol>
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/"]') }).first()
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Articles' })).toBeVisible()
  })

  test('clicking an article card on the listing navigates to its detail page', async ({
    page,
  }) => {
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href^="/articles/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 10_000 })

    const href = await firstLink.getAttribute('href')
    await firstLink.click()

    await page.waitForURL(/\/articles\/[\w-]+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    if (href) expect(page.url()).toContain(href)
  })
})

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

test.describe('Error Handling', () => {
  test('navigating to a non-existent article slug shows the 404 page', async ({
    page,
  }) => {
    await page.goto('/articles/this-slug-absolutely-does-not-exist-99999')
    await page.waitForLoadState('networkidle')

    // app/not-found.tsx renders: <h1>404</h1> + <h2>Page Not Found</h2>
    await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible()
    await expect(page.getByText('Page Not Found')).toBeVisible()
  })

  test('404 page has a working "Back to Home" link', async ({ page }) => {
    await page.goto('/articles/nonexistent-article-xyz-abc')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /Back to Home/i }).click()
    await page.waitForURL('/')

    await expect(
      page.getByRole('heading', { name: 'AI Fullstack Accelerator', level: 1 })
    ).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Advanced Search — Date Range Filter
// ---------------------------------------------------------------------------

test.describe('Advanced Search — Date Range Filter', () => {
  // DateRangeFilter lives inside FilterPanel which is desktop-only (lg:block).
  // Desktop Chrome viewport (1280×720) satisfies the lg breakpoint.

  test.beforeEach(async ({ page }) => {
    await page.goto('/articles')
    // Wait for the date input to be visible — stronger signal than the heading
    // alone. The heading appears in server-rendered HTML before React hydrates,
    // but the date input confirms FilterPanel is mounted with event handlers
    // attached. This prevents a race where the fill runs before onChange is wired.
    //
    // Scope to `:visible` + .first(): on Firefox the production build can briefly
    // render TWO #date-from inputs during hydration (a lone duplicate — the tag
    // checkboxes and Filters heading are NOT duplicated), which makes a bare
    // `#date-from` locator throw a strict-mode violation. `:visible` selects the
    // mounted desktop FilterPanel input and .first() collapses any visible twin.
    await expect(page.locator('#date-from:visible').first()).toBeVisible({ timeout: 10_000 })
  })

  test('setting a From date updates the URL with dateFrom parameter', async ({ page }) => {
    await fillDateInput(page, '#date-from:visible', '2024-01-01')
    await page.waitForURL(/dateFrom=2024-01-01/, { timeout: 10_000 })
    expect(page.url()).toContain('dateFrom=2024-01-01')
  })

  test('setting a To date updates the URL with dateTo parameter', async ({ page }) => {
    // Pre-navigate with dateFrom set so the "To" input has a valid min attribute.
    // Without a valid min, Chromium silently rejects fill() on type="date" inputs
    // and the React onChange never fires.
    await page.goto('/articles?dateFrom=2024-01-01')
    await expect(page.locator('#date-to:visible').first()).toBeVisible({ timeout: 10_000 })

    await fillDateInput(page, '#date-to:visible', '2024-12-31')
    await page.waitForURL(/dateTo=2024-12-31/, { timeout: 10_000 })
    expect(page.url()).toContain('dateTo=2024-12-31')
  })

  test('Clear dates button removes date parameters from URL', async ({ page }) => {
    // Navigate directly with both params pre-set — avoids relying on fill()
    // to set up state; only tests the Clear button interaction itself.
    await page.goto('/articles?dateFrom=2024-01-01&dateTo=2024-12-31')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    const clearDatesBtn = page.getByRole('button', { name: /Clear dates/i })
    await expect(clearDatesBtn).toBeVisible({ timeout: 5_000 })
    await clearDatesBtn.click()

    await page.waitForURL((url) => !url.href.includes('dateFrom='), { timeout: 20_000 })
    expect(page.url()).not.toContain('dateFrom=')
    expect(page.url()).not.toContain('dateTo=')
  })
})

// ---------------------------------------------------------------------------
// Advanced Search — Tag AND/OR Mode Toggle
// ---------------------------------------------------------------------------

test.describe('Advanced Search — Tag Mode Toggle', () => {
  test('selecting two tags reveals the Any / All toggle', async ({ page }) => {
    await page.goto('/articles')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    // Select first tag (Architecture)
    const firstTag = page.getByRole('checkbox', { name: 'Architecture' })
    await expect(firstTag).toBeVisible({ timeout: 5_000 })
    await firstTag.click()
    // Use toHaveURL (assertion-based polling) instead of waitForURL (navigation event)
    // — more reliable with Next.js pushState soft-navigation across all browsers
    await expect(page).toHaveURL(/tags=/, { timeout: 10_000 })

    // Select a second tag (Security) — toggles comma-separated tags list
    const secondTag = page.getByRole('checkbox', { name: 'Security' })
    await expect(secondTag).toBeVisible({ timeout: 5_000 })
    await secondTag.click()
    // Wait for URL to reflect both tags before checking toggle
    // — comma may be URL-encoded as %2C (WebKit encodes it; Chromium uses literal comma)
    // — FilterPanel only renders the Any/All toggle when selectedTags.length >= 2
    await expect(page).toHaveURL(/tags=[^&]*(%2C|,)/i, { timeout: 10_000 })

    // With 2+ tags the Any / All buttons should appear
    await expect(
      page.getByRole('button', { name: 'Any', exact: true })
    ).toBeVisible({ timeout: 5_000 })
    await expect(
      page.getByRole('button', { name: 'All', exact: true })
    ).toBeVisible({ timeout: 5_000 })
  })

  test('clicking "All" sets tagMode=all in the URL', async ({ page }) => {
    await page.goto('/articles')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    // Pre-select two tags then switch to All mode
    const firstTag = page.getByRole('checkbox', { name: 'Architecture' })
    await expect(firstTag).toBeVisible({ timeout: 5_000 })
    await firstTag.click()
    await expect(page).toHaveURL(/tags=/, { timeout: 10_000 })

    const secondTag = page.getByRole('checkbox', { name: 'Security' })
    await expect(secondTag).toBeVisible({ timeout: 5_000 })
    await secondTag.click()
    await expect(page).toHaveURL(/tags=[^&]*(%2C|,)/i, { timeout: 10_000 })

    const allBtn = page.getByRole('button', { name: 'All', exact: true })
    await expect(allBtn).toBeVisible({ timeout: 5_000 })
    await allBtn.click()

    // toHaveURL (assertion polling) instead of waitForURL (navigation event):
    // this is the 3rd soft pushState in the chain and waitForURL intermittently
    // misses it on all browsers (observed flaky on chromium + webkit).
    await expect(page).toHaveURL(/tagMode=all/, { timeout: 10_000 })
  })
})

// ---------------------------------------------------------------------------
// Recently Viewed Articles
// ---------------------------------------------------------------------------

test.describe('Recently Viewed Articles', () => {
  test('visiting an article then browsing shows it in the Recently Viewed sidebar', async ({
    page,
  }) => {
    // Visit the article detail page — RecentlyViewedTracker records it in localStorage.
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    // Navigate to the articles listing.
    await page.goto('/articles')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    // The "Recently viewed articles" list should be visible in the sidebar.
    const recentList = page.getByRole('list', { name: 'Recently viewed articles' })
    await expect(recentList).toBeVisible({ timeout: 5_000 })

    // The visited article should appear as a link.
    await expect(
      recentList.getByRole('link', { name: /Clean Architecture/i })
    ).toBeVisible()
  })

  test('Clear recently viewed button removes entries and hides the sidebar section', async ({
    page,
  }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')

    await page.goto('/articles')

    const recentList = page.getByRole('list', { name: 'Recently viewed articles' })
    await expect(recentList).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Clear recently viewed history' }).click()

    // Once cleared the list disappears (component renders nothing when empty).
    await expect(recentList).not.toBeVisible({ timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// Saved Searches
// ---------------------------------------------------------------------------

test.describe('Saved Searches', () => {
  test('active filters reveal the "Save current" button', async ({ page }) => {
    // Navigate with a pre-applied category filter.
    await page.goto('/articles?category=Tutorial')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByRole('button', { name: 'Save current' })
    ).toBeVisible({ timeout: 5_000 })
  })

  test('saving a named search persists it in the saved list', async ({ page }) => {
    await page.goto('/articles?category=Tutorial')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    // Open the save dialog.
    await page.getByRole('button', { name: 'Save current' }).click()

    // Fill in the search name and confirm.
    await page.fill('#search-name', 'Tutorial searches')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    // The saved search should now appear in the list.
    const savedList = page.getByRole('list', { name: 'Saved searches' })
    await expect(savedList).toBeVisible({ timeout: 5_000 })
    await expect(savedList.getByText('Tutorial searches')).toBeVisible()
  })

  test('applying a saved search updates the URL with the saved filters', async ({ page }) => {
    // Step 1: save a search while filters are active.
    await page.goto('/articles?category=Tutorial')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Save current' }).click()
    await page.fill('#search-name', 'My Tutorials')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    // Step 2: navigate away to clear all URL params.
    await page.goto('/articles')

    // Step 3: apply the saved search from the sidebar.
    const savedList = page.getByRole('list', { name: 'Saved searches' })
    await expect(savedList).toBeVisible({ timeout: 5_000 })
    // exact: true prevents matching the delete button whose aria-label is
    // "Delete saved search: My Tutorials" (contains the name as substring).
    await savedList.getByRole('button', { name: 'My Tutorials', exact: true }).click()

    // toHaveURL (assertion polling) is more reliable than waitForURL for the
    // soft pushState that applying a saved search triggers (observed flaky).
    await expect(page).toHaveURL(/category=Tutorial/, { timeout: 10_000 })
  })

  test('deleting a saved search removes it from the list', async ({ page }) => {
    // Save a search first.
    await page.goto('/articles?category=Tutorial')
    await expect(
      page.getByRole('heading', { name: 'Filters' })
    ).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Save current' }).click()
    await page.fill('#search-name', 'Delete Me')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    const savedList = page.getByRole('list', { name: 'Saved searches' })
    await expect(savedList.getByText('Delete Me')).toBeVisible({ timeout: 5_000 })

    // Delete it.
    await page.getByRole('button', { name: 'Delete saved search: Delete Me' }).click()

    await expect(savedList.getByText('Delete Me')).not.toBeVisible({ timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// Page Titles (Accessibility / SEO)
// ---------------------------------------------------------------------------

test.describe('Page Titles', () => {
  test('home page has the correct document title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Home/i)
  })

  test('browse page title includes "Browse Articles"', async ({ page }) => {
    await page.goto('/articles')
    await expect(page).toHaveTitle(/Browse Articles/i)
  })

  test('article detail title includes the article name', async ({ page }) => {
    await page.goto('/articles/getting-started-clean-architecture')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/Clean Architecture/i)
  })
})
