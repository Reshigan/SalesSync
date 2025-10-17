import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getAuthToken } from '../store/auth.store'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'
const API_TIMEOUT = 30000 // 30 seconds

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor to add auth token and tenant header
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add tenant header for multi-tenant support
    config.headers['X-Tenant-Code'] = 'demo'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const { useAuthStore } = await import('../store/auth.store')
        await useAuthStore.getState().refreshToken()
        
        // Retry original request with new token
        const token = getAuthToken()
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        const { useAuthStore } = await import('../store/auth.store')
        useAuthStore.getState().logout()
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR'
    
    return Promise.reject({
      message: errorMessage,
      code: errorCode,
      status: error.response?.status,
      data: error.response?.data,
    })
  }
)

// Generic API service class
export class ApiService {
  protected client: AxiosInstance

  constructor() {
    this.client = apiClient
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config)
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }

  // Upload file
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    })

    // Create download link
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
}

// Export default instance
export const apiService = new ApiService()

// Utility functions
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  return searchParams.toString()
}

export const buildUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) return baseUrl
  
  const queryString = buildQueryString(params)
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Error handling utilities
export const isApiError = (error: any): boolean => {
  return error && typeof error === 'object' && 'message' in error
}

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export const getErrorCode = (error: any): string => {
  if (isApiError(error) && error.code) {
    return error.code
  }
  
  return 'UNKNOWN_ERROR'
}

// Request/Response logging (development only)
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
    })
    return config
  })

  apiClient.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
        data: response.data,
      })
      return response
    },
    (error) => {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, {
        error: error.response?.data || error.message,
      })
      return Promise.reject(error)
    }
  )
}