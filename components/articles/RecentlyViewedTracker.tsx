'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import type { ArticleCategory } from '@/lib/types/article'

type RecentlyViewedTrackerProps = {
  slug: string
  title: string
  category: ArticleCategory
}

export function RecentlyViewedTracker({ slug, title, category }: RecentlyViewedTrackerProps) {
  const { addRecentArticle } = useRecentlyViewed()

  useEffect(() => {
    addRecentArticle({ slug, title, category })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]) // Only re-run when slug changes, not on every render

  return null
}
