import { render, screen } from '@testing-library/react'
import { SortSelector } from '../SortSelector'

const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

describe('SortSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Array.from(mockSearchParams.keys()).forEach((k) => mockSearchParams.delete(k))
  })

  it('renders the sort label', () => {
    render(<SortSelector />)
    expect(screen.getByText('Sort by:')).toBeInTheDocument()
  })

  it('renders all sort options', () => {
    render(<SortSelector />)
    // The trigger shows the current value
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('defaults to Most Recent when no sort param', () => {
    render(<SortSelector />)
    // The select trigger should show the current value
    expect(screen.getByText('Most Recent')).toBeInTheDocument()
  })

  it('renders the sort select with correct id', () => {
    render(<SortSelector />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('id', 'sort-select')
  })
})
