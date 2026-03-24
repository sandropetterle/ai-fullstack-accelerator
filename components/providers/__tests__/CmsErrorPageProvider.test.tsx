import { render, screen } from '@testing-library/react'
import { CmsErrorPageProvider, useCmsErrorPage } from '../CmsErrorPageProvider'

function Consumer() {
  const labels = useCmsErrorPage()
  return (
    <div>
      <span data-testid="title">{labels.title}</span>
      <span data-testid="description">{labels.description}</span>
      <span data-testid="retry">{labels.retryButtonLabel}</span>
      <span data-testid="home">{labels.homeButtonLabel}</span>
    </div>
  )
}

describe('CmsErrorPageProvider', () => {
  it('provides default labels when no labels object is supplied', () => {
    render(
      <CmsErrorPageProvider labels={{}}>
        <Consumer />
      </CmsErrorPageProvider>
    )
    expect(screen.getByTestId('title').textContent).toBe('Something went wrong')
    expect(screen.getByTestId('description').textContent).toBe(
      'We encountered an unexpected error. Please try again.'
    )
    expect(screen.getByTestId('retry').textContent).toBe('Try again')
    expect(screen.getByTestId('home').textContent).toBe('Go home')
  })

  it('provides CMS labels when supplied', () => {
    render(
      <CmsErrorPageProvider
        labels={{
          title: 'Oops!',
          description: 'Custom description',
          retryButtonLabel: 'Retry',
          homeButtonLabel: 'Homepage',
        }}
      >
        <Consumer />
      </CmsErrorPageProvider>
    )
    expect(screen.getByTestId('title').textContent).toBe('Oops!')
    expect(screen.getByTestId('description').textContent).toBe('Custom description')
    expect(screen.getByTestId('retry').textContent).toBe('Retry')
    expect(screen.getByTestId('home').textContent).toBe('Homepage')
  })

  it('falls back to defaults for missing individual fields', () => {
    render(
      <CmsErrorPageProvider labels={{ title: 'Custom Title' }}>
        <Consumer />
      </CmsErrorPageProvider>
    )
    expect(screen.getByTestId('title').textContent).toBe('Custom Title')
    expect(screen.getByTestId('retry').textContent).toBe('Try again')
  })

  it('useCmsErrorPage returns defaults when used outside provider', () => {
    render(<Consumer />)
    expect(screen.getByTestId('title').textContent).toBe('Something went wrong')
  })
})
