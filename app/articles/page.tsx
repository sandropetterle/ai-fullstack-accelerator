import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getArticles,
  getAllCategories,
  getAllTags,
} from '@/lib/api/articles'
import type { SortOption } from '@/lib/types/article'
import { JsonLd } from '@/components/shared/JsonLd'
import type { ArticleCategory } from '@/lib/types/article'
import { SearchBar } from '@/components/articles/SearchBar'
import { SortSelector } from '@/components/articles/SortSelector'
import { FilterPanel } from '@/components/articles/FilterPanel'
import { FilterSheet } from '@/components/articles/FilterSheet'
import { ArticlesGrid } from '@/components/articles/ArticlesGrid'
import { EmptyState } from '@/components/articles/EmptyState'
import { Pagination } from '@/components/articles/Pagination'
import { NewArticleButton } from '@/components/articles/NewArticleButton'
import { getArticleListingLabels } from '@/lib/cms/queries'

type SearchParams = Promise<{
  q?: string
  category?: string
  tags?: string
  sort?: SortOption
  page?: string
  dateFrom?: string
  dateTo?: string
  tagMode?: string
}>

export const metadata: Metadata = {
  title: 'Browse Articles',
  description:
    'Browse our curated collection of articles, tutorials, and guides. Filter by category, search by keyword, and discover solutions for your projects.',
  keywords: [
    'articles',
    'tutorials',
    'guides',
    'reference',
    'AI',
    'fullstack',
    'software development',
    'architecture',
  ],
  openGraph: {
    title: 'Browse Articles | AI Fullstack Accelerator',
    description:
      'Browse our curated collection of articles, tutorials, and guides.',
    url: 'https://your-domain.com/articles',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Articles | AI Fullstack Accelerator',
    description:
      'Browse our curated collection of articles, tutorials, and guides.',
  },
}

// Revalidate every 2 minutes
export const revalidate = 120

export default async function ArticlesPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams

  // Parse search params
  const searchQuery = searchParams.q
  const category = searchParams.category
  const tags = searchParams.tags?.split(',').filter(Boolean)
  const sortBy = (searchParams.sort as SortOption) || 'recent'
  const page = parseInt(searchParams.page || '1', 10)
  const dateFrom = searchParams.dateFrom
  const dateTo = searchParams.dateTo
  const tagMode = searchParams.tagMode as 'any' | 'all' | undefined

  // Fetch CMS labels, paginated articles, and all articles (for filter options) in parallel.
  // Handle API unavailable during build (e.g., Docker build) — falls back to empty state.
  const labelsPromise = getArticleListingLabels()

  let result: Awaited<ReturnType<typeof getArticles>> = {
    articles: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }
  let allCategories: ArticleCategory[] = []
  let allTags: string[] = []

  try {
    const [fetchedResult, allArticles] = await Promise.all([
      getArticles({
        page,
        pageSize: 9,
        category: category as ArticleCategory | undefined,
        tags,
        search: searchQuery,
        sortBy,
        dateFrom,
        dateTo,
        tagMode,
      }),
      // Fetch all articles for filter panel category/tag options in parallel
      getArticles({ pageSize: 100 }),
    ])

    result = fetchedResult
    allCategories = getAllCategories(allArticles.articles)
    allTags = getAllTags(allArticles.articles)
  } catch (error) {
    console.warn('Failed to fetch articles for listing page build:', error)
    // Will show empty state, page will be generated on-demand
  }

  const labels = await labelsPromise
  const hasActiveFilters = !!(searchQuery || category || tags?.length || dateFrom || dateTo)

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Fullstack Accelerator',
    description:
      'Browse curated articles, tutorials, and guides',
    url: 'https://your-domain.com/articles',
    numberOfItems: result.totalCount,
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              {labels.pageTitle ?? 'Browse Articles'}
            </h1>
            <p className="text-muted-foreground">
              Discover {result.totalCount}{' '}
              {result.totalCount === 1 ? 'article' : 'articles'} in our library
            </p>
          </div>
          <NewArticleButton />
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Suspense
              fallback={
                <div className="h-10 bg-muted animate-pulse rounded" />
              }
            >
              <SearchBar
                allArticles={result.articles}
                allTags={allTags}
                searchPlaceholder={labels.searchPlaceholder}
              />
            </Suspense>
          </div>
          <div className="flex gap-2">
            <div className="lg:hidden">
              <FilterSheet categories={allCategories} tags={allTags} labels={labels} />
            </div>
            <Suspense
              fallback={
                <div className="h-10 w-[200px] bg-muted animate-pulse rounded" />
              }
            >
              <SortSelector
                sortByLabel={labels.sortByLabel}
                sortOptions={labels.sortOptions}
              />
            </Suspense>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-8">
          {/* Desktop Filter Panel */}
          <div className="hidden lg:block">
            <Suspense
              fallback={
                <div className="w-64 h-96 bg-muted animate-pulse rounded" />
              }
            >
              <FilterPanel categories={allCategories} tags={allTags} labels={labels} />
            </Suspense>
          </div>

          {/* Articles Grid */}
          <div className="flex-1">
            {/* SR live region for results count */}
            <p role="status" aria-live="polite" className="sr-only">
              {result.totalCount === 0
                ? 'No articles found'
                : `${result.totalCount} article${result.totalCount === 1 ? '' : 's'} found`}
            </p>

            {result.articles.length > 0 ? (
              <>
                <ArticlesGrid articles={result.articles} />
                <Suspense
                  fallback={
                    <div className="h-12 bg-muted animate-pulse rounded mt-8" />
                  }
                >
                  <Pagination
                    currentPage={result.currentPage}
                    totalPages={result.totalPages}
                    hasNextPage={result.hasNextPage}
                    hasPreviousPage={result.hasPreviousPage}
                    previousLabel={labels.previousLabel}
                    nextLabel={labels.nextLabel}
                  />
                </Suspense>
              </>
            ) : (
              <EmptyState
                hasFilters={hasActiveFilters}
                filteredHeading={labels.emptyFilteredHeading}
                unfilteredHeading={labels.emptyUnfilteredHeading}
                filteredDescription={labels.emptyFilteredDescription}
                unfilteredDescription={labels.emptyUnfilteredDescription}
                clearFiltersLabel={labels.clearFiltersLabel}
              />
            )}
          </div>
        </div>
      </div>

      <JsonLd data={jsonLd} />
    </>
  )
}
