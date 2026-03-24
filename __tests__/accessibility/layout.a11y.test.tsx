import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ArticleCard } from '@/components/home/ArticleCard'
import type { Article } from '@/lib/types/article'

expect.extend(toHaveNoViolations)

jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  )
})

const mockArticle: Article = {
  id: 'a1',
  title: 'Clean Architecture',
  slug: 'clean-arch',
  shortDescription: 'A layered architecture approach for enterprise systems',
  category: 'Guide',
  tags: ['DDD', 'Layers'],
  createdDate: '2024-01-01T00:00:00Z',
  updatedDate: '2024-01-01T00:00:00Z',
  voteCount: 42,
  status: 'Published',
  author: 'Test Author',
}

describe('Layout & Cards — Accessibility', () => {
  it('ArticleCard has no axe violations', async () => {
    const { container } = render(<ArticleCard article={mockArticle} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ArticleCard without author has no axe violations', async () => {
    const articleNoAuthor = { ...mockArticle, author: undefined }
    const { container } = render(<ArticleCard article={articleNoAuthor} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
