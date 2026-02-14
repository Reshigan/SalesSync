import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Analytics Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getSalesAnalytics', () => {
    it('should fetch sales analytics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { totalSales: 100000 } } })
      const { analyticsService } = await import('../../services/analytics.service')
      const result = await analyticsService.getSalesAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: {} } })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.getSalesAnalytics({ startDate: '2024-01-01', endDate: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with period filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: {} } })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.getSalesAnalytics({ period: 'monthly' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getSalesAnalytics()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getSalesAnalytics()).rejects.toBeDefined()
    })
    const periods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    test.each(periods)('should handle period "%s"', async (period) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: {} } })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.getSalesAnalytics({ period })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('getProductAnalytics', () => {
    it('should fetch product analytics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      const result = await analyticsService.getProductAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getProductAnalytics()).rejects.toBeDefined()
    })
  })

  describe('getCustomerAnalytics', () => {
    it('should fetch customer analytics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      const result = await analyticsService.getCustomerAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getCustomerAnalytics()).rejects.toBeDefined()
    })
  })

  describe('getAgentAnalytics', () => {
    it('should fetch agent performance', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      const result = await analyticsService.getAgentAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with agent filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.getAgentAnalytics({ agent_id: 'a1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getAgentAnalytics()).rejects.toBeDefined()
    })
  })

  describe('getRevenueAnalytics', () => {
    it('should fetch region analytics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      const result = await analyticsService.getRevenueAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getRevenueAnalytics()).rejects.toBeDefined()
    })
  })

  describe('getPerformanceAnalytics', () => {
    it('should fetch trend data', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      const result = await analyticsService.getPerformanceAnalytics()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with metric filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.getPerformanceAnalytics({ metric: 'revenue' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.getPerformanceAnalytics()).rejects.toBeDefined()
    })
  })

  describe('generateReport', () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()
    })
    it('should export report', async () => {
      (apiClient.post as any).mockResolvedValue({ data: new Blob() })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.generateReport({ type: 'sales', format: 'csv' })
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 500 } })
      const { analyticsService } = await import('../../services/analytics.service')
      await expect(analyticsService.generateReport({ type: 'sales', format: 'csv' })).rejects.toBeDefined()
    })
    const formats = ['csv', 'xlsx', 'pdf']
    test.each(formats)('should export as "%s"', async (format) => {
      (apiClient.post as any).mockResolvedValue({ data: new Blob() })
      const { analyticsService } = await import('../../services/analytics.service')
      await analyticsService.generateReport({ type: 'sales', format })
      expect(apiClient.post).toHaveBeenCalled()
    })
  })
})
