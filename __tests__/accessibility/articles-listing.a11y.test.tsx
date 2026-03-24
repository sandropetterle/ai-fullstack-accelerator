import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { FilterPanel } from '@/components/articles/FilterPanel'
import { EmptyState } from '@/components/articles/EmptyState'
import { Pagination } from '@/components/articles/Pagination'

expect.extend(toHaveNoViolations)

let mockSearchParams = new URLSearchParams()
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

// Mock hooks that use localStorage
jest.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    recentArticles: [],
    addRecentArticle: jest.fn(),
    clearRecentArticles: jest.fn(),
  }),
}))

jest.mock('@/hooks/useSavedSearches', () => ({
  useSavedSearches: () => ({
    savedSearches: [],
    saveSearch: jest.fn(),
    deleteSearch: jest.fn(),
    applySavedSearch: jest.fn(),
  }),
}))

describe('Articles Listing — Accessibility', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
    mockPush.mockClear()
  })

  it('FilterPanel has no axe violations', async () => {
    const { container } = render(
      <FilterPanel categories={['General', 'Tutorial']} tags={['React', 'DDD']} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('EmptyState (no filters) has no axe violations', async () => {
    const { container } = render(<EmptyState hasFilters={false} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('EmptyState (with filters) has no axe violations', async () => {
    const { container } = render(<EmptyState hasFilters={true} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Pagination has no axe violations', async () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
