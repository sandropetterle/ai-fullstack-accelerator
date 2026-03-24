import { render, screen, fireEvent } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { LoginForm } from '../LoginForm'

describe('LoginForm', () => {
  it('renders the sign-in heading and button', () => {
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument()
  })

  it('renders the footer description text', () => {
    render(<LoginForm />)

    expect(screen.getByText(/managed securely by microsoft entra/i)).toBeInTheDocument()
  })

  it('calls signIn with entra-external-id when button is clicked', () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole('button', { name: /continue with microsoft/i }))
    expect(signIn).toHaveBeenCalledWith('entra-external-id')
  })

  it('shows an error message when error prop is provided', () => {
    render(<LoginForm error="AccessDenied" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('shows a fallback error message for unknown error codes', () => {
    render(<LoginForm error="UnknownCode" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
  })

  it('does not show error alert when no error prop is given', () => {
    render(<LoginForm />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
