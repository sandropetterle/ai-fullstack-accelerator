/**
 * Mapper Tests
 * Tests bidirectional category mapping and DTO transformations
 */

import { describe, it, expect } from '@jest/globals'
import {
  mapCategoryFromApi,
  mapCategoryToApi,
  mapArticleListDto,
  mapArticleDetailDto,
  mapPaginatedResponse,
} from '../mappers'
import type { ArticleListDto, ArticleDetailDto, PaginatedResponse } from '../types'
import type { ArticleCategory } from '@/lib/types/article'

describe('Category Mapping', () => {
  describe('mapCategoryFromApi', () => {
    it('should map General correctly', () => {
      expect(mapCategoryFromApi('General')).toBe('General')
    })

    it('should map Tutorial correctly', () => {
      expect(mapCategoryFromApi('Tutorial')).toBe('Tutorial')
    })

    it('should map Guide correctly', () => {
      expect(mapCategoryFromApi('Guide')).toBe('Guide')
    })

    it('should map Reference correctly', () => {
      expect(mapCategoryFromApi('Reference')).toBe('Reference')
    })

    it('should map News correctly', () => {
      expect(mapCategoryFromApi('News')).toBe('News')
    })

    it('should default to General for unknown categories', () => {
      expect(mapCategoryFromApi('Unknown')).toBe('General')
    })
  })

  describe('mapCategoryToApi', () => {
    it('should map General correctly', () => {
      expect(mapCategoryToApi('General')).toBe('General')
    })

    it('should map Tutorial correctly', () => {
      expect(mapCategoryToApi('Tutorial')).toBe('Tutorial')
    })

    it('should map Guide correctly', () => {
      expect(mapCategoryToApi('Guide')).toBe('Guide')
    })

    it('should map Reference correctly', () => {
      expect(mapCategoryToApi('Reference')).toBe('Reference')
    })

    it('should map News correctly', () => {
      expect(mapCategoryToApi('News')).toBe('News')
    })

    it('should default to General for unknown categories', () => {
      expect(mapCategoryToApi('Unknown' as ArticleCategory)).toBe('General')
    })
  })

  describe('Bidirectional Mapping', () => {
    const apiCategories = ['General', 'Tutorial', 'Guide', 'Reference', 'News']

    it('should be reversible for all categories', () => {
      apiCategories.forEach((apiCat) => {
        const uiCat = mapCategoryFromApi(apiCat)
        const backToApi = mapCategoryToApi(uiCat)
        expect(backToApi).toBe(apiCat)
      })
    })
  })
})

describe('mapArticleListDto', () => {
  const createMockDto = (): ArticleListDto => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Article',
    slug: 'test-article',
    shortDescription: 'A test article',
    category: 'Tutorial',
    tags: ['Testing', 'Sample'],
    author: 'Test Author',
    createdDate: '2024-01-15T10:00:00Z',
    updatedDate: '2024-01-20T14:30:00Z',
    voteCount: 42,
    status: 'published',
    isFeatured: true,
    isTrending: false,
  })

  it('should map all fields correctly', () => {
    const dto = createMockDto()
    const result = mapArticleListDto(dto)

    expect(result.id).toBe(dto.id)
    expect(result.title).toBe(dto.title)
    expect(result.slug).toBe(dto.slug)
    expect(result.shortDescription).toBe(dto.shortDescription)
    expect(result.tags).toEqual(dto.tags)
    expect(result.author).toBe(dto.author)
    expect(result.createdDate).toBe(dto.createdDate)
    expect(result.updatedDate).toBe(dto.updatedDate)
    expect(result.voteCount).toBe(dto.voteCount)
    expect(result.status).toBe(dto.status)
    expect(result.isFeatured).toBe(dto.isFeatured)
    expect(result.isTrending).toBe(dto.isTrending)
  })

  it('should map category correctly', () => {
    const dto = createMockDto()
    dto.category = 'Guide'

    const result = mapArticleListDto(dto)

    expect(result.category).toBe('Guide')
  })

  it('should handle null author', () => {
    const dto = createMockDto()
    dto.author = null

    const result = mapArticleListDto(dto)

    expect(result.author).toBeUndefined()
  })

  it('should map all category types correctly', () => {
    const dto = createMockDto()

    const categoryMappings = [
      { api: 'General', ui: 'General' },
      { api: 'Tutorial', ui: 'Tutorial' },
      { api: 'Guide', ui: 'Guide' },
      { api: 'Reference', ui: 'Reference' },
      { api: 'News', ui: 'News' },
    ]

    categoryMappings.forEach(({ api, ui }) => {
      dto.category = api
      const result = mapArticleListDto(dto)
      expect(result.category).toBe(ui)
    })
  })
})

describe('mapArticleDetailDto', () => {
  const createMockDetailDto = (): ArticleDetailDto => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Article',
    slug: 'test-article',
    shortDescription: 'A test article',
    fullContent: '# Full Content\n\nDetailed markdown content here.',
    category: 'Guide',
    tags: ['Testing', 'Sample'],
    author: 'Test Author',
    createdDate: '2024-01-15T10:00:00Z',
    updatedDate: '2024-01-20T14:30:00Z',
    voteCount: 42,
    status: 'published',
    isFeatured: true,
    isTrending: false,
  })

  it('should map all fields including fullContent', () => {
    const dto = createMockDetailDto()
    const result = mapArticleDetailDto(dto)

    expect(result.id).toBe(dto.id)
    expect(result.title).toBe(dto.title)
    expect(result.slug).toBe(dto.slug)
    expect(result.shortDescription).toBe(dto.shortDescription)
    expect(result.fullContent).toBe(dto.fullContent)
    expect(result.tags).toEqual(dto.tags)
    expect(result.author).toBe(dto.author)
    expect(result.createdDate).toBe(dto.createdDate)
    expect(result.updatedDate).toBe(dto.updatedDate)
    expect(result.voteCount).toBe(dto.voteCount)
    expect(result.status).toBe(dto.status)
    expect(result.isFeatured).toBe(dto.isFeatured)
    expect(result.isTrending).toBe(dto.isTrending)
  })

  it('should map category correctly', () => {
    const dto = createMockDetailDto()
    dto.category = 'Tutorial'

    const result = mapArticleDetailDto(dto)

    expect(result.category).toBe('Tutorial')
  })

  it('should handle null fullContent', () => {
    const dto = createMockDetailDto()
    dto.fullContent = null

    const result = mapArticleDetailDto(dto)

    expect(result.fullContent).toBeUndefined()
  })

  it('should handle null author', () => {
    const dto = createMockDetailDto()
    dto.author = null

    const result = mapArticleDetailDto(dto)

    expect(result.author).toBeUndefined()
  })
})

describe('mapPaginatedResponse', () => {
  const createMockResponse = (): PaginatedResponse<ArticleListDto> => ({
    items: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Article 1',
        slug: 'article-1',
        shortDescription: 'First article',
        category: 'General',
        tags: ['Tag1'],
        author: 'Author 1',
        createdDate: '2024-01-15T10:00:00Z',
        updatedDate: '2024-01-15T10:00:00Z',
        voteCount: 10,
        status: 'published',
        isFeatured: false,
        isTrending: false,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Article 2',
        slug: 'article-2',
        shortDescription: 'Second article',
        category: 'Tutorial',
        tags: ['Tag2'],
        author: 'Author 2',
        createdDate: '2024-01-16T10:00:00Z',
        updatedDate: '2024-01-16T10:00:00Z',
        voteCount: 20,
        status: 'published',
        isFeatured: true,
        isTrending: false,
      },
    ],
    totalCount: 50,
    currentPage: 2,
    pageSize: 2,
    totalPages: 25,
  })

  it('should map all pagination fields', () => {
    const response = createMockResponse()
    const result = mapPaginatedResponse(response)

    expect(result.articles).toHaveLength(2)
    expect(result.totalCount).toBe(50)
    expect(result.currentPage).toBe(2)
    expect(result.totalPages).toBe(25)
  })

  it('should map all articles with correct category', () => {
    const response = createMockResponse()
    const result = mapPaginatedResponse(response)

    expect(result.articles[0].category).toBe('General')
    expect(result.articles[1].category).toBe('Tutorial')
  })

  it('should calculate hasNextPage correctly', () => {
    const response = createMockResponse()

    // Page 2 of 25 should have next page
    response.currentPage = 2
    response.totalPages = 25
    expect(mapPaginatedResponse(response).hasNextPage).toBe(true)

    // Last page should not have next page
    response.currentPage = 25
    expect(mapPaginatedResponse(response).hasNextPage).toBe(false)
  })

  it('should calculate hasPreviousPage correctly', () => {
    const response = createMockResponse()

    // First page should not have previous page
    response.currentPage = 1
    expect(mapPaginatedResponse(response).hasPreviousPage).toBe(false)

    // Page 2 should have previous page
    response.currentPage = 2
    expect(mapPaginatedResponse(response).hasPreviousPage).toBe(true)
  })

  it('should handle empty items array', () => {
    const response = createMockResponse()
    response.items = []
    response.totalCount = 0
    response.currentPage = 1
    response.totalPages = 0

    const result = mapPaginatedResponse(response)

    expect(result.articles).toHaveLength(0)
    expect(result.totalCount).toBe(0)
    expect(result.hasNextPage).toBe(false)
    expect(result.hasPreviousPage).toBe(false)
  })
})
