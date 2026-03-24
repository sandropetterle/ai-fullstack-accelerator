'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortOption } from '@/lib/types/article'

const DEFAULT_SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'votes', label: 'Most Voted' },
  { value: 'alphabetical', label: 'Alphabetical' },
]

type SortSelectorProps = {
  sortByLabel?: string
  sortOptions?: Array<{ value: string; label: string }>
}

export function SortSelector({ sortByLabel = 'Sort by:', sortOptions }: SortSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get('sort') as SortOption) || 'recent'
  const effectiveSortOptions = sortOptions ?? DEFAULT_SORT_OPTIONS

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)

    // Reset to page 1 on sort change
    params.delete('page')

    router.push(`/articles?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
        {sortByLabel}
      </label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {effectiveSortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
