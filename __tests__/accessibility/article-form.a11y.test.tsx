import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useSession } from 'next-auth/react'
import { ArticleForm } from '@/components/articles/ArticleForm'

expect.extend(toHaveNoViolations)

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/lib/api/articles', () => ({
  createArticle: jest.fn(),
  updateArticle: jest.fn(),
}))

// Mock Radix UI Select to render a native <select>
jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Ctx = React.createContext({ value: '' as string, onValueChange: (() => {}) as (v: string) => void })

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string
      onValueChange: (v: string) => void
      children: React.ReactNode
    }) => <Ctx.Provider value={{ value, onValueChange }}>{children}</Ctx.Provider>,
    SelectTrigger: ({
      id,
      children,
    }: {
      id?: string
      children: React.ReactNode
    }) => {
      const { value, onValueChange } = React.useContext(Ctx)
      return (
        <select
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
        >
          {children}
        </select>
      )
    },
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
      <option value={value}>{children}</option>
    ),
  }
})

const editorSession = {
  data: {
    accessToken: 'test-token',
    user: { roles: ['Editor'], name: 'Test User', email: 'test@test.com' },
    expires: '2099-01-01',
  },
  status: 'authenticated' as const,
}

describe('ArticleForm — Accessibility', () => {
  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue(editorSession)
  })

  it('create mode has no axe violations', async () => {
    const { container } = render(<ArticleForm mode="create" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
