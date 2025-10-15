import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ss.gonxt.tech/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    console.log('API Client initialized with base URL:', API_BASE_URL);
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Try both 'accessToken' (new format) and 'token' (legacy format)
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              console.log('🔄 Token expired, attempting refresh...')
              const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'X-Tenant-Code': 'DEMO'
                }
              })
              
              if (refreshResponse.data.success) {
                const newToken = refreshResponse.data.data.token
                console.log('✅ Token refreshed successfully')
                
                // Update stored tokens
                localStorage.setItem('accessToken', newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                
                // Retry the original request
                return this.client(originalRequest)
              }
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
          }
          
          // If refresh fails, redirect to login
          console.log('🚪 Redirecting to login...')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('Making POST request to:', `${API_BASE_URL}${url}`, 'with data:', data);
    const response = await this.client.post<T>(url, data, config)
    console.log('POST response:', response.data);
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async upload<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
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
    return response.data
  }

  async download(url: string, params?: any): Promise<Blob> {
    const response = await this.client.get(url, {
      params,
      responseType: 'blob',
    })
    return response.data
  }
}

export const apiClient = new ApiClient()
