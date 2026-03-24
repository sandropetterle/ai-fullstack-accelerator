import { render, screen, fireEvent } from '@testing-library/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { UserMenu } from '../UserMenu'

// useSession, signIn, signOut are mocked globally in jest.setup.ts

// Mock Radix UI DropdownMenu so content renders inline (no portal) in jsdom
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <div role="menuitem" onClick={onClick} className={className}>
      {children}
    </div>
  ),
}))

describe('UserMenu', () => {
  it('renders a loading skeleton while session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })

    const { container } = render(<UserMenu />)

    // Skeleton has aria-hidden="true"
    const skeleton = container.querySelector('[aria-hidden="true"]')
    expect(skeleton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
  })

  it('renders a Sign In button when unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<UserMenu />)

    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeInTheDocument()
  })

  it('calls signIn when the Sign In button is clicked', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<UserMenu />)

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(signIn).toHaveBeenCalledWith('entra-external-id')
  })

  it('renders user menu trigger with name when authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Alice', email: 'alice@example.com', roles: ['Editor'] },
        accessToken: 'tok',
      },
      status: 'authenticated',
    })

    render(<UserMenu />)

    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
    // Name appears in both the trigger and the dropdown label (inline mock)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('shows role badge in dropdown', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Bob', email: 'bob@example.com', roles: ['Admin'] },
        accessToken: 'tok',
      },
      status: 'authenticated',
    })

    render(<UserMenu />)

    // With the mocked dropdown, content is always rendered inline
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('calls signOut when Sign Out is clicked', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Carol', email: 'carol@example.com', roles: ['Viewer'] },
        accessToken: 'tok',
      },
      status: 'authenticated',
    })

    render(<UserMenu />)

    fireEvent.click(screen.getByText(/sign out/i))
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })
})
