import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Dashboard Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getDashboardData', () => {
    it('should fetch dashboard data', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { totalSales: 100000, totalOrders: 500 } } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getDashboardData()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getDashboardData()).rejects.toThrow()
    })
    it('should handle unauthorized', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 401 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getDashboardData()).rejects.toBeDefined()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getDashboardData()).rejects.toBeDefined()
    })
  })

  describe('getSalesAnalytics', () => {
    it('should fetch sales analytics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { daily: [], weekly: [], monthly: [] } } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getSalesAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch sales analytics with date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: {} } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await dashboardService.getSalesAnalytics({ startDate: '2024-01-01', endDate: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getSalesAnalytics()).rejects.toBeDefined()
    })
  })

  describe('getKPIs', () => {
    it('should fetch KPIs', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { revenue: 1000000, orders: 500 } } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getKPIs()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getKPIs()).rejects.toBeDefined()
    })
  })

  describe('getRecentActivity', () => {
    it('should fetch recent activity', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getRecentActivity()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getRecentActivity()).rejects.toBeDefined()
    })
  })

  describe('getTopProducts', () => {
    it('should fetch top products', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getTopProducts()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getTopProducts()).rejects.toBeDefined()
    })
  })

  describe('getTopCustomers', () => {
    it('should fetch top customers', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getTopCustomers()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getTopCustomers()).rejects.toBeDefined()
    })
  })

  describe('getSalesPerformance', () => {
    it('should fetch sales performance', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getSalesPerformance()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with period filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await dashboardService.getSalesPerformance({ period: 'monthly' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getSalesPerformance()).rejects.toBeDefined()
    })
  })
})
