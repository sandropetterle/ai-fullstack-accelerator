import { renderHook, act } from '@testing-library/react'
import { useRecentlyViewed } from '../useRecentlyViewed'

const STORAGE_KEY = 'recently-viewed-articles'

const article1 = { slug: 'article-1', title: 'Article One', category: 'General' as const }
const article2 = { slug: 'article-2', title: 'Article Two', category: 'Tutorial' as const }
const article3 = { slug: 'article-3', title: 'Article Three', category: 'Guide' as const }
const article4 = { slug: 'article-4', title: 'Article Four', category: 'Reference' as const }
const article5 = { slug: 'article-5', title: 'Article Five', category: 'News' as const }
const article6 = { slug: 'article-6', title: 'Article Six', category: 'General' as const }

beforeEach(() => {
  localStorage.clear()
})

describe('useRecentlyViewed', () => {
  it('starts with empty list', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.recentArticles).toEqual([])
  })

  it('adds an article to the list', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
    })
    expect(result.current.recentArticles).toHaveLength(1)
    expect(result.current.recentArticles[0].slug).toBe('article-1')
  })

  it('prepends new articles (most recent first)', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
      result.current.addRecentArticle(article2)
    })
    expect(result.current.recentArticles[0].slug).toBe('article-2')
    expect(result.current.recentArticles[1].slug).toBe('article-1')
  })

  it('deduplicates by slug (moves to front)', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
      result.current.addRecentArticle(article2)
      result.current.addRecentArticle(article1) // revisit article1
    })
    expect(result.current.recentArticles[0].slug).toBe('article-1')
    expect(result.current.recentArticles).toHaveLength(2)
  })

  it('trims to max 5 entries', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
      result.current.addRecentArticle(article2)
      result.current.addRecentArticle(article3)
      result.current.addRecentArticle(article4)
      result.current.addRecentArticle(article5)
      result.current.addRecentArticle(article6) // 6th — should drop oldest
    })
    expect(result.current.recentArticles).toHaveLength(5)
    expect(result.current.recentArticles[0].slug).toBe('article-6')
    // article-1 was the oldest and should be dropped
    expect(result.current.recentArticles.map((a) => a.slug)).not.toContain('article-1')
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].slug).toBe('article-1')
  })

  it('clears all articles', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
      result.current.addRecentArticle(article2)
    })
    act(() => {
      result.current.clearRecentArticles()
    })
    expect(result.current.recentArticles).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('attaches visitedAt ISO timestamp', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addRecentArticle(article1)
    })
    const { visitedAt } = result.current.recentArticles[0]
    expect(visitedAt).toBeTruthy()
    expect(() => new Date(visitedAt)).not.toThrow()
  })
})
