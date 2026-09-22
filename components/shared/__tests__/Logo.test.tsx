import { render, screen } from '@testing-library/react'
import { Logo } from '../Logo'

jest.mock('next/link', () => {
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
  return MockLink
})

describe('Logo', () => {
  it('renders the brand text', () => {
    render(<Logo />)
    expect(screen.getByText('AI Fullstack Accelerator')).toBeInTheDocument()
  })

  it('links to the homepage', () => {
    render(<Logo />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders custom siteName when provided', () => {
    render(<Logo siteName="Custom Site" />)
    expect(screen.getByText('Custom Site')).toBeInTheDocument()
  })
})
