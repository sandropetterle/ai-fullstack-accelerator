import { render, screen } from '@testing-library/react'
import { RelatedArticlesSection } from '../RelatedArticlesSection'
import type { Article } from '@/lib/types/article'

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const makeArticle = (id: string, title: string): Article => ({
  id,
  title,
  slug: `article-${id}`,
  shortDescription: 'A description',
  category: 'General',
  tags: [],
  createdDate: '2024-01-01T00:00:00Z',
  updatedDate: '2024-01-01T00:00:00Z',
  voteCount: 10,
  status: 'Published',
})

describe('RelatedArticlesSection', () => {
  it('renders heading', () => {
    render(<RelatedArticlesSection articles={[]} />)
    expect(screen.getByText('Related Articles')).toBeInTheDocument()
  })

  it('shows empty message when no articles', () => {
    render(<RelatedArticlesSection articles={[]} />)
    expect(screen.getByText('No related articles found')).toBeInTheDocument()
  })

  it('renders each related article', () => {
    const articles = [
      makeArticle('1', 'Alpha Article'),
      makeArticle('2', 'Beta Article'),
    ]
    render(<RelatedArticlesSection articles={articles} />)
    expect(screen.getByText('Alpha Article')).toBeInTheDocument()
    expect(screen.getByText('Beta Article')).toBeInTheDocument()
  })

  it('links each article to its slug', () => {
    const articles = [makeArticle('1', 'Alpha Article')]
    render(<RelatedArticlesSection articles={articles} />)
    expect(screen.getByRole('link', { name: /Alpha Article/i })).toHaveAttribute(
      'href',
      '/articles/article-1'
    )
  })

  it('shows category badge for each article', () => {
    const articles = [makeArticle('1', 'Alpha')]
    render(<RelatedArticlesSection articles={articles} />)
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('shows vote count for each article', () => {
    const articles = [makeArticle('1', 'Alpha')]
    render(<RelatedArticlesSection articles={articles} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
