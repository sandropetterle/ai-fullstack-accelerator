/**
 * ArticleCard Component Tests
 * Tests the article card display component
 */

import { render, screen } from '@testing-library/react'
import { ArticleCard } from '../ArticleCard'
import type { Article } from '@/lib/types/article'

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('ArticleCard', () => {
  const mockArticle: Article = {
    id: '1',
    title: 'Test Article',
    slug: 'test-article',
    shortDescription: 'This is a test article description',
    category: 'General',
    tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4'],
    author: 'John Doe',
    createdDate: '2024-01-15T10:00:00Z',
    updatedDate: '2024-01-15T10:00:00Z',
    voteCount: 42,
    status: 'Published',
    isFeatured: false,
    isTrending: false,
  }

  it('should render article title', () => {
    render(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })

  it('should render article category', () => {
    render(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('should render article description', () => {
    render(<ArticleCard article={mockArticle} />)

    expect(
      screen.getByText('This is a test article description')
    ).toBeInTheDocument()
  })

  it('should render vote count', () => {
    render(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render author name', () => {
    render(<ArticleCard article={mockArticle} />)

    expect(screen.getByText(/by John Doe/)).toBeInTheDocument()
  })

  it('should limit tags to max of 3', () => {
    render(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('Tag1')).toBeInTheDocument()
    expect(screen.getByText('Tag2')).toBeInTheDocument()
    expect(screen.getByText('Tag3')).toBeInTheDocument()
    expect(screen.queryByText('Tag4')).not.toBeInTheDocument()
  })

  it('should show all tags if less than max', () => {
    const articleWithFewTags = {
      ...mockArticle,
      tags: ['Tag1', 'Tag2'],
    }
    render(<ArticleCard article={articleWithFewTags} />)

    expect(screen.getByText('Tag1')).toBeInTheDocument()
    expect(screen.getByText('Tag2')).toBeInTheDocument()
  })

  it('should truncate long descriptions', () => {
    const longDescription = 'A'.repeat(150)
    const articleWithLongDesc = {
      ...mockArticle,
      shortDescription: longDescription,
    }

    render(<ArticleCard article={articleWithLongDesc} />)

    const description = screen.getByText(/\.\.\./)
    expect(description.textContent?.length).toBeLessThan(150)
  })

  it('should not truncate short descriptions', () => {
    const shortDescription = 'Short description'
    const articleWithShortDesc = {
      ...mockArticle,
      shortDescription: shortDescription,
    }

    render(<ArticleCard article={articleWithShortDesc} />)

    expect(screen.getByText(shortDescription)).toBeInTheDocument()
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument()
  })

  it('should link to article detail page', () => {
    const { container } = render(<ArticleCard article={mockArticle} />)

    const link = container.querySelector('a[href="/articles/test-article"]')
    expect(link).toBeInTheDocument()
  })

  it('should not render author if not provided', () => {
    const articleWithoutAuthor = {
      ...mockArticle,
      author: undefined,
    }

    render(<ArticleCard article={articleWithoutAuthor} />)

    expect(screen.queryByText(/by/)).not.toBeInTheDocument()
  })

  it('should handle articles with no tags', () => {
    const articleWithoutTags = {
      ...mockArticle,
      tags: [],
    }

    render(<ArticleCard article={articleWithoutTags} />)

    // Card should still render
    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })

  it('should display zero vote count', () => {
    const articleWithZeroVotes = {
      ...mockArticle,
      voteCount: 0,
    }

    render(<ArticleCard article={articleWithZeroVotes} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
