/**
 * Data Transformation Layer
 * Bidirectional mapping between backend DTOs and frontend types
 */

import type { Article, ArticleListItem, ArticleCategory } from '@/lib/types/article'
import type { ArticleListDto, ArticleDetailDto, PaginatedResponse } from './types'

/**
 * Category mapping: API (PascalCase) → UI
 * New categories match directly — no space mapping needed.
 */
const CATEGORY_API_TO_UI: Record<string, ArticleCategory> = {
  General: 'General',
  Tutorial: 'Tutorial',
  Guide: 'Guide',
  Reference: 'Reference',
  News: 'News',
}

/**
 * Category mapping: UI → API (PascalCase)
 */
const CATEGORY_UI_TO_API: Record<ArticleCategory, string> = {
  General: 'General',
  Tutorial: 'Tutorial',
  Guide: 'Guide',
  Reference: 'Reference',
  News: 'News',
}

/**
 * Maps category from API format to UI format
 */
export function mapCategoryFromApi(apiCategory: string): ArticleCategory {
  const mapped = CATEGORY_API_TO_UI[apiCategory]
  if (!mapped) {
    console.warn(`Unknown API category: ${apiCategory}, defaulting to General`)
    return 'General'
  }
  return mapped
}

/**
 * Maps category from UI format to API format
 */
export function mapCategoryToApi(uiCategory: ArticleCategory): string {
  const mapped = CATEGORY_UI_TO_API[uiCategory]
  if (!mapped) {
    console.warn(`Unknown UI category: ${uiCategory}, defaulting to General`)
    return 'General'
  }
  return mapped
}

/**
 * Maps backend ArticleListDto to frontend ArticleListItem
 */
export function mapArticleListDto(dto: ArticleListDto): ArticleListItem {
  return {
    id: dto.id,
    title: dto.title,
    slug: dto.slug,
    shortDescription: dto.shortDescription,
    category: mapCategoryFromApi(dto.category),
    tags: dto.tags,
    author: dto.author ?? undefined,
    createdDate: dto.createdDate,
    updatedDate: dto.updatedDate,
    voteCount: dto.voteCount,
    status: dto.status as 'Draft' | 'Published' | 'Archived',
    isFeatured: dto.isFeatured,
    isTrending: dto.isTrending,
  }
}

/**
 * Maps backend ArticleDetailDto to frontend Article
 */
export function mapArticleDetailDto(dto: ArticleDetailDto): Article {
  return {
    id: dto.id,
    title: dto.title,
    slug: dto.slug,
    shortDescription: dto.shortDescription,
    fullContent: dto.fullContent ?? undefined,
    category: mapCategoryFromApi(dto.category),
    tags: dto.tags,
    author: dto.author ?? undefined,
    createdDate: dto.createdDate,
    updatedDate: dto.updatedDate,
    voteCount: dto.voteCount,
    status: dto.status as 'Draft' | 'Published' | 'Archived',
    isFeatured: dto.isFeatured,
    isTrending: dto.isTrending,
  }
}

/**
 * Maps backend PaginatedResponse to frontend format
 * Adds hasNextPage and hasPreviousPage for convenience
 */
export function mapPaginatedResponse(
  response: PaginatedResponse<ArticleListDto>
): {
  articles: ArticleListItem[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
} {
  return {
    articles: response.items.map(mapArticleListDto),
    totalCount: response.totalCount,
    currentPage: response.currentPage,
    totalPages: response.totalPages,
    hasNextPage: response.currentPage < response.totalPages,
    hasPreviousPage: response.currentPage > 1,
  }
}
