/**
 * Dashboard Service
 * Handles dashboard statistics and data aggregation
 */

import { API_CONFIG } from '../config/api.config'
import { apiClient } from './api.service'

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  previousRevenue: number
  previousOrders: number
  previousCustomers: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
}

export interface RevenueTrend {
  date: string
  revenue: number
  orders: number
}

export interface SalesByCategory {
  category: string
  sales: number
  percentage: number
}

export interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
  quantity: number
}

export interface TopCustomer {
  id: string
  name: string
  orders: number
  revenue: number
}

class DashboardService {
  private readonly baseUrl = '/dashboard'

  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      throw error
    }
  }

  async getRevenueTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<RevenueTrend[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/revenue-trends`, {
        params: { period }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch revenue trends:', error)
      return []
    }
  }

  async getSalesByCategory(): Promise<SalesByCategory[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/sales-by-category`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch sales by category:', error)
      return []
    }
  }

  async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/top-products`, {
        params: { limit }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch top products:', error)
      return []
    }
  }

  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/top-customers`, {
        params: { limit }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch top customers:', error)
      return []
    }
  }

  async getOrderStatusDistribution(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/order-status`)
      return response.data.data || {}
    } catch (error) {
      console.error('Failed to fetch order status distribution:', error)
      return {}
    }
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/recent-activity`, {
        params: { limit }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      return []
    }
  }

  async getSalesPerformance(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/sales-performance`, {
        params: { period }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch sales performance:', error)
      return []
    }
  }

  async getInventoryOverview(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/inventory-overview`)
      return response.data.data || {}
    } catch (error) {
      console.error('Failed to fetch inventory overview:', error)
      return {}
    }
  }
}

export const dashboardService = new DashboardService()
