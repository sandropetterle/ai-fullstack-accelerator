import { render, screen } from '@testing-library/react'
import { ArticlesGrid } from '../ArticlesGrid'
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
  shortDescription: 'Description',
  category: 'General',
  tags: ['tag1'],
  createdDate: '2024-01-01T00:00:00Z',
  updatedDate: '2024-01-01T00:00:00Z',
  voteCount: 5,
  status: 'Published',
})

describe('ArticlesGrid', () => {
  it('renders a card for each article', () => {
    const articles = [
      makeArticle('1', 'Alpha Article'),
      makeArticle('2', 'Beta Article'),
      makeArticle('3', 'Gamma Article'),
    ]

    render(<ArticlesGrid articles={articles} />)

    expect(screen.getByText('Alpha Article')).toBeInTheDocument()
    expect(screen.getByText('Beta Article')).toBeInTheDocument()
    expect(screen.getByText('Gamma Article')).toBeInTheDocument()
  })

  it('renders empty grid when articles is empty', () => {
    const { container } = render(<ArticlesGrid articles={[]} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.children).toHaveLength(0)
  })

  it('renders single article', () => {
    render(<ArticlesGrid articles={[makeArticle('1', 'Solo Article')]} />)
    expect(screen.getByText('Solo Article')).toBeInTheDocument()
  })
})
