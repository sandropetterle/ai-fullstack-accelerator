/**
 * HTTP Client Tests
 * Tests base HTTP client functionality: GET, POST, PUT, DELETE methods,
 * timeout handling, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { apiClient } from '../client'
import { ApiError } from '../error'

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      const result = await apiClient.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should include credentials in GET request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })

    it('should throw error for non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError)
    })

    it('should include abort signal for timeout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.get('/test', { timeout: 5000 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request with body', async () => {
      const mockData = { id: 1, name: 'Test' }
      const requestBody = { name: 'New Item' }
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      const result = await apiClient.post('/test', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should handle POST request without body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.post('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      )
    })

    it('should handle 204 No Content response', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      const result = await apiClient.post('/test')

      expect(result).toEqual({})
    })

    it('should throw error for failed POST request', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid data' }),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await expect(apiClient.post('/test', {})).rejects.toThrow(ApiError)
    })

    it('should include abort signal in POST request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.post('/test', {}, { timeout: 5000 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' }
      const requestBody = { name: 'Updated Item' }
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      const result = await apiClient.put('/test/1', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should throw error for failed PUT request', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await expect(apiClient.put('/test/1', {})).rejects.toThrow(ApiError)
    })

    it('should include abort signal in PUT request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.put('/test/1', {}, { timeout: 5000 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = {
        ok: true,
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.delete('/test/1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should throw error for failed DELETE request', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Not authorized' }),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await expect(apiClient.delete('/test/1')).rejects.toThrow(ApiError)
    })

    it('should include abort signal in DELETE request', async () => {
      const mockResponse = {
        ok: true,
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.delete('/test/1', { timeout: 5000 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should throw ApiError with 429 status on rate limit response', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      const error = await apiClient.get('/test').catch((e) => e)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(429)
      expect(error.message).toMatch(/too many requests/i)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })

    it('should preserve original error if not timeout', async () => {
      const customError = new Error('Custom error')
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        customError
      )

      await expect(apiClient.get('/test')).rejects.toThrow('Custom error')
    })
  })

  describe('URL construction', () => {
    it('should construct correct URL with base URL', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      } as Response

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        mockResponse
      )

      await apiClient.get('/articles/test-slug')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5255/api/articles/test-slug',
        expect.any(Object)
      )
    })
  })
})
