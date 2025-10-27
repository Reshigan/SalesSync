/**
 * API Client Export
 * Provides a simplified API client for direct import
 */

import { apiClient, apiService, ApiService } from './api.service'

// Export the axios client instance for direct use
export default apiClient

// Also export named exports for flexibility
export { apiClient, apiService, ApiService }

// Convenience methods for common operations
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
}
