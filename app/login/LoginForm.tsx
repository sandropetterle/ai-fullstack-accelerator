'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { LogIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Could not start the sign-in flow. Please try again.',
  OAuthCallback: 'Sign-in failed during callback. Please try again.',
  OAuthCreateAccount: 'Could not create your account. Please try again.',
  Callback: 'Sign-in callback failed. Please try again.',
  AccessDenied: 'Access denied. You may not have permission to access this application.',
  Verification: 'The sign-in link has expired. Please request a new one.',
  Default: 'An unexpected error occurred during sign-in. Please try again.',
}

type Props = {
  error?: string
  cardTitle?: string
  cardDescription?: string
  signInButtonLabel?: string
  signInLoadingLabel?: string
  footerNotice?: string
  errorMessages?: Record<string, string>
}

/**
 * Branded login page that redirects to Entra External ID's hosted sign-in flow.
 * Labels are CMS-driven with hardcoded fallbacks.
 */
export function LoginForm({
  error,
  cardTitle = 'Sign in',
  cardDescription = 'Access the AI Fullstack Accelerator',
  signInButtonLabel = 'Continue with Microsoft',
  signInLoadingLabel = 'Redirecting...',
  footerNotice = 'Sign-in is managed securely by Microsoft Entra.\nOnly authorized users may access this application.',
  errorMessages = DEFAULT_ERROR_MESSAGES,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const mergedErrorMessages = { ...DEFAULT_ERROR_MESSAGES, ...errorMessages }
  const errorMessage = error
    ? (mergedErrorMessages[error] ?? mergedErrorMessages.Default)
    : null

  async function handleSignIn() {
    setIsLoading(true)
    await signIn('entra-external-id')
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold leading-none tracking-tight">{cardTitle}</h1>
          <CardDescription>{cardDescription}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          className="w-full gap-2"
          onClick={handleSignIn}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {isLoading ? signInLoadingLabel : signInButtonLabel}
        </Button>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-center text-xs text-muted-foreground">
        <p style={{ whiteSpace: 'pre-line' }}>{footerNotice}</p>
      </CardFooter>
    </Card>
  )
}
