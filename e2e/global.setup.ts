/**
 * Playwright Global Setup
 *
 * Creates an authenticated Admin storageState file used by authenticated-flows.spec.ts.
 *
 * Strategy: Direct session injection (bypasses Entra CIAM browser login entirely)
 * ─────────────────────────────────────────────────────────────────────────────
 * Previous approach: Playwright drove a real headless browser through the Entra
 * CIAM login UI, which proved fragile in CI — Entra's "Stay signed in?" (KMSI)
 * prompt blocked the OIDC redirect regardless of the dismissal technique used
 * (direct click, waitForURL + click, MutationObserver via addInitScript).
 *
 * Current approach: Auth.js's own encode() function (@auth/core/jwt) produces a
 * valid JWE-encrypted session cookie that Auth.js accepts. This is deterministic,
 * takes <100ms, and requires only AUTH_SECRET — no external IdP dependency.
 *
 * Trade-off: The injected session contains a placeholder accessToken that will be
 * rejected by the backend API's JWKS validation. E2E tests that call protected API
 * endpoints (POST/PUT/DELETE /api/articles) are skipped by default — they require
 * a real Entra token obtainable only via a full OIDC browser flow. See the
 * "Authenticated — API writes" describe block in authenticated-flows.spec.ts.
 */

import { FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { createSessionCookie, buildStorageState } from './auth-helpers'

/**
 * Path to the persisted Playwright storageState file for the Admin account.
 * Imported by authenticated-flows.spec.ts so both files reference the same path.
 */
export const ADMIN_STORAGE = path.resolve(process.cwd(), 'e2e/.auth/admin.json')

export default async function globalSetup(_config: FullConfig) {
  // Always ensure the .auth/ directory exists so test.use({ storageState }) never
  // throws a file-not-found error, even if this setup exits early.
  fs.mkdirSync(path.dirname(ADMIN_STORAGE), { recursive: true })

  if (!process.env.AUTH_SECRET) {
    console.log(
      '  ⚠  AUTH_SECRET not set — authenticated tests will be skipped.\n' +
      '     Set AUTH_SECRET to enable authenticated UI tests (no Entra credentials required).'
    )
    fs.writeFileSync(ADMIN_STORAGE, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  try {
    console.log('  → Creating Admin session cookie (direct injection, no browser login)…')
    const cookieValue = await createSessionCookie({ roles: ['Admin'] })
    const state = buildStorageState(cookieValue)
    fs.writeFileSync(ADMIN_STORAGE, JSON.stringify(state))
    console.log('  ✓ Admin session state saved: e2e/.auth/admin.json')
    console.log('  ℹ  Session has placeholder accessToken — API-write tests are skipped by default.')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  ⚠  Session creation failed (${msg}) — authenticated tests will be skipped`)
    fs.writeFileSync(ADMIN_STORAGE, JSON.stringify({ cookies: [], origins: [] }))
  }
}
