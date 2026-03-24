import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Provider abstraction: swapping to Auth0, Keycloak, or any OIDC provider
 * only requires changing the environment variables and the `issuer` value below.
 * No application code changes needed.
 */
export const config: NextAuthConfig = {
  providers: [
    {
      id: 'entra-external-id',
      name: 'Microsoft',
      type: 'oidc',
      issuer: process.env.AUTH_ENTRA_ISSUER,
      clientId: process.env.AUTH_ENTRA_CLIENT_ID,
      clientSecret: process.env.AUTH_ENTRA_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'openid',
            'profile',
            'email',
            process.env.AUTH_API_SCOPE_READ ?? 'api://aipatterns-api/patterns.read',
            process.env.AUTH_API_SCOPE_WRITE ?? 'api://aipatterns-api/patterns.write',
          ].join(' '),
        },
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, persist the access token and roles into the JWT
      if (account) {
        token.accessToken = account.access_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined
        // Entra External ID includes app roles in the access token "roles" claim
        const rawToken = account.access_token
          ? parseJwtPayload(account.access_token)
          : null
        token.roles = rawToken?.roles ?? []
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.user.roles = (token.roles as string[]) ?? []
      return session
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)

/**
 * Safely decode a JWT payload (base64url) without verifying the signature.
 * Used only to extract the roles claim from the access token for session storage.
 * Token signature verification happens in the ASP.NET Core API.
 */
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}
