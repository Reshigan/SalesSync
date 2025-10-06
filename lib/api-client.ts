import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiError {
  error: string
  message: string
  statusCode?: number
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
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
        const token = localStorage.getItem('auth_token')
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
      (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
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

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password })
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  }

  async logout() {
    try {
      await this.post('/auth/logout')
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }

  async refreshToken() {
    const response = await this.post('/auth/refresh')
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
    }
    return response
  }

  // Customer methods
  async getCustomers(params?: {
    page?: number
    limit?: number
    customerType?: string
    city?: string
    search?: string
  }) {
    return this.get('/customers', { params })
  }

  async getCustomer(id: string) {
    return this.get(`/customers/${id}`)
  }

  async createCustomer(data: any) {
    return this.post('/customers', data)
  }

  async updateCustomer(id: string, data: any) {
    return this.put(`/customers/${id}`, data)
  }

  async deleteCustomer(id: string) {
    return this.delete(`/customers/${id}`)
  }

  // Product methods
  async getProducts(params?: {
    page?: number
    limit?: number
    category?: string
    brand?: string
    search?: string
    isActive?: boolean
  }) {
    return this.get('/products', { params })
  }

  async getProduct(id: string) {
    return this.get(`/products/${id}`)
  }

  async createProduct(data: any) {
    return this.post('/products', data)
  }

  async updateProduct(id: string, data: any) {
    return this.put(`/products/${id}`, data)
  }

  async deleteProduct(id: string) {
    return this.delete(`/products/${id}`)
  }

  async getProductCategories() {
    return this.get('/products/meta/categories')
  }

  async getProductBrands() {
    return this.get('/products/meta/brands')
  }

  // Order methods
  async getOrders(params?: {
    page?: number
    limit?: number
    status?: string
    customerId?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) {
    return this.get('/orders', { params })
  }

  async getOrder(id: string) {
    return this.get(`/orders/${id}`)
  }

  async createOrder(data: any) {
    return this.post('/orders', data)
  }

  async updateOrderStatus(id: string, status: string) {
    return this.patch(`/orders/${id}/status`, { status })
  }

  async getOrderStats() {
    return this.get('/orders/stats/overview')
  }

  // User methods
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) {
    return this.get('/users', { params })
  }

  async getUser(id: string) {
    return this.get(`/users/${id}`)
  }

  async createUser(data: any) {
    return this.post('/users', data)
  }

  async updateUser(id: string, data: any) {
    return this.put(`/users/${id}`, data)
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`)
  }

  // Analytics methods
  async getDashboardStats() {
    return this.get('/analytics/dashboard')
  }

  async getSalesAnalytics(params?: {
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month'
  }) {
    return this.get('/analytics/sales', { params })
  }

  async getInventoryAnalytics() {
    return this.get('/analytics/inventory')
  }

  // Inventory methods
  async getInventory(params?: {
    page?: number
    limit?: number
    location?: string
    lowStock?: boolean
  }) {
    return this.get('/inventory', { params })
  }

  async updateInventory(id: string, data: any) {
    return this.put(`/inventory/${id}`, data)
  }

  async getInventoryMovements(params?: {
    page?: number
    limit?: number
    productId?: string
    type?: string
  }) {
    return this.get('/inventory/movements', { params })
  }

  // Commission methods
  async getCommissions(params?: {
    page?: number
    limit?: number
    userId?: string
    period?: string
  }) {
    return this.get('/commissions', { params })
  }

  async calculateCommissions(data: any) {
    return this.post('/commissions/calculate', data)
  }

  // Van Sales methods
  async getVanSalesLoads(params?: {
    page?: number
    limit?: number
    vanId?: string
    status?: string
  }) {
    return this.get('/van-sales/loads', { params })
  }

  async createVanSalesLoad(data: any) {
    return this.post('/van-sales/loads', data)
  }

  async getVanSalesReconciliation(params?: {
    page?: number
    limit?: number
    loadId?: string
  }) {
    return this.get('/van-sales/reconciliation', { params })
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number
    limit?: number
    read?: boolean
  }) {
    return this.get('/notifications', { params })
  }

  async markNotificationRead(id: string) {
    return this.patch(`/notifications/${id}/read`)
  }

  async markAllNotificationsRead() {
    return this.patch('/notifications/read-all')
  }

  // Bulk operations
  async bulkImport(file: File, entity: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity', entity)
    return this.upload('/bulk/import', formData)
  }

  async bulkExport(entity: string, filters?: any) {
    return this.download(`/bulk/export/${entity}`, filters)
  }

  async bulkUpdate(entity: string, updates: any[]) {
    return this.post(`/bulk/update/${entity}`, { updates })
  }

  async bulkDelete(entity: string, ids: string[]) {
    return this.post(`/bulk/delete/${entity}`, { ids })
  }
}

export const apiClient = new ApiClient()

// Helper function for handling API errors with toast notifications
export const handleApiError = (error: any, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error)
  
  const message = error?.response?.data?.message || error?.message || defaultMessage
  toast.error(message)
}

// Helper function for success notifications
export const handleApiSuccess = (message: string) => {
  toast.success(message)
}

// Export types
export type { ApiResponse, ApiError }
