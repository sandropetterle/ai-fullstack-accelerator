import { cn } from '@/lib/utils'

type SkeletonCardProps = {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 space-y-4 animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      {/* Category badge */}
      <div className="h-5 w-24 bg-muted rounded-full" />
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-full" />
        <div className="h-6 bg-muted rounded w-3/4" />
      </div>
      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-14 bg-muted rounded-full" />
      </div>
      {/* Footer */}
      <div className="flex justify-between">
        <div className="h-4 w-14 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </div>
  )
}
