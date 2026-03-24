/**
 * Pagination Component Tests
 * Tests the pagination navigation component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

// Mock Next.js navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

describe('Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key))
  })

  it('should not render if totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        hasNextPage={false}
        hasPreviousPage={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render pagination nav with correct aria-label', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    expect(screen.getByLabelText('Pagination')).toBeInTheDocument()
  })

  it('should render Previous button', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    expect(screen.getByText('Previous')).toBeInTheDocument()
  })

  it('should render Next button', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('should disable Previous button when hasPreviousPage is false', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={false}
      />
    )

    const previousButton = screen.getByText('Previous').closest('button')
    expect(previousButton).toBeDisabled()
  })

  it('should disable Next button when hasNextPage is false', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        hasNextPage={false}
        hasPreviousPage={true}
      />
    )

    const nextButton = screen.getByText('Next').closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('should navigate to previous page when Previous is clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('page=2')
    )
  })

  it('should navigate to next page when Next is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('page=3')
    )
  })

  it('should show all page numbers when totalPages <= 5', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should show ellipsis for large page counts', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBeGreaterThan(0)
  })

  it('should highlight current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const page3Button = screen.getByRole('button', { name: '3' })
    expect(page3Button).toHaveAttribute('aria-current', 'page')
  })

  it('should navigate to clicked page number', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const page4Button = screen.getByText('4')
    fireEvent.click(page4Button)

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('page=4')
    )
  })

  it('should remove page param when navigating to page 1', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const page1Button = screen.getByText('1')
    fireEvent.click(page1Button)

    expect(mockPush).toHaveBeenCalledWith(
      expect.not.stringContaining('page=')
    )
  })

  it('should preserve existing search params when navigating', () => {
    mockSearchParams.set('search', 'test')
    mockSearchParams.set('category', 'General')

    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/search=test/)
    )
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/category=General/)
    )
  })

  it('should show first and last page when totalPages > 5', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        hasNextPage={true}
        hasPreviousPage={true}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
