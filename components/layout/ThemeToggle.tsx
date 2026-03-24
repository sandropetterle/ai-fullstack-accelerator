'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  function handleClick() {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const label =
    theme === 'system'
      ? 'Switch to light mode'
      : theme === 'light'
        ? 'Switch to dark mode'
        : 'Use system theme'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={label}
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4" aria-hidden="true" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  )
}
