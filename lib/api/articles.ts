/**
 * Article API Functions
 * All article-related API calls and helper functions
 */

import type { Article, ArticleCategory } from '@/lib/types/article'
import type { ArticleDetailDto, ArticleListDto, PaginatedResponse, VoteResponse, CreateArticleDto, UpdateArticleDto } from './types'
import { apiClient } from './client'
import { ApiError } from './error'
import {
  mapArticleDetailDto,
  mapPaginatedResponse,
  mapCategoryToApi,
} from './mappers'

/**
 * Paginated result type for frontend
 */
type PaginatedResult = {
  articles: Article[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Parameters for getArticles query
 */
type GetArticlesParams = {
  page?: number
  pageSize?: number
  sortBy?: 'recent' | 'votes' | 'alphabetical'
  category?: ArticleCategory
  tags?: string[]
  search?: string
  dateFrom?: string
  dateTo?: string
  tagMode?: 'any' | 'all'
}

/**
 * GET /api/articles - Retrieve paginated list of articles with filtering and sorting
 */
export async function getArticles(
  params: GetArticlesParams = {}
): Promise<PaginatedResult> {
  const {
    page = 1,
    pageSize = 9,
    sortBy = 'recent',
    category,
    tags,
    search,
    dateFrom,
    dateTo,
    tagMode,
  } = params

  // Build query string
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy,
  })

  if (category) {
    queryParams.append('category', mapCategoryToApi(category))
  }

  if (tags && tags.length > 0) {
    queryParams.append('tags', tags.join(','))
  }

  if (search) {
    queryParams.append('search', search)
  }

  if (dateFrom) {
    queryParams.append('dateFrom', dateFrom)
  }

  if (dateTo) {
    queryParams.append('dateTo', dateTo)
  }

  if (tagMode && tagMode !== 'any') {
    queryParams.append('tagMode', tagMode)
  }

  const response = await apiClient.get<PaginatedResponse<ArticleListDto>>(
    `/articles?${queryParams.toString()}`
  )

  return mapPaginatedResponse(response)
}

/**
 * GET /api/articles/featured - Get all featured articles
 */
export async function getFeaturedArticles(): Promise<Article[]> {
  const articles = await apiClient.get<ArticleDetailDto[]>('/articles/featured')
  return articles.map(mapArticleDetailDto)
}

/**
 * GET /api/articles/trending - Get all trending articles
 */
export async function getTrendingArticles(): Promise<Article[]> {
  const articles = await apiClient.get<ArticleDetailDto[]>('/articles/trending')
  return articles.map(mapArticleDetailDto)
}

/**
 * GET /api/articles/{slug} - Get detailed information about a specific article
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const article = await apiClient.get<ArticleDetailDto>(`/articles/${slug}`)
    return mapArticleDetailDto(article)
  } catch (error) {
    // Return null for 404 errors (article not found)
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }
    throw error
  }
}

/**
 * GET /api/articles/{slug}/related - Get related articles (same category + tag overlap, cached)
 */
export async function getRelatedArticles(slug: string): Promise<Article[]> {
  try {
    const articles = await apiClient.get<ArticleDetailDto[]>(`/articles/${slug}/related`)
    return articles.map(mapArticleDetailDto)
  } catch {
    return []
  }
}

/**
 * POST /api/articles/{id}/vote - Increment vote count for an article
 */
export async function voteForArticle(id: string): Promise<VoteResponse> {
  return await apiClient.post<VoteResponse>(`/articles/${id}/vote`)
}

/**
 * POST /api/articles - Create a new article (requires Editor role)
 */
export async function createArticle(
  data: {
    title: string
    shortDescription: string
    fullContent?: string
    category: ArticleCategory
    tags: string[]
    author?: string
  },
  token?: string
): Promise<Article> {
  const dto: CreateArticleDto = {
    title: data.title,
    shortDescription: data.shortDescription,
    fullContent: data.fullContent,
    category: mapCategoryToApi(data.category),
    tags: data.tags,
    author: data.author,
  }
  const response = await apiClient.post<ArticleDetailDto>('/articles', dto, { token })
  return mapArticleDetailDto(response)
}

/**
 * PUT /api/articles/{id} - Update an existing article (requires Editor role)
 */
export async function updateArticle(
  id: string,
  data: {
    title: string
    shortDescription: string
    fullContent?: string
    category: ArticleCategory
    tags: string[]
    author?: string
    isFeatured: boolean
    isTrending: boolean
  },
  token?: string
): Promise<Article> {
  const dto: UpdateArticleDto = {
    title: data.title,
    shortDescription: data.shortDescription,
    fullContent: data.fullContent,
    category: mapCategoryToApi(data.category),
    tags: data.tags,
    author: data.author,
    isFeatured: data.isFeatured,
    isTrending: data.isTrending,
  }
  const response = await apiClient.put<ArticleDetailDto>(`/articles/${id}`, dto, { token })
  return mapArticleDetailDto(response)
}

/**
 * DELETE /api/articles/{id} - Delete an article (requires Admin role)
 */
export async function deleteArticle(id: string, token?: string): Promise<void> {
  await apiClient.delete(`/articles/${id}`, { token })
}

// ============================================================================
// Helper Functions (client-side utilities)
// ============================================================================

/**
 * Extract unique categories from an articles array
 */
export function getAllCategories(articles: Article[]): ArticleCategory[] {
  const categories = new Set<ArticleCategory>()
  articles.forEach((article) => categories.add(article.category))
  return Array.from(categories).sort()
}

/**
 * Extract unique tags from an articles array
 */
export function getAllTags(articles: Article[]): string[] {
  const tags = new Set<string>()
  articles.forEach((article) => {
    article.tags.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

/**
 * Calculate statistics from articles array
 */
export function getArticleStats(articles: Article[]): {
  totalArticles: number
  totalCategories: number
  totalContributors: string
} {
  const categories = getAllCategories(articles)
  const authors = new Set<string>()

  articles.forEach((article) => {
    if (article.author) {
      authors.add(article.author)
    }
  })

  return {
    totalArticles: articles.length,
    totalCategories: categories.length,
    totalContributors: authors.size > 0 ? `${authors.size}+` : '15+',
  }
}
