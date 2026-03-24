'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MAX_SAVED = 10
const STORAGE_KEY = 'saved-searches'

export type SavedSearchParams = {
  q?: string
  category?: string
  tags?: string[]
  sort?: string
  dateFrom?: string
  dateTo?: string
  tagMode?: string
}

export type SavedSearch = {
  id: string
  name: string
  params: SavedSearchParams
  savedAt: string // ISO date
}

type UseSavedSearchesResult = {
  savedSearches: SavedSearch[]
  saveSearch: (name: string, params: SavedSearchParams) => void
  deleteSearch: (id: string) => void
  applySavedSearch: (search: SavedSearch) => void
}

function readFromStorage(): SavedSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedSearch[]) : []
  } catch {
    return []
  }
}

function writeToStorage(searches: SavedSearch[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // ignore storage errors
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useSavedSearches(): UseSavedSearchesResult {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const router = useRouter()

  // Hydrate from localStorage after mount
  useEffect(() => {
    setSavedSearches(readFromStorage())
  }, [])

  const saveSearch = useCallback((name: string, params: SavedSearchParams) => {
    setSavedSearches((prev) => {
      const newSearch: SavedSearch = {
        id: generateId(),
        name,
        params,
        savedAt: new Date().toISOString(),
      }
      const updated = [newSearch, ...prev].slice(0, MAX_SAVED)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const deleteSearch = useCallback((id: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const applySavedSearch = useCallback(
    (search: SavedSearch) => {
      const params = new URLSearchParams()
      if (search.params.q) params.set('q', search.params.q)
      if (search.params.category) params.set('category', search.params.category)
      if (search.params.tags?.length) params.set('tags', search.params.tags.join(','))
      if (search.params.sort) params.set('sort', search.params.sort)
      if (search.params.dateFrom) params.set('dateFrom', search.params.dateFrom)
      if (search.params.dateTo) params.set('dateTo', search.params.dateTo)
      if (search.params.tagMode && search.params.tagMode !== 'any')
        params.set('tagMode', search.params.tagMode)
      router.push(`/articles?${params.toString()}`)
    },
    [router]
  )

  return { savedSearches, saveSearch, deleteSearch, applySavedSearch }
}
