'use client'

type LoadingAnnouncerProps = {
  isPending: boolean
  message?: string
}

export function LoadingAnnouncer({
  isPending,
  message = 'Loading articles...',
}: LoadingAnnouncerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {isPending ? message : ''}
    </div>
  )
}
