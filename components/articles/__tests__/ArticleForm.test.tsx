import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { ArticleForm } from '../ArticleForm'

const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/lib/api/articles', () => ({
  createArticle: jest.fn(),
  updateArticle: jest.fn(),
}))

// Mock Radix UI Select — use a context-based approach so SelectTrigger
// can render a native <select> with id + value bound to the parent Select.
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

    SelectTrigger: ({ id, children }: { id?: string; children: React.ReactNode }) => {
      const ctx = React.useContext(Ctx)
      return (
        <select
          id={id}
          value={ctx.value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            ctx.onValueChange(e.target.value)
          }
          data-testid="category-select"
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

import { createArticle, updateArticle } from '@/lib/api/articles'
import { toast } from 'sonner'

const mockCreateArticle = createArticle as jest.MockedFunction<typeof createArticle>
const mockUpdateArticle = updateArticle as jest.MockedFunction<typeof updateArticle>

const editorSession = {
  data: {
    accessToken: 'test-token',
    user: { roles: ['Editor'], name: 'Test User', email: 'test@test.com' },
    expires: '2099-01-01',
  },
  status: 'authenticated' as const,
}

const adminSession = {
  data: {
    accessToken: 'admin-token',
    user: { roles: ['Admin'], name: 'Admin User', email: 'admin@test.com' },
    expires: '2099-01-01',
  },
  status: 'authenticated' as const,
}

const mockArticle = {
  id: 'article-id-1',
  title: 'React Tutorial',
  slug: 'react-tutorial',
  shortDescription: 'A guide to getting started with React',
  fullContent: '# React\n\nContent here',
  category: 'Tutorial' as const,
  tags: ['react', 'hooks'],
  author: 'Jane Doe',
  createdDate: '2024-01-01T00:00:00Z',
  updatedDate: '2024-01-01T00:00:00Z',
  voteCount: 5,
  status: 'Published' as const,
  isFeatured: false,
  isTrending: false,
}

describe('ArticleForm — create mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(editorSession)
  })

  it('renders the form with create heading', () => {
    render(<ArticleForm mode="create" />)
    expect(screen.getByText('New Article')).toBeInTheDocument()
  })

  it('renders all required form fields', () => {
    render(<ArticleForm mode="create" />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/short description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full content/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument()
  })

  it('renders Create Article submit button', () => {
    render(<ArticleForm mode="create" />)
    expect(screen.getByRole('button', { name: /create article/i })).toBeInTheDocument()
  })

  it('renders Cancel button', () => {
    render(<ArticleForm mode="create" />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('shows slug preview when title is typed', async () => {
    render(<ArticleForm mode="create" />)
    await userEvent.type(screen.getByLabelText(/title \*/i), 'My New Article')
    expect(screen.getByText(/slug preview: my-new-article/i)).toBeInTheDocument()
  })

  it('shows title validation error when submitting empty title', async () => {
    render(<ArticleForm mode="create" />)
    fireEvent.click(screen.getByRole('button', { name: /create article/i }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
  })

  it('shows short description validation error when empty', async () => {
    render(<ArticleForm mode="create" />)
    await userEvent.type(screen.getByLabelText(/title \*/i), 'Some Title')
    fireEvent.click(screen.getByRole('button', { name: /create article/i }))
    expect(await screen.findByText('Short description is required')).toBeInTheDocument()
  })

  it('shows title error on blur when empty', async () => {
    render(<ArticleForm mode="create" />)
    const titleInput = screen.getByLabelText(/title \*/i)
    fireEvent.focus(titleInput)
    fireEvent.blur(titleInput)
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
  })

  it('shows short description error on blur when empty', async () => {
    render(<ArticleForm mode="create" />)
    const descInput = screen.getByLabelText(/short description \*/i)
    fireEvent.focus(descInput)
    fireEvent.blur(descInput)
    expect(await screen.findByText('Short description is required')).toBeInTheDocument()
  })

  it('can add a tag via Enter key', async () => {
    render(<ArticleForm mode="create" />)
    const tagInput = screen.getByPlaceholderText(/add a tag and press enter/i)
    await userEvent.type(tagInput, 'my-tag{Enter}')
    expect(screen.getByText('my-tag')).toBeInTheDocument()
  })

  it('can add a tag via Add button', async () => {
    render(<ArticleForm mode="create" />)
    const tagInput = screen.getByPlaceholderText(/add a tag and press enter/i)
    await userEvent.type(tagInput, 'cool-tag')
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.getByText('cool-tag')).toBeInTheDocument()
  })

  it('can remove a tag', async () => {
    render(<ArticleForm mode="create" />)
    const tagInput = screen.getByPlaceholderText(/add a tag and press enter/i)
    await userEvent.type(tagInput, 'removable{Enter}')
    expect(screen.getByText('removable')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /remove tag removable/i }))
    expect(screen.queryByText('removable')).not.toBeInTheDocument()
  })

  it('does not add duplicate tags', async () => {
    render(<ArticleForm mode="create" />)
    const tagInput = screen.getByPlaceholderText(/add a tag and press enter/i)
    await userEvent.type(tagInput, 'duplicate{Enter}')
    await userEvent.type(tagInput, 'duplicate{Enter}')
    expect(screen.getAllByText('duplicate')).toHaveLength(1)
  })

  it('shows error when tag limit is exceeded', async () => {
    render(<ArticleForm mode="create" />)
    const tagInput = screen.getByPlaceholderText(/add a tag and press enter/i)
    for (let i = 1; i <= 10; i++) {
      await userEvent.type(tagInput, `tag${i}{Enter}`)
    }
    await userEvent.type(tagInput, 'one-too-many{Enter}')
    expect(await screen.findByText(/maximum 10 tags allowed/i)).toBeInTheDocument()
  }, 15000)

  it('calls createArticle with correct data on valid submit', async () => {
    const createdArticle = { ...mockArticle, id: 'new-id', slug: 'test-title' }
    mockCreateArticle.mockResolvedValueOnce(createdArticle)

    render(<ArticleForm mode="create" />)
    await userEvent.type(screen.getByLabelText(/title \*/i), 'Test Title')
    await userEvent.type(
      screen.getByLabelText(/short description \*/i),
      'A test description'
    )
    fireEvent.click(screen.getByRole('button', { name: /create article/i }))

    await waitFor(() => {
      expect(mockCreateArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          shortDescription: 'A test description',
          category: 'General',
          tags: [],
        }),
        'test-token'
      )
    })
    // Higher timeout: this test simulates per-keystroke typing of multiple
    // fields, which can exceed the default 5s under parallel CI load.
  }, 15000)

  it('shows success toast and redirects after create', async () => {
    const createdArticle = { ...mockArticle, slug: 'test-title' }
    mockCreateArticle.mockResolvedValueOnce(createdArticle)

    render(<ArticleForm mode="create" />)
    await userEvent.type(screen.getByLabelText(/title \*/i), 'Test Title')
    await userEvent.type(
      screen.getByLabelText(/short description \*/i),
      'A test description'
    )
    fireEvent.click(screen.getByRole('button', { name: /create article/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Article created successfully')
      expect(mockPush).toHaveBeenCalledWith('/articles/test-title')
    })
  }, 15000)

  it('shows error toast when createArticle fails', async () => {
    mockCreateArticle.mockRejectedValueOnce(new Error('Server error'))

    render(<ArticleForm mode="create" />)
    await userEvent.type(screen.getByLabelText(/title \*/i), 'Test Title')
    await userEvent.type(
      screen.getByLabelText(/short description \*/i),
      'A test description'
    )
    fireEvent.click(screen.getByRole('button', { name: /create article/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error')
    })
  }, 15000)

  it('calls router.back when Cancel is clicked', () => {
    render(<ArticleForm mode="create" />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockBack).toHaveBeenCalled()
  })

  it('does not show admin settings in create mode', () => {
    ;(useSession as jest.Mock).mockReturnValue(adminSession)
    render(<ArticleForm mode="create" />)
    expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument()
  })
})

describe('ArticleForm — edit mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(editorSession)
  })

  it('renders the form with edit heading', () => {
    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    expect(screen.getByText('Edit Article')).toBeInTheDocument()
  })

  it('renders Save Changes submit button', () => {
    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('pre-fills form fields with initialData', () => {
    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    expect(screen.getByLabelText(/title \*/i)).toHaveValue('React Tutorial')
    expect(screen.getByLabelText(/short description \*/i)).toHaveValue(
      'A guide to getting started with React'
    )
    expect(screen.getByLabelText(/author/i)).toHaveValue('Jane Doe')
  })

  it('pre-fills existing tags', () => {
    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('hooks')).toBeInTheDocument()
  })

  it('calls updateArticle with correct data on valid submit', async () => {
    const updatedArticle = { ...mockArticle, title: 'React Tutorial Updated' }
    mockUpdateArticle.mockResolvedValueOnce(updatedArticle)

    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockUpdateArticle).toHaveBeenCalledWith(
        'article-id-1',
        expect.objectContaining({
          title: 'React Tutorial',
          shortDescription: 'A guide to getting started with React',
        }),
        'test-token'
      )
    })
  })

  it('shows success toast and redirects after update', async () => {
    const updatedArticle = { ...mockArticle, slug: 'react-tutorial' }
    mockUpdateArticle.mockResolvedValueOnce(updatedArticle)

    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Article updated successfully')
      expect(mockPush).toHaveBeenCalledWith('/articles/react-tutorial')
    })
  })

  it('shows admin settings for admin users in edit mode', () => {
    ;(useSession as jest.Mock).mockReturnValue(adminSession)
    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    expect(screen.getByText('Admin Settings')).toBeInTheDocument()
    expect(screen.getByLabelText(/featured article/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/trending article/i)).toBeInTheDocument()
  })

  it('does not show admin settings for non-admin editors', () => {
    render(<ArticleForm mode="edit" initialData={mockArticle} />)
    expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument()
  })

  it('reflects isFeatured initial state in checkbox', () => {
    ;(useSession as jest.Mock).mockReturnValue(adminSession)
    render(
      <ArticleForm
        mode="edit"
        initialData={{ ...mockArticle, isFeatured: true }}
      />
    )
    const featuredCheckbox = screen.getByLabelText(/featured article/i)
    expect(featuredCheckbox).toBeChecked()
  })
})
