'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

type Props = {
  children: React.ReactNode
  session?: Session | null
}

/**
 * Thin wrapper around next-auth's SessionProvider.
 * Kept as a separate file so the root layout stays a Server Component.
 */
export function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
