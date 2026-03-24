'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { roleLabel } from '@/lib/types/auth'

type UserMenuProps = {
  signInLabel?: string
  signOutLabel?: string
  userMenuLabel?: string
  newArticleButtonLabel?: string
}

/**
 * Header user menu — shows sign-in button when unauthenticated,
 * or a dropdown with user info and sign-out when authenticated.
 * Labels are optional (CMS-driven) with hardcoded fallbacks.
 */
export function UserMenu({
  signInLabel = 'Sign In',
  signOutLabel = 'Sign Out',
  userMenuLabel = 'User menu',
}: UserMenuProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="h-9 w-24 animate-pulse rounded-md bg-muted" aria-hidden="true" />
    )
  }

  if (!session) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => signIn('entra-external-id')}
        className="gap-2"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {signInLabel}
      </Button>
    )
  }

  const name = session.user?.name ?? session.user?.email ?? 'User'
  const role = roleLabel(session.user?.roles)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label={userMenuLabel}>
          <User className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline max-w-[120px] truncate">{name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none truncate">{name}</p>
            {session.user?.email && (
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            )}
            <Badge variant="secondary" className="mt-1 w-fit text-xs">
              {role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-destructive focus:text-destructive gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
