import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ArticleActions } from '../ArticleActions'
import { useSession } from 'next-auth/react'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}))

jest.mock('@/lib/api/articles', () => ({
  deleteArticle: jest.fn(),
}))

// Mock AlertDialog inline to avoid Radix portal issues in jsdom
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({
    children,
    disabled,
    onClick,
  }: {
    children: React.ReactNode
    disabled?: boolean
    onClick?: () => void
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  AlertDialogAction: ({
    children,
    disabled,
    onClick,
    className,
  }: {
    children: React.ReactNode
    disabled?: boolean
    onClick?: () => void
    className?: string
  }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

import { deleteArticle } from '@/lib/api/articles'
import { toast } from 'sonner'

const mockDeleteArticle = deleteArticle as jest.MockedFunction<typeof deleteArticle>

const editorSession = {
  data: {
    accessToken: 'test-token',
    user: { roles: ['Editor'], name: 'Test User', email: 'test@test.com' },
    expires: '2099-01-01',
  },
  status: 'authenticated' as const,
}

describe('ArticleActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(editorSession)
  })

  it('renders Edit button linking to edit page', () => {
    render(<ArticleActions slug="test-article" articleId="article-id-1" />)
    const editLink = screen.getByRole('link', { name: /edit/i })
    expect(editLink).toHaveAttribute('href', '/articles/test-article/edit')
  })

  it('renders Delete button', () => {
    render(<ArticleActions slug="test-article" articleId="article-id-1" />)
    // Multiple Delete buttons: trigger + dialog action — check at least one exists
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0)
  })

  it('shows confirmation dialog content (AlertDialog always rendered)', () => {
    render(<ArticleActions slug="test-article" articleId="article-id-1" />)
    // AlertDialog is mocked to always render content
    expect(screen.getByText('Delete Article?')).toBeInTheDocument()
  })

  it('renders Cancel button in dialog', () => {
    render(<ArticleActions slug="test-article" articleId="article-id-1" />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls deleteArticle with articleId and token, then redirects', async () => {
    mockDeleteArticle.mockResolvedValueOnce(undefined)
    render(<ArticleActions slug="my-article" articleId="article-abc-123" />)
    // The dialog action button is inside the alert-dialog-content
    const dialogContent = screen.getByTestId('alert-dialog-content')
    const confirmBtn = dialogContent.querySelector('button:last-child') as HTMLElement
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteArticle).toHaveBeenCalledWith('article-abc-123', 'test-token')
    })
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/articles')
    })
  })

  it('shows error toast when delete fails', async () => {
    mockDeleteArticle.mockRejectedValueOnce(new Error('Network error'))
    const { toast } = await import('sonner')

    render(<ArticleActions slug="my-article" articleId="article-abc-123" />)
    const dialogContent = screen.getByTestId('alert-dialog-content')
    const confirmBtn = dialogContent.querySelector('button:last-child') as HTMLElement
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to delete article. Please try again.'
      )
    })
  })

  it('returns null when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })
    const { container } = render(
      <ArticleActions slug="test-article" articleId="article-id-1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when user is not an editor', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: { roles: [], name: 'Test', email: 'test@test.com' },
        accessToken: null,
        expires: '2099-01-01',
      },
      status: 'authenticated',
    })
    const { container } = render(
      <ArticleActions slug="test-article" articleId="article-id-1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })
    const { container } = render(
      <ArticleActions slug="test-article" articleId="article-id-1" />
    )
    expect(container.firstChild).toBeNull()
  })
})
