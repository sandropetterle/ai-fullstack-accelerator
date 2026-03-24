'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { DateRangeFilter } from './DateRangeFilter'
import { SavedSearches } from './SavedSearches'
import { RecentlyViewedSidebar } from './RecentlyViewedSidebar'
import type { CmsArticleListingLabels } from '@/lib/cms/types'

type FilterPanelProps = {
  categories: string[]
  tags: string[]
  labels?: CmsArticleListingLabels
}

export function FilterPanel({ categories, tags, labels }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategory = searchParams.get('category') || 'all'
  const selectedTags =
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  const tagMode = searchParams.get('tagMode') || 'any'
  const dateFrom = searchParams.get('dateFrom') || undefined
  const dateTo = searchParams.get('dateTo') || undefined

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedTags.length > 0 ||
    !!dateFrom ||
    !!dateTo

  // Build description for live region
  const activeFilterDescription = (() => {
    const parts: string[] = []
    if (selectedCategory !== 'all') parts.push(`Category: ${selectedCategory}`)
    if (selectedTags.length > 0)
      parts.push(`${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`)
    if (dateFrom || dateTo) parts.push('date range')
    return parts.length > 0 ? `Filtered by ${parts.join(', ')}` : ''
  })()

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      // Reset to page 1 on filter change
      params.delete('page')

      router.push(`/articles?${params.toString()}`)
    },
    [searchParams, router]
  )

  const handleCategoryChange = useCallback(
    (category: string) => {
      updateParams({ category: category === 'all' ? null : category })
    },
    [updateParams]
  )

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]

      updateParams({ tags: newTags.length > 0 ? newTags.join(',') : null })
    },
    [selectedTags, updateParams]
  )

  const handleTagModeChange = useCallback(
    (mode: 'any' | 'all') => {
      updateParams({ tagMode: mode === 'any' ? null : mode })
    },
    [updateParams]
  )

  const handleClearFilters = () => {
    updateParams({ category: null, tags: null, dateFrom: null, dateTo: null, tagMode: null })
  }

  return (
    <aside className="w-64 space-y-6">
      {/* SR live region for filter changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {activeFilterDescription}
      </div>

      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{labels?.filterSectionHeader ?? 'Filters'}</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
          >
            {labels?.clearAllLabel ?? 'Clear all'}
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{labels?.categoryLabel ?? 'Category'}</Label>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('all')}
            aria-pressed={selectedCategory === 'all'}
            className={`block w-full text-left text-sm px-2 py-1 rounded transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {labels?.allCategoriesLabel ?? 'All Categories'}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              aria-pressed={selectedCategory === category}
              className={`block w-full text-left text-sm px-2 py-1 rounded transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        dateRangeHeader={labels?.dateRangeHeader}
        clearDatesLabel={labels?.clearDatesLabel}
        fromLabel={labels?.fromLabel}
        toLabel={labels?.toLabel}
      />

      {/* Tags Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{labels?.tagsLabel ?? 'Tags'}</Label>

        {/* AND/OR toggle — only shown when 2+ tags selected */}
        {selectedTags.length >= 2 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{labels?.tagModeLabel ?? 'Match:'}</span>
            <button
              onClick={() => handleTagModeChange('any')}
              aria-pressed={tagMode === 'any'}
              className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                tagMode === 'any'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              {labels?.anyLabel ?? 'Any'}
            </button>
            <button
              onClick={() => handleTagModeChange('all')}
              aria-pressed={tagMode === 'all'}
              className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                tagMode === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              {labels?.allLabel ?? 'All'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => handleTagToggle(tag)}
              />
              <label
                htmlFor={`tag-${tag}`}
                className="text-sm cursor-pointer flex-1"
              >
                {tag}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-sm font-medium">{labels?.activeFiltersLabel ?? 'Active Filters'}</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="ml-1 hover:text-foreground"
                  aria-label={`Remove category filter: ${selectedCategory}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:text-foreground"
                  aria-label={`Remove tag filter: ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Saved Searches */}
      <SavedSearches
        savedSearchesHeader={labels?.savedSearchesHeader}
        saveCurrentLabel={labels?.saveCurrentLabel}
        saveDialogTitle={labels?.saveDialogTitle}
        saveDialogDescription={labels?.saveDialogDescription}
        searchNameLabel={labels?.searchNameLabel}
        searchNamePlaceholder={labels?.searchNamePlaceholder}
        cancelLabel={labels?.cancelLabel}
        saveLabel={labels?.saveLabel}
      />

      {/* Recently Viewed */}
      <RecentlyViewedSidebar
        recentlyViewedHeader={labels?.recentlyViewedHeader}
        clearLabel={labels?.clearLabel}
      />
    </aside>
  )
}
