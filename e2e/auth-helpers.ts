/**
 * E2E Authentication Helpers
 *
 * Provides utilities for creating valid Auth.js session cookies programmatically,
 * bypassing the full OIDC browser login flow. This makes authenticated E2E tests:
 *  - Fast: cookie creation takes <100ms vs 45-60s for Entra CIAM login
 *  - Reliable: no dependency on external IdP UI behaviour or network latency
 *  - Deterministic: same output for same inputs, no KMSI prompts or MFA
 *
 * Uses Auth.js's own `encode()` function from @auth/core/jwt, which produces
 * the same JWE-encrypted cookie format that Auth.js normally creates after OIDC.
 *
 * Limitation: The injected session contains a placeholder `accessToken`. Requests
 * that reach the ASP.NET Core API (POST/PUT/DELETE /api/articles) will receive a
 * 401 because the token fails Entra's JWKS validation. Only UI-level tests (that
 * check session state via useSession() / auth(), but don't call the protected API)
 * are suitable for this approach. See e2e/authenticated-flows.spec.ts for how the
 * test suite is split accordingly.
 */

import { encode } from '@auth/core/jwt'

/** The Auth.js session cookie name for non-HTTPS origins (localhost). */
const COOKIE_NAME = 'authjs.session-token'

/** Default session lifetime: 30 days (in seconds). */
const MAX_AGE = 30 * 24 * 60 * 60

/**
 * Creates a JWE-encrypted Auth.js session cookie value containing the given
 * roles. The token shape matches what auth.ts's `jwt` callback produces so
 * that the `session` callback can read `token.roles` and `token.accessToken`.
 */
export async function createSessionCookie(options: {
  roles: string[]
  name?: string
  email?: string
}): Promise<string> {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is required for session cookie creation')

  const token = {
    // Standard OIDC claims (also used by Auth.js session)
    name: options.name ?? 'E2E Test Admin',
    email: options.email ?? 'e2e-admin@test.local',
    picture: null,
    sub: 'e2e-test-admin-id',
    // Custom fields set by auth.ts jwt() callback
    roles: options.roles,
    // Placeholder bearer token — sufficient for useSession()/auth() checks but
    // will be rejected by the backend API's JWKS validation.
    accessToken: 'e2e-placeholder-token',
    accessTokenExpires: Date.now() + MAX_AGE * 1000,
  }

  // encode() automatically sets iat, exp (now + maxAge), and jti
  return encode({ token, secret, salt: COOKIE_NAME, maxAge: MAX_AGE })
}

/**
 * Builds a Playwright storageState object containing the session cookie.
 * Write this to a JSON file and pass it to `test.use({ storageState })`.
 */
export function buildStorageState(cookieValue: string) {
  return {
    cookies: [
      {
        name: COOKIE_NAME,
        value: cookieValue,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax' as const,
        secure: false,
        // expires in seconds (Unix timestamp), as required by Playwright
        expires: Math.floor(Date.now() / 1000) + MAX_AGE,
      },
    ],
    origins: [],
  }
}
