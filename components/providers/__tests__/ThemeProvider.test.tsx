import { render, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeProvider'

function TestConsumer() {
  const { theme, resolvedTheme } = useTheme()
  return <div data-testid="theme">{theme}/{resolvedTheme}</div>
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>
  )
}

describe('ThemeProvider', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    // Default: light system preference (matches: false)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia })
  })

  it('defaults to system theme with light resolved when matchMedia returns false', async () => {
    const { getByTestId } = renderWithProvider()
    await act(async () => {})
    expect(getByTestId('theme').textContent).toBe('system/light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('resolves to dark when system preference is dark', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    const { getByTestId } = renderWithProvider()
    await act(async () => {})
    expect(getByTestId('theme').textContent).toBe('system/dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('reads stored light preference from localStorage on mount', async () => {
    localStorage.setItem('theme', 'light')
    const { getByTestId } = renderWithProvider()
    await act(async () => {})
    expect(getByTestId('theme').textContent).toBe('light/light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads stored dark preference from localStorage on mount', async () => {
    localStorage.setItem('theme', 'dark')
    const { getByTestId } = renderWithProvider()
    await act(async () => {})
    expect(getByTestId('theme').textContent).toBe('dark/dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes localStorage entry when theme returns to system', async () => {
    localStorage.setItem('theme', 'light')

    function SetterConsumer() {
      const { setTheme } = useTheme()
      return <button onClick={() => setTheme('system')}>reset</button>
    }

    const { getByRole } = render(
      <ThemeProvider>
        <SetterConsumer />
      </ThemeProvider>
    )
    await act(async () => {})

    await act(async () => {
      getByRole('button', { name: 'reset' }).click()
    })

    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('persists chosen theme to localStorage', async () => {
    function SetterConsumer() {
      const { setTheme } = useTheme()
      return <button onClick={() => setTheme('dark')}>go dark</button>
    }

    const { getByRole } = render(
      <ThemeProvider>
        <SetterConsumer />
      </ThemeProvider>
    )
    await act(async () => {})

    await act(async () => {
      getByRole('button', { name: 'go dark' }).click()
    })

    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
