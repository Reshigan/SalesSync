import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))
vi.mock('../../config/api.config', () => ({ API_CONFIG: { BASE_URL: 'http://localhost:3000', ENDPOINTS: { DASHBOARD: { BASE: '/dashboard', STATS: '/dashboard/stats' } } } }))

describe('Dashboard Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getStats', () => {
    it('should fetch dashboard stats', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { totalSales: 100000, totalOrders: 500 } } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getStats()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getStats()).rejects.toThrow()
    })
    it('should handle unauthorized', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 401 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getStats()).rejects.toBeDefined()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await expect(dashboardService.getStats()).rejects.toBeDefined()
    })
  })

  describe('getRevenueTrends', () => {
    it('should fetch revenue trends', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [{ date: '2024-01', revenue: 5000 }] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getRevenueTrends()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with period param', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { dashboardService } = await import('../../services/dashboard.service')
      await dashboardService.getRevenueTrends('week')
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should return empty array on error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getRevenueTrends()
      expect(result).toEqual([])
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
    it('should return empty array on error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getRecentActivity()
      expect(result).toEqual([])
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
    it('should return empty array on error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getTopProducts()
      expect(result).toEqual([])
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
    it('should return empty array on error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getTopCustomers()
      expect(result).toEqual([])
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
      await dashboardService.getSalesPerformance('monthly')
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should return empty array on error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { dashboardService } = await import('../../services/dashboard.service')
      const result = await dashboardService.getSalesPerformance()
      expect(result).toEqual([])
    })
  })
})
