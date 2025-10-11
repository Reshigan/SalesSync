import { apiClient } from '@/lib/api-client'

export interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  completedOrders: number
  activeCustomers: number
  productsCount: number
  pendingOrders: number
  revenueTrend: Array<{
    date: string
    revenue: number
  }>
  completionRate: number
}

export interface SalesAnalytics {
  totalSales: number
  totalOrders: number
  totalQuantity: number
  averageOrderValue: number
  salesByProduct: Array<{
    product: string
    quantity: number
    revenue: number
  }>
  salesByAgent: Array<{
    agent: string
    orders: number
    revenue: number
  }>
  salesByCustomer: Array<{
    customer: string
    orders: number
    revenue: number
  }>
}

export interface ProductAnalytics {
  id: string
  name: string
  sku: string
  category: string
  quantitySold: number
  revenue: number
  orderCount: number
  averageQuantityPerOrder: number
}

export interface CategoryPerformance {
  [category: string]: {
    quantity: number
    revenue: number
    products: number
  }
}

export interface ProductPerformanceResponse {
  products: ProductAnalytics[]
  categoryPerformance: CategoryPerformance
  topProducts: ProductAnalytics[]
  lowPerformingProducts: ProductAnalytics[]
}

export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}

export interface AIInsight {
  id: string
  type: 'success' | 'warning' | 'danger' | 'info'
  category: 'inventory' | 'sales' | 'performance' | 'customer'
  title: string
  message: string
  action: string
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export interface AIInsightsResponse {
  insights: AIInsight[]
  summary: {
    total: number
    high: number
    medium: number
    low: number
    categories: {
      inventory: number
      sales: number
      performance: number
      customer: number
    }
  }
}

class AnalyticsService {
  private baseUrl = '/analytics'

  async getDashboardMetrics(filters?: AnalyticsFilters): Promise<DashboardMetrics> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/dashboard${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  }

  async getSalesAnalytics(filters?: AnalyticsFilters): Promise<SalesAnalytics> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.groupBy) params.append('groupBy', filters.groupBy)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/sales${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  }

  async getProductPerformance(filters?: AnalyticsFilters): Promise<ProductPerformanceResponse> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/products${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  }

  async getCustomerAnalytics(filters?: AnalyticsFilters) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/customers${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  }

  async getAgentPerformance(filters?: AnalyticsFilters) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/agents${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  }

  async getFieldAgentAnalytics(filters?: AnalyticsFilters) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/field-agents${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return response.data
  }

  async getAIInsights(): Promise<AIInsightsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/ai-insights`)
    return response.data
  }

  // Helper method to get date range presets
  getDateRangePreset(preset: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'ytd'): AnalyticsFilters {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (preset) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString()
        }
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 86400000)
        return {
          startDate: yesterday.toISOString(),
          endDate: today.toISOString()
        }
      case '7d':
        return {
          startDate: new Date(today.getTime() - 7 * 86400000).toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString()
        }
      case '30d':
        return {
          startDate: new Date(today.getTime() - 30 * 86400000).toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString()
        }
      case '90d':
        return {
          startDate: new Date(today.getTime() - 90 * 86400000).toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString()
        }
      case 'ytd':
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString()
        }
      default:
        return {}
    }
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService