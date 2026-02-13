import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => {
  const mockClient = { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }
  return {
    apiClient: mockClient,
    ApiService: class { constructor() { (this as any).client = mockClient } async get(u: any, c?: any) { return mockClient.get(u, c) } async post(u: any, d?: any, c?: any) { return mockClient.post(u, d, c) } async put(u: any, d?: any, c?: any) { return mockClient.put(u, d, c) } async delete(u: any, c?: any) { return mockClient.delete(u, c) } async patch(u: any, d?: any, c?: any) { return mockClient.patch(u, d, c) } },
    apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p: any) => ''), buildUrl: vi.fn((u: any) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
  }
})
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Promotions Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getPromotions', () => {
    it('should fetch promotions list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { promotionsService } = await import('../../services/promotions.service')
      const result = await promotionsService.getPromotions()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.getPromotions({ status: 'active' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with type filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.getPromotions({ type: 'discount' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.getPromotions({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle search', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.getPromotions({ search: 'summer' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { promotionsService } = await import('../../services/promotions.service')
      await expect(promotionsService.getPromotions()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await expect(promotionsService.getPromotions()).rejects.toBeDefined()
    })
    const types = ['discount', 'buy_one_get_one', 'bundle', 'loyalty', 'seasonal']
    test.each(types)('should filter by type "%s"', async (type) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.getPromotions({ type })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('createPromotion', () => {
    it('should create promotion', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { promotionsService } = await import('../../services/promotions.service')
      const result = await promotionsService.createPromotion({ name: 'Summer Sale', type: 'discount', discount_percentage: 20, start_date: '2024-06-01', end_date: '2024-08-31' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await expect(promotionsService.createPromotion({ name: '', type: '' })).rejects.toBeDefined()
    })
  })

  describe('updatePromotion', () => {
    it('should update promotion', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.updatePromotion('1', { name: 'Updated Sale' })
      expect(apiClient.put).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await expect(promotionsService.updatePromotion('non-existent', { name: 'Test' })).rejects.toBeDefined()
    })
  })

  describe('deletePromotion', () => {
    it('should delete promotion', async () => {
      (apiClient.delete as any).mockResolvedValue({ data: {} })
      const { promotionsService } = await import('../../services/promotions.service')
      await promotionsService.deletePromotion('1')
      expect(apiClient.delete).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.delete as any).mockRejectedValue({ response: { status: 404 } })
      const { promotionsService } = await import('../../services/promotions.service')
      await expect(promotionsService.deletePromotion('non-existent')).rejects.toBeDefined()
    })
  })
})
