import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { NewArticleButton } from '../NewArticleButton'

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('NewArticleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a link to /articles/new for editors', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        accessToken: 'token',
        user: { roles: ['Editor'], name: 'Test', email: 'test@test.com' },
        expires: '2099-01-01',
      },
      status: 'authenticated',
    })
    render(<NewArticleButton />)
    const link = screen.getByRole('link', { name: /new article/i })
    expect(link).toHaveAttribute('href', '/articles/new')
  })

  it('renders for admin users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        accessToken: 'token',
        user: { roles: ['Admin'], name: 'Admin', email: 'admin@test.com' },
        expires: '2099-01-01',
      },
      status: 'authenticated',
    })
    render(<NewArticleButton />)
    expect(screen.getByRole('link', { name: /new article/i })).toBeInTheDocument()
  })

  it('renders nothing when unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })
    const { container } = render(<NewArticleButton />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when user has no roles', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { roles: [], name: 'Test', email: 'test@test.com' },
        expires: '2099-01-01',
      },
      status: 'authenticated',
    })
    const { container } = render(<NewArticleButton />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing while session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })
    const { container } = render(<NewArticleButton />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for viewer-only users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { roles: ['Viewer'], name: 'Viewer', email: 'viewer@test.com' },
        expires: '2099-01-01',
      },
      status: 'authenticated',
    })
    const { container } = render(<NewArticleButton />)
    expect(container.firstChild).toBeNull()
  })
})
