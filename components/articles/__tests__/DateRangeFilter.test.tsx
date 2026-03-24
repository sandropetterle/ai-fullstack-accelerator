import { render, screen, fireEvent } from '@testing-library/react'
import { DateRangeFilter } from '../DateRangeFilter'

const mockPush = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

beforeEach(() => {
  mockPush.mockClear()
  mockSearchParams = new URLSearchParams()
})

describe('DateRangeFilter', () => {
  it('renders From and To date inputs', () => {
    render(<DateRangeFilter />)
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument()
  })

  it('shows current dateFrom value in From input', () => {
    render(<DateRangeFilter dateFrom="2024-01-01" />)
    const input = screen.getByLabelText(/from/i) as HTMLInputElement
    expect(input.value).toBe('2024-01-01')
  })

  it('shows current dateTo value in To input', () => {
    render(<DateRangeFilter dateTo="2024-12-31" />)
    const input = screen.getByLabelText(/to/i) as HTMLInputElement
    expect(input.value).toBe('2024-12-31')
  })

  it('does not show clear button when no dates are set', () => {
    render(<DateRangeFilter />)
    expect(screen.queryByText(/clear dates/i)).not.toBeInTheDocument()
  })

  it('shows clear button when dateFrom is set', () => {
    render(<DateRangeFilter dateFrom="2024-01-01" />)
    expect(screen.getByText(/clear dates/i)).toBeInTheDocument()
  })

  it('shows clear button when dateTo is set', () => {
    render(<DateRangeFilter dateTo="2024-12-31" />)
    expect(screen.getByText(/clear dates/i)).toBeInTheDocument()
  })

  it('calls router.push with dateFrom param when From input changes', () => {
    render(<DateRangeFilter />)
    fireEvent.change(screen.getByLabelText(/from/i), {
      target: { value: '2024-06-01' },
    })
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('dateFrom=2024-06-01')
    )
  })

  it('calls router.push with dateTo param when To input changes', () => {
    render(<DateRangeFilter />)
    fireEvent.change(screen.getByLabelText(/to/i), {
      target: { value: '2024-06-30' },
    })
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('dateTo=2024-06-30')
    )
  })

  it('clears both dates when clear button is clicked', () => {
    mockSearchParams = new URLSearchParams('dateFrom=2024-01-01&dateTo=2024-12-31')
    render(<DateRangeFilter dateFrom="2024-01-01" dateTo="2024-12-31" />)
    fireEvent.click(screen.getByText(/clear dates/i))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('dateFrom')
    expect(url).not.toContain('dateTo')
  })

  it('resets page param on date change', () => {
    mockSearchParams = new URLSearchParams('page=3')
    render(<DateRangeFilter />)
    fireEvent.change(screen.getByLabelText(/from/i), {
      target: { value: '2024-01-01' },
    })
    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('page=')
  })
})
