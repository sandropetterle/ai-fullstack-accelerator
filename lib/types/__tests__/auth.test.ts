import { hasRole, roleLabel } from '../auth'
import type { UserRole } from '../auth'

describe('hasRole', () => {
  it('returns false when roles is undefined', () => {
    expect(hasRole(undefined, 'Admin')).toBe(false)
  })

  it('returns false when roles is empty', () => {
    expect(hasRole([], 'Admin')).toBe(false)
  })

  it('returns true when user has the exact required role', () => {
    expect(hasRole(['Editor'], 'Editor')).toBe(true)
  })

  it('returns false when user does not have the required role', () => {
    expect(hasRole(['Viewer'], 'Editor')).toBe(false)
  })

  it('returns true for Admin regardless of required role (Admin is superuser)', () => {
    const roles = ['Admin']
    expect(hasRole(roles, 'Editor')).toBe(true)
    expect(hasRole(roles, 'Viewer')).toBe(true)
    expect(hasRole(roles, 'Admin')).toBe(true)
  })

  it('returns true when user has the role among multiple roles', () => {
    expect(hasRole(['Viewer', 'Editor'], 'Editor')).toBe(true)
  })
})

describe('roleLabel', () => {
  it('returns "Viewer" for undefined roles', () => {
    expect(roleLabel(undefined)).toBe('Viewer')
  })

  it('returns "Viewer" for empty roles', () => {
    expect(roleLabel([])).toBe('Viewer')
  })

  it('returns "Admin" when user has Admin role', () => {
    expect(roleLabel(['Admin'])).toBe('Admin')
  })

  it('returns "Editor" when user has only Editor role', () => {
    expect(roleLabel(['Editor'])).toBe('Editor')
  })

  it('returns "Viewer" when user has only Viewer role', () => {
    expect(roleLabel(['Viewer'])).toBe('Viewer')
  })

  it('Admin takes precedence over other roles', () => {
    expect(roleLabel(['Editor', 'Admin'])).toBe('Admin')
  })
})
