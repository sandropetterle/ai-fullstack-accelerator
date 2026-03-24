import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LoginForm } from './LoginForm'
import { getLoginPage } from '@/lib/cms/queries'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to AI Fullstack Accelerator',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()

  // Already signed in — send them where they came from or home
  if (session) {
    const { callbackUrl } = await searchParams
    redirect(callbackUrl ?? '/')
  }

  const [{ error }, loginLabels] = await Promise.all([
    searchParams,
    getLoginPage(),
  ])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <LoginForm
        error={error}
        cardTitle={loginLabels.cardTitle}
        cardDescription={loginLabels.cardDescription}
        signInButtonLabel={loginLabels.signInButtonLabel}
        signInLoadingLabel={loginLabels.signInLoadingLabel}
        footerNotice={loginLabels.footerNotice}
        errorMessages={loginLabels.errorMessages}
      />
    </div>
  )
}
