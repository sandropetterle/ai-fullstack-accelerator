/**
 * API Error Handling
 * Custom error class and error handling utilities for API requests
 */

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Handles API error responses and throws appropriate ApiError.
 * 401 and 403 are surfaced with specific messages so callers can
 * redirect to login or show permission-denied UI.
 */
export async function handleApiError(
  response: Response,
  endpoint: string
): Promise<never> {
  if (response.status === 401) {
    throw new ApiError('Your session has expired. Please sign in again.', 401, endpoint)
  }

  if (response.status === 403) {
    throw new ApiError(
      'You do not have permission to perform this action.',
      403,
      endpoint
    )
  }

  if (response.status === 429) {
    throw new ApiError(
      'Too many requests. Please wait a moment and try again.',
      429,
      endpoint
    )
  }

  let errorMessage = `API request failed: ${response.statusText}`

  try {
    const errorData = await response.json()
    if (errorData.message) {
      errorMessage = errorData.message
    } else if (errorData.detail) {
      errorMessage = errorData.detail
    }
  } catch {
    // If JSON parsing fails, use default error message
  }

  throw new ApiError(errorMessage, response.status, endpoint)
}
