import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CmsErrorPageProvider } from '@/components/providers/CmsErrorPageProvider'
import { Toaster } from 'sonner'
import { getGlobal, getErrorPage } from '@/lib/cms/queries'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AI Fullstack Accelerator',
    template: '%s | AI Fullstack Accelerator',
  },
  description: 'A fullstack accelerator for building AI-powered applications with modern web technologies.',
  keywords: ['AI', 'fullstack', 'accelerator', 'Next.js', 'ASP.NET Core', 'TypeScript'],
  authors: [{ name: 'AI Fullstack Accelerator' }],
  creator: 'AI Fullstack Accelerator',
  publisher: 'AI Fullstack Accelerator',
  metadataBase: new URL('https://your-domain.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'AI Fullstack Accelerator',
    title: 'AI Fullstack Accelerator',
    description: 'A fullstack accelerator for building AI-powered applications with modern web technologies.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AI Fullstack Accelerator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Fullstack Accelerator',
    description: 'A fullstack accelerator for building AI-powered applications with modern web technologies.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [global, errorPage] = await Promise.all([getGlobal(), getErrorPage()])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply dark class before first paint based on stored preference or system setting */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <CmsErrorPageProvider labels={errorPage}>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
              >
                {global.skipToContentLabel ?? 'Skip to main content'}
              </a>
              <div className="flex min-h-screen flex-col">
                <Header
                  navLinks={global.navigation}
                  mobileMenuTitle={global.mobileMenuTitle}
                  signInLabel={global.signInLabel}
                  signOutLabel={global.signOutLabel}
                  userMenuLabel={global.userMenuLabel}
                  newArticleButtonLabel={global.newArticleButtonLabel}
                  siteName={global.siteName}
                />
                <main id="main-content" className="flex-1">{children}</main>
                <Footer footerConfig={global.footer} />
                <Toaster position="bottom-right" />
              </div>
            </CmsErrorPageProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
