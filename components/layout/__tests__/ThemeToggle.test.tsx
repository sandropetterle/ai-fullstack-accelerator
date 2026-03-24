import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('renders with system label when no preference is stored', async () => {
    render(<ThemeToggle />, { wrapper: Wrapper })
    await act(async () => {})
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
  })

  it('cycles system → light on first click', async () => {
    render(<ThemeToggle />, { wrapper: Wrapper })
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }))
    })

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('cycles light → dark on second click', async () => {
    render(<ThemeToggle />, { wrapper: Wrapper })
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }))
    })

    expect(screen.getByRole('button', { name: /use system theme/i })).toBeInTheDocument()
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('cycles dark → system on third click and removes localStorage entry', async () => {
    render(<ThemeToggle />, { wrapper: Wrapper })
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /use system theme/i }))
    })

    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('starts in dark mode when localStorage has dark preference', async () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />, { wrapper: Wrapper })
    await act(async () => {})

    // Dark mode: button label is "Use system theme"
    expect(screen.getByRole('button', { name: /use system theme/i })).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
