import { render, screen } from '@testing-library/react'
import { EmptyState } from '../EmptyState'

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('EmptyState', () => {
  describe('when hasFilters is false', () => {
    it('renders no articles available heading', () => {
      render(<EmptyState hasFilters={false} />)
      expect(screen.getByText('No articles available')).toBeInTheDocument()
    })

    it('renders check back soon message', () => {
      render(<EmptyState hasFilters={false} />)
      expect(
        screen.getByText(/There are no articles in the library yet/)
      ).toBeInTheDocument()
    })

    it('does not render clear filters button', () => {
      render(<EmptyState hasFilters={false} />)
      expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument()
    })
  })

  describe('when hasFilters is true', () => {
    it('renders no articles found heading', () => {
      render(<EmptyState hasFilters={true} />)
      expect(screen.getByText('No articles found')).toBeInTheDocument()
    })

    it('renders adjust filters message', () => {
      render(<EmptyState hasFilters={true} />)
      expect(
        screen.getByText(/Try adjusting your filters/)
      ).toBeInTheDocument()
    })

    it('renders clear all filters button linking to /articles', () => {
      render(<EmptyState hasFilters={true} />)
      const link = screen.getByRole('link', { name: 'Clear all filters' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/articles')
    })
  })
})
