import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SavedSearches } from '../SavedSearches'
import type { SavedSearch } from '@/hooks/useSavedSearches'

const mockSaveSearch = jest.fn()
const mockDeleteSearch = jest.fn()
const mockApplySavedSearch = jest.fn()
let mockSavedSearches: SavedSearch[] = []
let mockSearchParams = new URLSearchParams()

jest.mock('@/hooks/useSavedSearches', () => ({
  useSavedSearches: () => ({
    savedSearches: mockSavedSearches,
    saveSearch: mockSaveSearch,
    deleteSearch: mockDeleteSearch,
    applySavedSearch: mockApplySavedSearch,
  }),
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

// Mock Dialog component inline to avoid Radix portal issues
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog">{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

beforeEach(() => {
  mockSaveSearch.mockClear()
  mockDeleteSearch.mockClear()
  mockApplySavedSearch.mockClear()
  mockSavedSearches = []
  mockSearchParams = new URLSearchParams()
})

describe('SavedSearches', () => {
  it('renders nothing when no filters active and no saved searches', () => {
    const { container } = render(<SavedSearches />)
    expect(container.firstChild).toBeNull()
  })

  it('shows Save current button when active filters are present', () => {
    mockSearchParams = new URLSearchParams('q=tutorial')
    render(<SavedSearches />)
    expect(screen.getByText(/save current/i)).toBeInTheDocument()
  })

  it('renders list of saved searches', () => {
    mockSavedSearches = [
      {
        id: '1', name: 'Tutorial Guides', savedAt: new Date().toISOString(),
        params: { q: 'tutorial' },
      },
      {
        id: '2', name: 'News', savedAt: new Date().toISOString(),
        params: { category: 'News' },
      },
    ]
    render(<SavedSearches />)
    expect(screen.getByText('Tutorial Guides')).toBeInTheDocument()
    expect(screen.getByText('News')).toBeInTheDocument()
  })

  it('calls applySavedSearch when a saved search is clicked', () => {
    mockSavedSearches = [
      {
        id: '1', name: 'Tutorial Guides', savedAt: new Date().toISOString(),
        params: { q: 'tutorial' },
      },
    ]
    render(<SavedSearches />)
    fireEvent.click(screen.getByText('Tutorial Guides'))
    expect(mockApplySavedSearch).toHaveBeenCalledWith(mockSavedSearches[0])
  })

  it('calls deleteSearch when delete button is clicked', () => {
    mockSavedSearches = [
      {
        id: 'abc', name: 'My Search', savedAt: new Date().toISOString(),
        params: { q: 'test' },
      },
    ]
    render(<SavedSearches />)
    fireEvent.click(screen.getByRole('button', { name: /delete saved search: my search/i }))
    expect(mockDeleteSearch).toHaveBeenCalledWith('abc')
  })

  it('calls saveSearch when dialog is submitted', async () => {
    mockSearchParams = new URLSearchParams('q=tutorial')
    render(<SavedSearches />)

    // Open dialog
    fireEvent.click(screen.getByText(/save current/i))

    // Type name and submit
    const input = screen.getByLabelText(/search name/i)
    fireEvent.change(input, { target: { value: 'My Tutorial Search' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(mockSaveSearch).toHaveBeenCalledWith(
        'My Tutorial Search',
        expect.objectContaining({ q: 'tutorial' })
      )
    })
  })
})
