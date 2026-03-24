import type { DefaultSession } from 'next-auth'

/**
 * Extends the next-auth Session type to include our custom fields.
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      roles?: string[]
    } & DefaultSession['user']
  }
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer'

/**
 * Check whether the user has at least the required role.
 * Admin is treated as a superset of all roles.
 */
export function hasRole(roles: string[] | undefined, required: UserRole): boolean {
  if (!roles || roles.length === 0) return false
  if (roles.includes('Admin')) return true
  return roles.includes(required)
}

/**
 * Returns the display label for a role.
 */
export function roleLabel(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) return 'Viewer'
  if (roles.includes('Admin')) return 'Admin'
  if (roles.includes('Editor')) return 'Editor'
  return 'Viewer'
}
