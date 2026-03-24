import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '../Breadcrumb'

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('Breadcrumb', () => {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: 'Getting Started', href: '/articles/getting-started' },
  ]

  it('renders navigation landmark', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
  })

  it('renders all items', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Articles')).toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('renders non-last items as links', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/articles')
  })

  it('renders last item as plain text, not a link', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.queryByRole('link', { name: 'Getting Started' })).not.toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('renders single item as plain text', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }]} />)
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders empty list without crashing', () => {
    const { container } = render(<Breadcrumb items={[]} />)
    expect(container.querySelector('ol')).toBeInTheDocument()
  })
})
