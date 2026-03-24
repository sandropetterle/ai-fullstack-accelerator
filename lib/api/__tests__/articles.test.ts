/**
 * Article API Functions Tests
 * Tests both async API functions and client-side utility helpers
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import type { Article } from '@/lib/types/article'
import type { ArticleDetailDto, PaginatedResponse, ArticleListDto } from '../types'
import { apiClient } from '../client'
import { ApiError } from '../error'
import {
  getAllCategories,
  getAllTags,
  getArticleStats,
  getArticles,
  getFeaturedArticles,
  getTrendingArticles,
  getArticleBySlug,
  voteForArticle,
  getRelatedArticles,
} from '../articles'

// Typed spies set up in beforeEach
let getSpy: ReturnType<typeof jest.spyOn>
let postSpy: ReturnType<typeof jest.spyOn>

const makeDetailDto = (overrides: Partial<ArticleDetailDto> = {}): ArticleDetailDto => ({
  id: 'test-id',
  title: 'Test Article',
  slug: 'test-article',
  shortDescription: 'A test article',
  fullContent: null,
  category: 'General',
  tags: ['react'],
  author: null,
  createdDate: '2024-01-15T00:00:00Z',
  updatedDate: '2024-01-15T00:00:00Z',
  voteCount: 5,
  status: 'published',
  isFeatured: false,
  isTrending: false,
  ...overrides,
})

const makePaginatedResponse = (dtos: ArticleListDto[]): PaginatedResponse<ArticleListDto> => ({
  items: dtos,
  totalCount: dtos.length,
  currentPage: 1,
  pageSize: 9,
  totalPages: 1,
})

describe('Async Article API Functions', () => {
  beforeEach(() => {
    getSpy = jest.spyOn(apiClient, 'get')
    postSpy = jest.spyOn(apiClient, 'post')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getArticles', () => {
    it('calls GET /articles with default params', async () => {
      const dto = makeDetailDto() as unknown as ArticleListDto
      getSpy.mockResolvedValueOnce(makePaginatedResponse([dto]))

      const result = await getArticles()

      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('/articles?')
      )
      expect(result.currentPage).toBe(1)
      expect(result.articles).toHaveLength(1)
    })

    it('passes category param mapped to backend format', async () => {
      getSpy.mockResolvedValueOnce(makePaginatedResponse([]))

      await getArticles({ category: 'Tutorial' })

      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('category=Tutorial')
      )
    })

    it('passes tags as comma-separated string', async () => {
      getSpy.mockResolvedValueOnce(makePaginatedResponse([]))

      await getArticles({ tags: ['react', 'node'] })

      const url = getSpy.mock.calls[0][0] as string
      expect(url).toContain('tags=')
      expect(url).toContain('react')
      expect(url).toContain('node')
    })

    it('passes search param', async () => {
      getSpy.mockResolvedValueOnce(makePaginatedResponse([]))

      await getArticles({ search: 'my query' })

      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('search=')
      )
    })

    it('does not append category param when not provided', async () => {
      getSpy.mockResolvedValueOnce(makePaginatedResponse([]))

      await getArticles({ sortBy: 'votes' })

      const url = getSpy.mock.calls[0][0] as string
      expect(url).not.toContain('category=')
    })

    it('does not append tags param when tags is empty', async () => {
      getSpy.mockResolvedValueOnce(makePaginatedResponse([]))

      await getArticles({ tags: [] })

      const url = getSpy.mock.calls[0][0] as string
      expect(url).not.toContain('tags=')
    })

    it('does not append search param when not provided', async () => {
      getSpy.mockResolvedValueOnce(makePaginatedResponse([]))

      await getArticles({ page: 2 })

      const url = getSpy.mock.calls[0][0] as string
      expect(url).not.toContain('search=')
    })
  })

  describe('getFeaturedArticles', () => {
    it('calls GET /articles/featured', async () => {
      getSpy.mockResolvedValueOnce([makeDetailDto({ isFeatured: true })])

      const result = await getFeaturedArticles()

      expect(getSpy).toHaveBeenCalledWith('/articles/featured')
      expect(result).toHaveLength(1)
    })

    it('returns mapped Article objects', async () => {
      getSpy.mockResolvedValueOnce([makeDetailDto({ title: 'Featured One' })])

      const result = await getFeaturedArticles()

      expect(result[0].title).toBe('Featured One')
    })

    it('returns empty array when no featured articles', async () => {
      getSpy.mockResolvedValueOnce([])

      const result = await getFeaturedArticles()

      expect(result).toHaveLength(0)
    })
  })

  describe('getTrendingArticles', () => {
    it('calls GET /articles/trending', async () => {
      getSpy.mockResolvedValueOnce([makeDetailDto({ isTrending: true })])

      const result = await getTrendingArticles()

      expect(getSpy).toHaveBeenCalledWith('/articles/trending')
      expect(result).toHaveLength(1)
    })

    it('maps trending article fields correctly', async () => {
      getSpy.mockResolvedValueOnce([makeDetailDto({ title: 'Trending', voteCount: 99 })])

      const result = await getTrendingArticles()

      expect(result[0].voteCount).toBe(99)
    })
  })

  describe('getArticleBySlug', () => {
    it('returns a mapped article on success', async () => {
      getSpy.mockResolvedValueOnce(makeDetailDto({ slug: 'test-slug' }))

      const result = await getArticleBySlug('test-slug')

      expect(getSpy).toHaveBeenCalledWith('/articles/test-slug')
      expect(result).not.toBeNull()
      expect(result?.slug).toBe('test-slug')
    })

    it('returns null when API returns 404 error', async () => {
      getSpy.mockRejectedValueOnce(new ApiError('Not Found', 404, '/articles/missing-slug'))

      const result = await getArticleBySlug('missing-slug')

      expect(result).toBeNull()
    })

    it('re-throws non-404 errors', async () => {
      getSpy.mockRejectedValueOnce(new Error('500 Internal Server Error'))

      await expect(getArticleBySlug('any-slug')).rejects.toThrow('500')
    })
  })

  describe('voteForArticle', () => {
    it('calls POST /articles/{id}/vote', async () => {
      postSpy.mockResolvedValueOnce({ articleId: 'abc', voteCount: 11 })

      const result = await voteForArticle('abc')

      expect(postSpy).toHaveBeenCalledWith('/articles/abc/vote')
      expect(result.voteCount).toBe(11)
    })
  })

  describe('getRelatedArticles', () => {
    it('calls GET /articles/{slug}/related', async () => {
      getSpy.mockResolvedValueOnce([makeDetailDto()])

      const result = await getRelatedArticles('test-slug')

      expect(getSpy).toHaveBeenCalledWith('/articles/test-slug/related')
      expect(result).toHaveLength(1)
    })

    it('returns mapped Article objects', async () => {
      getSpy.mockResolvedValueOnce([makeDetailDto({ title: 'Related Article', voteCount: 7 })])

      const result = await getRelatedArticles('test-slug')

      expect(result[0].title).toBe('Related Article')
      expect(result[0].voteCount).toBe(7)
    })

    it('returns empty array on error', async () => {
      getSpy.mockRejectedValueOnce(new Error('Network error'))

      const result = await getRelatedArticles('test-slug')

      expect(result).toEqual([])
    })

    it('returns empty array when API returns no related articles', async () => {
      getSpy.mockResolvedValueOnce([])

      const result = await getRelatedArticles('test-slug')

      expect(result).toHaveLength(0)
    })
  })
})

describe('Article Helper Functions', () => {
  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'Article 1',
      slug: 'article-1',
      shortDescription: 'Description',
      category: 'General',
      tags: ['Tag1', 'Tag2'],
      author: 'Author 1',
      createdDate: '2024-01-15T10:00:00Z',
      updatedDate: '2024-01-15T10:00:00Z',
      voteCount: 10,
      status: 'Published',
      isFeatured: false,
      isTrending: false,
    },
    {
      id: '2',
      title: 'Article 2',
      slug: 'article-2',
      shortDescription: 'Description',
      category: 'Tutorial',
      tags: ['Tag2', 'Tag3'],
      author: 'Author 2',
      createdDate: '2024-01-16T10:00:00Z',
      updatedDate: '2024-01-16T10:00:00Z',
      voteCount: 20,
      status: 'Published',
      isFeatured: true,
      isTrending: false,
    },
    {
      id: '3',
      title: 'Article 3',
      slug: 'article-3',
      shortDescription: 'Description',
      category: 'General',
      tags: ['Tag1', 'Tag4'],
      author: 'Author 1',
      createdDate: '2024-01-17T10:00:00Z',
      updatedDate: '2024-01-17T10:00:00Z',
      voteCount: 30,
      status: 'Published',
      isFeatured: false,
      isTrending: true,
    },
  ]

  describe('getAllCategories', () => {
    it('should extract unique categories from articles', () => {
      const categories = getAllCategories(mockArticles)

      expect(categories).toHaveLength(2)
      expect(categories).toContain('General')
      expect(categories).toContain('Tutorial')
    })

    it('should return sorted categories', () => {
      const categories = getAllCategories(mockArticles)

      expect(categories[0]).toBe('General')
      expect(categories[1]).toBe('Tutorial')
    })

    it('should handle empty array', () => {
      const categories = getAllCategories([])

      expect(categories).toHaveLength(0)
    })

    it('should handle single article', () => {
      const categories = getAllCategories([mockArticles[0]])

      expect(categories).toHaveLength(1)
      expect(categories[0]).toBe('General')
    })

    it('should handle all articles with same category', () => {
      const sameCategory = mockArticles.map((a) => ({
        ...a,
        category: 'General' as const,
      }))
      const categories = getAllCategories(sameCategory)

      expect(categories).toHaveLength(1)
      expect(categories[0]).toBe('General')
    })
  })

  describe('getAllTags', () => {
    it('should extract unique tags from articles', () => {
      const tags = getAllTags(mockArticles)

      expect(tags).toHaveLength(4)
      expect(tags).toContain('Tag1')
      expect(tags).toContain('Tag2')
      expect(tags).toContain('Tag3')
      expect(tags).toContain('Tag4')
    })

    it('should return sorted tags', () => {
      const tags = getAllTags(mockArticles)

      expect(tags[0]).toBe('Tag1')
      expect(tags[1]).toBe('Tag2')
      expect(tags[2]).toBe('Tag3')
      expect(tags[3]).toBe('Tag4')
    })

    it('should handle empty array', () => {
      const tags = getAllTags([])

      expect(tags).toHaveLength(0)
    })

    it('should handle articles with no tags', () => {
      const articlesWithoutTags = mockArticles.map((a) => ({ ...a, tags: [] }))
      const tags = getAllTags(articlesWithoutTags)

      expect(tags).toHaveLength(0)
    })

    it('should handle articles with duplicate tags across articles', () => {
      const tags = getAllTags(mockArticles)

      // Tag2 appears in both article 1 and 2, but should only appear once
      expect(tags.filter((t) => t === 'Tag2')).toHaveLength(1)
    })

    it('should handle articles with single tag', () => {
      const singleTagArticles = mockArticles.map((a) => ({
        ...a,
        tags: ['CommonTag'],
      }))
      const tags = getAllTags(singleTagArticles)

      expect(tags).toHaveLength(1)
      expect(tags[0]).toBe('CommonTag')
    })
  })

  describe('getArticleStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getArticleStats(mockArticles)

      expect(stats.totalArticles).toBe(3)
      expect(stats.totalCategories).toBe(2)
      expect(stats.totalContributors).toBe('2+') // Author 1 and Author 2
    })

    it('should handle articles without authors', () => {
      const articlesWithoutAuthors = mockArticles.map((a) => ({
        ...a,
        author: undefined,
      }))
      const stats = getArticleStats(articlesWithoutAuthors)

      expect(stats.totalArticles).toBe(3)
      expect(stats.totalCategories).toBe(2)
      expect(stats.totalContributors).toBe('15+') // Default fallback
    })

    it('should handle empty array', () => {
      const stats = getArticleStats([])

      expect(stats.totalArticles).toBe(0)
      expect(stats.totalCategories).toBe(0)
      expect(stats.totalContributors).toBe('15+')
    })

    it('should count unique authors only', () => {
      const duplicateAuthors = [
        ...mockArticles,
        { ...mockArticles[0], id: '4', slug: 'article-4' }, // Same author as article 1
      ]
      const stats = getArticleStats(duplicateAuthors)

      expect(stats.totalArticles).toBe(4)
      expect(stats.totalContributors).toBe('2+') // Still only 2 unique authors
    })

    it('should handle single article', () => {
      const stats = getArticleStats([mockArticles[0]])

      expect(stats.totalArticles).toBe(1)
      expect(stats.totalCategories).toBe(1)
      expect(stats.totalContributors).toBe('1+')
    })

    it('should handle mix of articles with and without authors', () => {
      const mixedArticles = [
        mockArticles[0], // Has author
        { ...mockArticles[1], author: undefined }, // No author
        mockArticles[2], // Has author (same as article 0)
      ]
      const stats = getArticleStats(mixedArticles)

      expect(stats.totalArticles).toBe(3)
      expect(stats.totalContributors).toBe('1+') // Only 1 unique author (Author 1)
    })

    it('should calculate categories from diverse set', () => {
      const diverseArticles: Article[] = [
        { ...mockArticles[0], category: 'General' },
        { ...mockArticles[1], category: 'Tutorial' },
        { ...mockArticles[2], category: 'Guide' },
      ]
      const stats = getArticleStats(diverseArticles)

      expect(stats.totalCategories).toBe(3)
    })
  })
})
