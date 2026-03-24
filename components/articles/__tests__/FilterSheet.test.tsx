import { render, screen } from '@testing-library/react'
import { FilterSheet } from '../FilterSheet'

// Mock Sheet components (shadcn/ui) to render children directly
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

// Mock FilterPanel to avoid its dependencies
jest.mock('../FilterPanel', () => ({
  FilterPanel: ({ categories, tags }: { categories: string[]; tags: string[]; labels?: unknown }) => (
    <div data-testid="filter-panel" data-categories={categories.join(',')} data-tags={tags.join(',')} />
  ),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('FilterSheet', () => {
  it('renders the Filters button', () => {
    render(<FilterSheet categories={[]} tags={[]} />)
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('renders the Filter Articles heading', () => {
    render(<FilterSheet categories={[]} tags={[]} />)
    expect(screen.getByText('Filter Articles')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<FilterSheet categories={[]} tags={[]} />)
    expect(screen.getByText(/Refine your search/)).toBeInTheDocument()
  })

  it('passes categories to FilterPanel', () => {
    render(<FilterSheet categories={['General', 'Tutorial']} tags={[]} />)
    const panel = screen.getByTestId('filter-panel')
    expect(panel).toHaveAttribute('data-categories', 'General,Tutorial')
  })

  it('passes tags to FilterPanel', () => {
    render(<FilterSheet categories={[]} tags={['react', 'node']} />)
    const panel = screen.getByTestId('filter-panel')
    expect(panel).toHaveAttribute('data-tags', 'react,node')
  })
})
