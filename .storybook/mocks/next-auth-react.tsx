/**
 * Storybook mock for next-auth/react.
 * Configured via module alias in .storybook/main.ts.
 *
 * To set a specific session state in a story, use the `withSession` decorator:
 *
 *   import { withSession, MOCK_ADMIN_SESSION } from '../../.storybook/mocks/next-auth-react'
 *   export const AdminView: Story = { decorators: [withSession(MOCK_ADMIN_SESSION)] }
 */
import React, { createContext, useContext, type ReactNode } from 'react'

export type MockSessionData = {
  user: {
    name?: string
    email?: string
    roles?: string[]
  }
} | null

export type MockSessionState = {
  data: MockSessionData
  status: 'authenticated' | 'unauthenticated' | 'loading'
}

const MockSessionContext = createContext<MockSessionState>({
  data: null,
  status: 'unauthenticated',
})

export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode
  session?: MockSessionData
}) {
  return (
    <MockSessionContext.Provider
      value={{
        data: session ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      }}
    >
      {children}
    </MockSessionContext.Provider>
  )
}

export function useSession(): MockSessionState {
  return useContext(MockSessionContext)
}

export function signIn(provider?: string) {
  console.log(`[Mock next-auth] signIn(${provider ?? ''})`)
}

export function signOut(opts?: { callbackUrl?: string }) {
  console.log(`[Mock next-auth] signOut(${opts?.callbackUrl ?? ''})`)
}

// ---------- Convenience fixtures ----------

export const MOCK_ADMIN_SESSION: MockSessionData = {
  user: { name: 'Alice Admin', email: 'alice@example.com', roles: ['Admin'] },
}

export const MOCK_EDITOR_SESSION: MockSessionData = {
  user: { name: 'Bob Editor', email: 'bob@example.com', roles: ['Editor'] },
}

export const MOCK_VIEWER_SESSION: MockSessionData = {
  user: { name: 'Carol Viewer', email: 'carol@example.com', roles: ['Viewer'] },
}

// ---------- Story decorator ----------

type StoryComponent = React.ComponentType

export function withSession(session: MockSessionData) {
  return function decorator(Story: StoryComponent) {
    return (
      <MockSessionContext.Provider
        value={{
          data: session,
          status: session ? 'authenticated' : 'unauthenticated',
        }}
      >
        <Story />
      </MockSessionContext.Provider>
    )
  }
}

export const withLoadingSession = (Story: StoryComponent) => (
  <MockSessionContext.Provider value={{ data: null, status: 'loading' }}>
    <Story />
  </MockSessionContext.Provider>
)
