import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function ArticlesLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header skeleton */}
      <div className="space-y-2 animate-pulse mb-8">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-6 bg-muted rounded w-1/4" />
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 animate-pulse mb-8">
        <div className="flex-1 h-10 bg-muted rounded" />
        <div className="h-10 w-[200px] bg-muted rounded" />
      </div>

      {/* Articles grid skeleton */}
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 space-y-4 animate-pulse shrink-0">
          <div className="h-8 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-muted rounded" />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
