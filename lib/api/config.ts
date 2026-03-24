/**
 * API Configuration
 * Centralized configuration for backend API communication
 */

export const apiConfig = {
  /**
   * Base URL for the backend API
   * Default: http://localhost:5255/api
   */
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5255/api',

  /**
   * Request timeout in milliseconds
   * Default: 30 seconds
   */
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
}
