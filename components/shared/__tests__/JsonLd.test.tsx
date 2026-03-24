import { render } from '@testing-library/react'
import { JsonLd } from '../JsonLd'

describe('JsonLd', () => {
  it('renders a script tag with application/ld+json type', () => {
    const { container } = render(<JsonLd data={{ '@type': 'WebPage' }} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
  })

  it('serializes data to JSON in the script tag', () => {
    const data = { '@type': 'Article', name: 'Test' }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).toBe(JSON.stringify(data))
  })

  it('handles nested objects', () => {
    const data = { '@context': 'https://schema.org', author: { '@type': 'Person', name: 'Alice' } }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).toContain('"Alice"')
  })
})
