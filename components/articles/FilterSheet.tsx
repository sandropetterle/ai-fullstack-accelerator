'use client'

import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FilterPanel } from './FilterPanel'
import type { CmsArticleListingLabels } from '@/lib/cms/types'

type FilterSheetProps = {
  categories: string[]
  tags: string[]
  labels?: CmsArticleListingLabels
}

export function FilterSheet({ categories, tags, labels }: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label="Open filters">
          <Filter className="h-4 w-4" aria-hidden="true" />
          {labels?.filtersButtonLabel ?? 'Filters'}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto" aria-label="Filter options">
        <SheetHeader>
          <SheetTitle>{labels?.filterSheetTitle ?? 'Filter Articles'}</SheetTitle>
          <SheetDescription>
            {labels?.filterSheetDescription ?? 'Refine your search by category and tags'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <FilterPanel categories={categories} tags={tags} labels={labels} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
