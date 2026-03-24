import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero skeleton */}
      <div className="space-y-4 animate-pulse mb-12 text-center">
        <div className="h-12 bg-muted rounded w-3/4 mx-auto" />
        <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
        <div className="flex justify-center gap-4 pt-2">
          <div className="h-10 w-32 bg-muted rounded-md" />
          <div className="h-10 w-28 bg-muted rounded-md" />
        </div>
      </div>

      {/* Featured articles skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
