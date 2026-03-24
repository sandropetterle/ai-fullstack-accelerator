import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { getNotFoundPage } from '@/lib/cms/queries'

export default async function NotFound() {
  const page = await getNotFoundPage()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-6xl font-bold mb-4">{page.errorCode ?? '404'}</h1>
      <h2 className="text-2xl font-semibold mb-4">{page.heading ?? 'Page Not Found'}</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        {page.message ?? 'The page you are looking for does not exist or has been moved.'}
      </p>
      <Button asChild>
        <Link href={page.backButton?.href ?? '/'}>
          <Home className="mr-2 h-4 w-4" />
          {page.backButton?.label ?? 'Back to Home'}
        </Link>
      </Button>
    </div>
  )
}
