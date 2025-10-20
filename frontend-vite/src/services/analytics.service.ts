import { ApiService } from './api.service'

export interface DashboardMetrics {
  sales: SalesMetrics
  visits: VisitMetrics
  agents: AgentMetrics
  customers: CustomerMetrics
  products: ProductMetrics
  campaigns: CampaignMetrics
}

export interface SalesMetrics {
  total_revenue: number
  total_orders: number
  average_order_value: number
  revenue_growth: number
  orders_growth: number
  top_products: ProductSales[]
  sales_by_period: TimeSeries[]
  sales_by_region: RegionSales[]
}

export interface VisitMetrics {
  total_visits: number
  successful_visits: number
  visit_success_rate: number
  average_visit_duration: number
  visits_by_purpose: PurposeBreakdown[]
  visits_by_period: TimeSeries[]
}

export interface AgentMetrics {
  total_agents: number
  active_agents: number
  top_performers: AgentPerformance[]
  performance_distribution: PerformanceDistribution[]
  agent_activities: ActivityBreakdown[]
}

export interface CustomerMetrics {
  total_customers: number
  active_customers: number
  new_customers: number
  customer_retention_rate: number
  customer_lifetime_value: number
  customers_by_type: TypeBreakdown[]
}

export interface ProductMetrics {
  total_products: number
  products_sold: number
  inventory_turnover: number
  top_selling_products: ProductSales[]
  slow_moving_products: ProductSales[]
  stock_levels: StockLevel[]
}

export interface CampaignMetrics {
  total_campaigns: number
  active_campaigns: number
  campaign_roi: number
  total_impressions: number
  conversion_rate: number
  campaign_performance: CampaignPerformance[]
}

export interface TimeSeries {
  date: string
  value: number
  label?: string
}

export interface ProductSales {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
  growth_rate: number
}

export interface RegionSales {
  region_id: string
  region_name: string
  revenue: number
  orders: number
  agents: number
}

export interface PurposeBreakdown {
  purpose: string
  count: number
  percentage: number
}

export interface AgentPerformance {
  agent_id: string
  agent_name: string
  total_sales: number
  total_visits: number
  success_rate: number
  commission_earned: number
}

export interface PerformanceDistribution {
  range: string
  count: number
  percentage: number
}

export interface ActivityBreakdown {
  activity_type: string
  count: number
  percentage: number
}

export interface TypeBreakdown {
  type: string
  count: number
  percentage: number
}

export interface StockLevel {
  product_id: string
  product_name: string
  current_stock: number
  minimum_stock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface CampaignPerformance {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  conversions: number
  roi: number
}

export interface AnalyticsFilter {
  start_date?: string
  end_date?: string
  region_id?: string
  area_id?: string
  agent_id?: string
  product_id?: string
  customer_type?: string
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface ReportConfig {
  type: 'sales' | 'visits' | 'agents' | 'customers' | 'products' | 'campaigns' | 'comprehensive'
  format: 'pdf' | 'excel' | 'csv'
  filters: AnalyticsFilter
  include_charts: boolean
  include_summary: boolean
}

class AnalyticsService extends ApiService {
  private baseUrl = '/analytics'

  async getDashboardMetrics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/dashboard?${params.toString()}`)
    return response.data
  }

  async getDashboardOverview(filter: AnalyticsFilter = {}) {
    return this.getDashboardMetrics(filter)
  }

  async getRecentActivity(options: { limit?: number } = {}) {
    const params = new URLSearchParams()
    if (options.limit) {
      params.append('limit', String(options.limit))
    }

    const response = await this.get(`${this.baseUrl}/recent-activity?${params.toString()}`)
    return response.data
  }

  async getSalesAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/sales?${params.toString()}`)
    return response.data
  }

  async getVisitAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/visits?${params.toString()}`)
    return response.data
  }

  async getAgentAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/agents?${params.toString()}`)
    return response.data
  }

  async getCustomerAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/customers?${params.toString()}`)
    return response.data
  }

  async getProductAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/products?${params.toString()}`)
    return response.data
  }

  async getCampaignAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/campaigns?${params.toString()}`)
    return response.data
  }

  async getRevenueAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/revenue?${params.toString()}`)
    return response.data
  }

  async getPerformanceAnalytics(filter: AnalyticsFilter = {}) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/performance?${params.toString()}`)
    return response.data
  }

  async generateReport(config: ReportConfig) {
    const response = await this.post(`${this.baseUrl}/reports`, config, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-report-${Date.now()}.${config.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async getRealtimeMetrics() {
    const response = await this.get(`${this.baseUrl}/realtime`)
    return response.data
  }

  async getComparativeAnalytics(filter: AnalyticsFilter & { compare_period?: string }) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/comparative?${params.toString()}`)
    return response.data
  }

  async getForecastAnalytics(filter: AnalyticsFilter & { forecast_period?: number }) {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await this.get(`${this.baseUrl}/forecast?${params.toString()}`)
    return response.data
  }

  async getCustomAnalytics(query: string, filter: AnalyticsFilter = {}) {
    const response = await this.post(`${this.baseUrl}/custom`, {
      query,
      filter
    })
    return response.data
  }
}

export const analyticsService = new AnalyticsService()