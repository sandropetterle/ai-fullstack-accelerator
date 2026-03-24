import { renderHook, act } from '@testing-library/react'
import { useSearchSuggestions } from '../useSearchSuggestions'
import type { ArticleListItem } from '@/lib/types/article'

const mockArticles: ArticleListItem[] = [
  {
    id: '1', title: 'Clean Architecture Guide', slug: 'clean-arch',
    shortDescription: 'desc', category: 'Guide', tags: ['DDD', 'Layers'],
    createdDate: '', updatedDate: '', voteCount: 0, status: 'Published',
  },
  {
    id: '2', title: 'React Tutorial', slug: 'react-tutorial',
    shortDescription: 'desc', category: 'Tutorial', tags: ['React', 'Hooks'],
    createdDate: '', updatedDate: '', voteCount: 0, status: 'Published',
  },
  {
    id: '3', title: 'Security Best Practices', slug: 'security',
    shortDescription: 'desc', category: 'General', tags: ['OAuth', 'JWT'],
    createdDate: '', updatedDate: '', voteCount: 0, status: 'Published',
  },
]

const allTags = ['DDD', 'Layers', 'React', 'Hooks', 'OAuth', 'JWT', 'Testing']

jest.useFakeTimers()

describe('useSearchSuggestions', () => {
  it('returns empty array when query is too short', () => {
    const { result } = renderHook(() =>
      useSearchSuggestions('c', mockArticles, allTags)
    )
    expect(result.current.suggestions).toEqual([])
  })

  it('returns empty array for empty query', () => {
    const { result } = renderHook(() =>
      useSearchSuggestions('', mockArticles, allTags)
    )
    expect(result.current.suggestions).toEqual([])
  })

  it('filters article titles matching query after debounce', () => {
    const { result } = renderHook(() =>
      useSearchSuggestions('react', mockArticles, allTags)
    )
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current.suggestions).toContain('React Tutorial')
  })

  it('includes tag matches in suggestions', () => {
    const { result } = renderHook(() =>
      useSearchSuggestions('oau', mockArticles, allTags)
    )
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current.suggestions).toContain('OAuth')
  })

  it('deduplicates results (title matches not repeated in tags)', () => {
    // "React Tutorial" is a title; "React" is also a tag
    const { result } = renderHook(() =>
      useSearchSuggestions('React', mockArticles, allTags)
    )
    act(() => {
      jest.advanceTimersByTime(200)
    })
    const seen = new Set(result.current.suggestions)
    expect(seen.size).toBe(result.current.suggestions.length)
  })

  it('limits suggestions to 8', () => {
    const manyArticles: ArticleListItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i), title: `Article ${i} test`, slug: `article-${i}`,
      shortDescription: '', category: 'General' as const, tags: [],
      createdDate: '', updatedDate: '', voteCount: 0, status: 'Published' as const,
    }))
    const { result } = renderHook(() =>
      useSearchSuggestions('test', manyArticles, [])
    )
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current.suggestions.length).toBeLessThanOrEqual(8)
  })

  it('is not loading after debounce resolves', () => {
    const { result } = renderHook(() =>
      useSearchSuggestions('clean', mockArticles, allTags)
    )
    // Initially loading
    expect(result.current.isLoading).toBe(true)
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('prioritises title matches over tag matches', () => {
    // "React Tutorial" is a title match; "React" is a tag match
    const { result } = renderHook(() =>
      useSearchSuggestions('react', mockArticles, allTags)
    )
    act(() => {
      jest.advanceTimersByTime(200)
    })
    const idx = result.current.suggestions.indexOf('React Tutorial')
    const tagIdx = result.current.suggestions.indexOf('React')
    if (idx >= 0 && tagIdx >= 0) {
      expect(idx).toBeLessThan(tagIdx)
    }
  })
})
