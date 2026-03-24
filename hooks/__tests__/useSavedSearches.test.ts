import { renderHook, act } from '@testing-library/react'
import { useSavedSearches } from '../useSavedSearches'

const STORAGE_KEY = 'saved-searches'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  localStorage.clear()
  mockPush.mockClear()
})

describe('useSavedSearches', () => {
  it('starts with empty list', () => {
    const { result } = renderHook(() => useSavedSearches())
    expect(result.current.savedSearches).toEqual([])
  })

  it('saves a search with name and params', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      result.current.saveSearch('My Search', { q: 'architecture', category: 'General' })
    })
    expect(result.current.savedSearches).toHaveLength(1)
    expect(result.current.savedSearches[0].name).toBe('My Search')
    expect(result.current.savedSearches[0].params.q).toBe('architecture')
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      result.current.saveSearch('Test', { q: 'tutorial' })
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Test')
  })

  it('deletes a search by id', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      result.current.saveSearch('Search A', { q: 'a' })
      result.current.saveSearch('Search B', { q: 'b' })
    })
    const idToDelete = result.current.savedSearches[0].id
    act(() => {
      result.current.deleteSearch(idToDelete)
    })
    expect(result.current.savedSearches).toHaveLength(1)
    expect(result.current.savedSearches.every((s) => s.id !== idToDelete)).toBe(true)
  })

  it('trims to max 10 saved searches', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      for (let i = 0; i < 12; i++) {
        result.current.saveSearch(`Search ${i}`, { q: `q${i}` })
      }
    })
    expect(result.current.savedSearches).toHaveLength(10)
  })

  it('applies saved search by navigating to URL', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      result.current.saveSearch('My Search', {
        q: 'tutorial',
        category: 'Tutorial',
        tags: ['React'],
        sort: 'votes',
      })
    })
    act(() => {
      result.current.applySavedSearch(result.current.savedSearches[0])
    })
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/articles?')
    )
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('q=tutorial')
    expect(url).toContain('category=Tutorial')
    expect(url).toContain('tags=React')
    expect(url).toContain('sort=votes')
  })

  it('attaches savedAt ISO timestamp', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      result.current.saveSearch('Test', { q: 'test' })
    })
    const { savedAt } = result.current.savedSearches[0]
    expect(savedAt).toBeTruthy()
    expect(() => new Date(savedAt)).not.toThrow()
  })

  it('generates unique IDs', () => {
    const { result } = renderHook(() => useSavedSearches())
    act(() => {
      result.current.saveSearch('A', { q: 'a' })
      result.current.saveSearch('B', { q: 'b' })
    })
    const ids = result.current.savedSearches.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
