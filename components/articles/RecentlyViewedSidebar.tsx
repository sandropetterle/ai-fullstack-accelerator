'use client'

import Link from 'next/link'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Clock, X } from 'lucide-react'

type RecentlyViewedSidebarProps = {
  recentlyViewedHeader?: string
  clearLabel?: string
}

export function RecentlyViewedSidebar({
  recentlyViewedHeader = 'Recently Viewed',
  clearLabel = 'Clear',
}: RecentlyViewedSidebarProps) {
  const { recentArticles, clearRecentArticles } = useRecentlyViewed()

  if (recentArticles.length === 0) return null

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {recentlyViewedHeader}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentArticles}
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Clear recently viewed history"
        >
          <X className="h-3 w-3 mr-1" />
          {clearLabel}
        </Button>
      </div>
      <ul className="space-y-2" aria-label="Recently viewed articles">
        {recentArticles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/articles/${article.slug}`}
              className="block text-sm hover:text-primary transition-colors leading-snug"
              aria-label={`${article.title} (${article.category})`}
            >
              <span className="line-clamp-2">{article.title}</span>
              <Badge variant="outline" className="text-xs mt-0.5">
                {article.category}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
