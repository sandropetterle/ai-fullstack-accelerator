import { render, screen, fireEvent } from '@testing-library/react'
import { SearchBar } from '../SearchBar'

const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Array.from(mockSearchParams.keys()).forEach((k) => mockSearchParams.delete(k))
  })

  it('renders the search input', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument()
  })

  it('pre-populates from search params', () => {
    mockSearchParams.set('q', 'existing query')
    render(<SearchBar />)
    expect(screen.getByDisplayValue('existing query')).toBeInTheDocument()
  })

  it('does not show clear button when input is empty', () => {
    render(<SearchBar />)
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })

  it('shows clear button when input has a value', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search articles...')
    fireEvent.change(input, { target: { value: 'react' } })
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
  })

  it('navigates on Enter key', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search articles...')
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=react'))
  })

  it('clears input and navigates on clear button click', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search articles...')
    fireEvent.change(input, { target: { value: 'react' } })
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearBtn)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/articles?'))
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })

  it('removes q param when clearing', () => {
    mockSearchParams.set('q', 'existing')
    render(<SearchBar />)
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearBtn)
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('q='))
  })

  it('removes page param on search', () => {
    mockSearchParams.set('page', '3')
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search articles...')
    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('page=')
  })

  it('does not navigate on non-Enter keydown', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search articles...')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(mockPush).not.toHaveBeenCalled()
  })
})
