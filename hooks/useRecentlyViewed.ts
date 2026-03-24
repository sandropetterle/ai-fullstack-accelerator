'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ArticleCategory } from '@/lib/types/article'

const MAX_RECENT = 5
const STORAGE_KEY = 'recently-viewed-articles'

export type RecentArticle = {
  slug: string
  title: string
  category: ArticleCategory
  visitedAt: string // ISO date
}

type UseRecentlyViewedResult = {
  recentArticles: RecentArticle[]
  addRecentArticle: (article: Omit<RecentArticle, 'visitedAt'>) => void
  clearRecentArticles: () => void
}

function readFromStorage(): RecentArticle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecentArticle[]) : []
  } catch {
    return []
  }
}

function writeToStorage(articles: RecentArticle[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  } catch {
    // ignore storage errors
  }
}

export function useRecentlyViewed(): UseRecentlyViewedResult {
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])

  // Hydrate from localStorage after mount
  useEffect(() => {
    setRecentArticles(readFromStorage())
  }, [])

  const addRecentArticle = useCallback(
    (article: Omit<RecentArticle, 'visitedAt'>) => {
      setRecentArticles((prev) => {
        // Deduplicate by slug, prepend, trim to max
        const filtered = prev.filter((a) => a.slug !== article.slug)
        const updated = [
          { ...article, visitedAt: new Date().toISOString() },
          ...filtered,
        ].slice(0, MAX_RECENT)
        writeToStorage(updated)
        return updated
      })
    },
    []
  )

  const clearRecentArticles = useCallback(() => {
    setRecentArticles([])
    writeToStorage([])
  }, [])

  return { recentArticles, addRecentArticle, clearRecentArticles }
}
