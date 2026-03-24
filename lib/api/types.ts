/**
 * Backend DTO Types
 * TypeScript definitions matching C# DTOs from the backend API
 * These use backend conventions (PascalCase categories, lowercase status)
 */

/**
 * Article list DTO - excludes fullContent for performance
 */
export type ArticleListDto = {
  id: string
  title: string
  slug: string
  shortDescription: string
  category: string // Backend uses PascalCase: "General", "Tutorial", etc.
  tags: string[]
  author: string | null
  createdDate: string // ISO 8601 format
  updatedDate: string // ISO 8601 format
  voteCount: number
  status: string // "Draft", "Published", "Archived"
  isFeatured: boolean
  isTrending: boolean
}

/**
 * Article detail DTO - includes fullContent
 */
export type ArticleDetailDto = {
  id: string
  title: string
  slug: string
  shortDescription: string
  fullContent: string | null
  category: string // Backend uses PascalCase: "General", "Tutorial", etc.
  tags: string[]
  author: string | null
  createdDate: string // ISO 8601 format
  updatedDate: string // ISO 8601 format
  voteCount: number
  status: string // "Draft", "Published", "Archived"
  isFeatured: boolean
  isTrending: boolean
}

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T> = {
  items: T[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
}

/**
 * Vote response
 */
export type VoteResponse = {
  articleId: string
  voteCount: number
}

/**
 * Create article DTO
 */
export type CreateArticleDto = {
  title: string
  shortDescription: string
  fullContent?: string
  category: string // Backend PascalCase format
  tags: string[]
  author?: string
}

/**
 * Update article DTO
 */
export type UpdateArticleDto = {
  title: string
  shortDescription: string
  fullContent?: string
  category: string // Backend PascalCase format
  tags: string[]
  author?: string
  isFeatured: boolean
  isTrending: boolean
}
