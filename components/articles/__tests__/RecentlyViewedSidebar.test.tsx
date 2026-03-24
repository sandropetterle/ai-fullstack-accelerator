import { render, screen, fireEvent } from '@testing-library/react'
import { RecentlyViewedSidebar } from '../RecentlyViewedSidebar'
import type { RecentArticle } from '@/hooks/useRecentlyViewed'

const mockClearRecentArticles = jest.fn()
let mockRecentArticles: RecentArticle[] = []

jest.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    recentArticles: mockRecentArticles,
    addRecentArticle: jest.fn(),
    clearRecentArticles: mockClearRecentArticles,
  }),
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

beforeEach(() => {
  mockClearRecentArticles.mockClear()
  mockRecentArticles = []
})

describe('RecentlyViewedSidebar', () => {
  it('renders nothing when list is empty', () => {
    const { container } = render(<RecentlyViewedSidebar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders articles when list is not empty', () => {
    mockRecentArticles = [
      { slug: 'getting-started', title: 'Getting Started', category: 'General', visitedAt: new Date().toISOString() },
    ]
    render(<RecentlyViewedSidebar />)
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('renders links to article pages', () => {
    mockRecentArticles = [
      { slug: 'my-article', title: 'My Article', category: 'Tutorial', visitedAt: new Date().toISOString() },
    ]
    render(<RecentlyViewedSidebar />)
    const link = screen.getByRole('link', { name: /my article/i })
    expect(link).toHaveAttribute('href', '/articles/my-article')
  })

  it('shows category badge for each article', () => {
    mockRecentArticles = [
      { slug: 'guide-article', title: 'Guide Article', category: 'Guide', visitedAt: new Date().toISOString() },
    ]
    render(<RecentlyViewedSidebar />)
    expect(screen.getByText('Guide')).toBeInTheDocument()
  })

  it('renders clear button', () => {
    mockRecentArticles = [
      { slug: 'a1', title: 'A1', category: 'News', visitedAt: new Date().toISOString() },
    ]
    render(<RecentlyViewedSidebar />)
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('calls clearRecentArticles when clear button is clicked', () => {
    mockRecentArticles = [
      { slug: 'a1', title: 'A1', category: 'News', visitedAt: new Date().toISOString() },
    ]
    render(<RecentlyViewedSidebar />)
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(mockClearRecentArticles).toHaveBeenCalledTimes(1)
  })

  it('renders up to 5 articles', () => {
    mockRecentArticles = Array.from({ length: 5 }, (_, i) => ({
      slug: `a${i}`,
      title: `Article ${i}`,
      category: 'General' as const,
      visitedAt: new Date().toISOString(),
    }))
    render(<RecentlyViewedSidebar />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })
})
