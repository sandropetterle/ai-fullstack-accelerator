import { render } from '@testing-library/react'
import { RecentlyViewedTracker } from '../RecentlyViewedTracker'

const mockAddRecentArticle = jest.fn()

jest.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    recentArticles: [],
    addRecentArticle: mockAddRecentArticle,
    clearRecentArticles: jest.fn(),
  }),
}))

beforeEach(() => {
  mockAddRecentArticle.mockClear()
})

describe('RecentlyViewedTracker', () => {
  it('renders nothing (null)', () => {
    const { container } = render(
      <RecentlyViewedTracker
        slug="test-article"
        title="Test Article"
        category="General"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('calls addRecentArticle on mount with correct data', () => {
    render(
      <RecentlyViewedTracker
        slug="test-article"
        title="Test Article"
        category="General"
      />
    )
    expect(mockAddRecentArticle).toHaveBeenCalledWith({
      slug: 'test-article',
      title: 'Test Article',
      category: 'General',
    })
  })

  it('calls addRecentArticle once on initial render', () => {
    render(
      <RecentlyViewedTracker
        slug="tutorial-article"
        title="Tutorial Article"
        category="Tutorial"
      />
    )
    expect(mockAddRecentArticle).toHaveBeenCalledTimes(1)
  })
})
