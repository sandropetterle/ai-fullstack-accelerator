import { render } from '@testing-library/react'
import { GithubIcon } from '../GithubIcon'

describe('GithubIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<GithubIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })

  it('forwards className to the svg element', () => {
    const { container } = render(<GithubIcon className="h-4 w-4 text-primary" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('h-4', 'w-4', 'text-primary', 'lucide', 'lucide-github')
  })

  it('applies a custom size to width and height', () => {
    const { container } = render(<GithubIcon size={32} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('is hidden from accessibility tree by default', () => {
    const { container } = render(<GithubIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('respects an explicit aria-label instead of aria-hidden', () => {
    const { container } = render(<GithubIcon aria-label="GitHub" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-label', 'GitHub')
    expect(svg).not.toHaveAttribute('aria-hidden')
  })
})
