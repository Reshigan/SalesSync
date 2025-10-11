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

export interface Prediction {
  productId: string
  productName: string
  productSku: string
  category: string
  predictedSales: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  change: string
  historicalAverage: number
  dataPoints: number
}

export interface PredictionsResponse {
  predictions: Prediction[]
  summary: {
    totalPredictions: number
    avgAccuracy: number
    upTrends: number
    downTrends: number
    stableTrends: number
  }
  model: {
    version: string
    algorithm: string
    lastTrained: string
    dataPoints: number
    predictionPeriod: string
  }
  generatedAt: string
}

export interface CustomReport {
  id: string
  name: string
  description: string
  category: string
  type: 'summary' | 'detailed' | 'analysis' | 'operational'
  parameters: string[]
  createdAt: string
  isTemplate: boolean
}

export interface CustomReportsResponse {
  reports: CustomReport[]
  categories: string[]
  totalReports: number
}

export interface ReportParameters {
  dateRange?: {
    start: string
    end: string
  }
  groupBy?: 'day' | 'week' | 'month'
  categoryFilter?: string
  agentFilter?: string
  locationFilter?: string
  includeProducts?: boolean
  includeInventory?: boolean
  includeCommissions?: boolean
  includeInactive?: boolean
  lowStockOnly?: boolean
  segmentBy?: 'revenue' | 'activity' | 'route'
}

export interface GeneratedReport {
  reportId: string
  reportName: string
  generatedAt: string
  parameters: ReportParameters
  data: any
}

class AnalyticsService {
  private baseUrl = '/analytics'

  async getDashboardMetrics(filters?: AnalyticsFilters): Promise<DashboardMetrics> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/dashboard${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url) as { data: DashboardMetrics }
    return response.data
  }

  async getSalesAnalytics(filters?: AnalyticsFilters): Promise<SalesAnalytics> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.groupBy) params.append('groupBy', filters.groupBy)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/sales${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url) as { data: SalesAnalytics }
    return response.data
  }

  async getProductPerformance(filters?: AnalyticsFilters): Promise<ProductPerformanceResponse> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/products${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url) as { data: any }
    return response.data
  }

  async getCustomerAnalytics(filters?: AnalyticsFilters) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/customers${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url) as { data: any }
    return response.data
  }

  async getAgentPerformance(filters?: AnalyticsFilters) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/agents${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url) as { data: any }
    return response.data
  }

  async getFieldAgentAnalytics(filters?: AnalyticsFilters) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/field-agents${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url) as { data: any }
    return response.data
  }

  async getAIInsights(): Promise<AIInsightsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/ai-insights`) as { data: AIInsightsResponse }
    return response.data
  }

  async getPredictions(period: string = '7', type: string = 'sales'): Promise<PredictionsResponse> {
    const params = new URLSearchParams()
    params.append('period', period)
    params.append('type', type)
    
    const queryString = params.toString()
    const url = `${this.baseUrl}/predictions?${queryString}`
    
    const response = await apiClient.get(url) as { data: any }
    return response.data
  }

  // Custom Reports Methods
  async getCustomReports(): Promise<CustomReportsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/custom-reports`) as { data: CustomReportsResponse }
    return response.data
  }

  async generateCustomReport(reportId: string, parameters: ReportParameters = {}): Promise<GeneratedReport> {
    const response = await apiClient.post(`${this.baseUrl}/custom-reports/generate`, {
      reportId,
      parameters
    }) as { data: GeneratedReport }
    return response.data
  }

  async exportCustomReport(reportId: string, parameters: ReportParameters = {}, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/custom-reports/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        reportId,
        parameters,
        format
      })
    })

    if (!response.ok) {
      throw new Error('Failed to export report')
    }

    return response.blob()
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

  // Helper method to get report parameter defaults
  getReportParameterDefaults(): ReportParameters {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    return {
      dateRange: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString()
      },
      groupBy: 'day',
      includeProducts: true,
      includeInventory: false,
      includeCommissions: false,
      includeInactive: false,
      lowStockOnly: false,
      segmentBy: 'revenue'
    }
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService