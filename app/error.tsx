'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { useCmsErrorPage } from '@/components/providers/CmsErrorPageProvider'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const labels = useCmsErrorPage()

  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <CardTitle className="text-2xl">{labels.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {labels.description}
            </p>
            {error.message && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-mono">{error.message}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={reset}>{labels.retryButtonLabel}</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                {labels.homeButtonLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
