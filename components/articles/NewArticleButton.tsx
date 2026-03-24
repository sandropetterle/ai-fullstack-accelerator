'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { hasRole } from '@/lib/types/auth'

export function NewArticleButton() {
  const { data: session, status } = useSession()

  if (status === 'loading' || !hasRole(session?.user?.roles, 'Editor')) {
    return null
  }

  return (
    <Button asChild>
      <Link href="/articles/new">+ New Article</Link>
    </Button>
  )
}
