'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ArticlesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Articles page error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <CardTitle className="text-2xl">Failed to load articles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We couldn't load the articles from our server. This might be because:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>The backend API server is not running</li>
              <li>There's a network connectivity issue</li>
              <li>The server is temporarily unavailable</li>
            </ul>
            {error.message && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-mono">{error.message}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Go home
              </Button>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>For developers:</strong> Make sure the backend API is running at{' '}
                <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                  http://localhost:5255
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
