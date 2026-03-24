/**
 * Base HTTP Client
 * Generic fetch wrapper with timeout, error handling, and base URL configuration.
 *
 * Token forwarding: pass `token` in options to attach an Authorization: Bearer header.
 * This keeps the client provider-agnostic — the caller (server component via auth(),
 * or client component via useSession()) obtains the token and passes it in.
 */

import { apiConfig } from './config'
import { handleApiError } from './error'

type RequestOptions = {
  timeout?: number
  /** Access token to forward as Authorization: Bearer {token} */
  token?: string
}

/**
 * Creates an AbortSignal that triggers after the specified timeout
 */
function createTimeoutSignal(timeout: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller.signal
}

/**
 * Builds request headers, optionally including an Authorization bearer token.
 */
function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Generic GET request
 */
async function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const url = `${apiConfig.baseUrl}${endpoint}`
  const timeout = options?.timeout || apiConfig.timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(options?.token),
      credentials: 'include',
      signal: createTimeoutSignal(timeout),
    })

    if (!response.ok) {
      await handleApiError(response, endpoint)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${endpoint}`)
    }
    throw error
  }
}

/**
 * Generic POST request
 */
async function post<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${apiConfig.baseUrl}${endpoint}`
  const timeout = options?.timeout || apiConfig.timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(options?.token),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal: createTimeoutSignal(timeout),
    })

    if (!response.ok) {
      await handleApiError(response, endpoint)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${endpoint}`)
    }
    throw error
  }
}

/**
 * Generic PUT request
 */
async function put<T>(
  endpoint: string,
  body: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${apiConfig.baseUrl}${endpoint}`
  const timeout = options?.timeout || apiConfig.timeout

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: buildHeaders(options?.token),
      credentials: 'include',
      body: JSON.stringify(body),
      signal: createTimeoutSignal(timeout),
    })

    if (!response.ok) {
      await handleApiError(response, endpoint)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${endpoint}`)
    }
    throw error
  }
}

/**
 * Generic DELETE request
 */
async function del(endpoint: string, options?: RequestOptions): Promise<void> {
  const url = `${apiConfig.baseUrl}${endpoint}`
  const timeout = options?.timeout || apiConfig.timeout

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(options?.token),
      credentials: 'include',
      signal: createTimeoutSignal(timeout),
    })

    if (!response.ok) {
      await handleApiError(response, endpoint)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${endpoint}`)
    }
    throw error
  }
}

/**
 * Exported API client with HTTP methods
 */
export const apiClient = {
  get,
  post,
  put,
  delete: del,
}
