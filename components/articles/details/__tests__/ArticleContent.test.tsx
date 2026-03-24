jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt }: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />
  },
}))

// react-markdown and its plugins use ESM, so mock them for Jest compatibility.
// The mock invokes the img and code component renderers so their coverage is collected.
jest.mock('react-markdown', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function ReactMarkdown({ children, components }: any) {
    const Img = components?.img
    const Code = components?.code
    return (
      <div data-testid="markdown-content">
        <span>{children}</span>
        {Img && <Img src="https://staipatternsmedia.blob.core.windows.net/img.png" alt="blob-image" />}
        {Img && <Img src="https://external.com/img.png" alt="external-image" />}
        {Img && <Img alt="no-src-image" />}
        {Code && <Code className="language-js">{'block code'}</Code>}
        {Code && <Code>{'inline code'}</Code>}
      </div>
    )
  }
})
jest.mock('remark-gfm', () => () => ({}))
jest.mock('rehype-sanitize', () => () => ({}))

import { render, screen } from '@testing-library/react'
import { ArticleContent } from '../ArticleContent'

describe('ArticleContent', () => {
  it('renders the content inside the prose wrapper', () => {
    render(<ArticleContent content="Hello world" />)
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
  })

  it('passes content string to ReactMarkdown', () => {
    render(<ArticleContent content="# My Heading" />)
    expect(screen.getByText('# My Heading')).toBeInTheDocument()
  })

  it('renders the prose container div', () => {
    const { container } = render(<ArticleContent content="test" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.classList.contains('prose')).toBe(true)
  })

  it('renders without crashing for empty content', () => {
    const { container } = render(<ArticleContent content="" />)
    expect(container).toBeTruthy()
  })

  it('renders multi-line markdown content', () => {
    render(<ArticleContent content={'Line one\nLine two'} />)
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
  })

  describe('img renderer', () => {
    it('renders optimizable image (blob storage) via next/image', () => {
      render(<ArticleContent content="test" />)
      const img = screen.getByAltText('blob-image')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('data-testid', 'next-image')
    })

    it('renders external image as native img with lazy loading', () => {
      render(<ArticleContent content="test" />)
      const img = screen.getByAltText('external-image')
      expect(img.tagName).toBe('IMG')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it('returns null for img with missing src', () => {
      render(<ArticleContent content="test" />)
      expect(screen.queryByAltText('no-src-image')).not.toBeInTheDocument()
    })
  })

  describe('code renderer', () => {
    it('renders block code with block layout class', () => {
      render(<ArticleContent content="test" />)
      const codeEl = screen.getByText('block code')
      expect(codeEl.tagName).toBe('CODE')
      expect(codeEl.className).toContain('block')
    })

    it('renders inline code with bg-muted class', () => {
      render(<ArticleContent content="test" />)
      const codeEl = screen.getByText('inline code')
      expect(codeEl.tagName).toBe('CODE')
      expect(codeEl.className).toContain('bg-muted')
    })
  })
})
