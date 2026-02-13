import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Commissions Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getCommissions', () => {
    it('should fetch commissions list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { commissionsService } = await import('../../services/commissions.service')
      const result = await commissionsService.getCommissions()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with agent filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await commissionsService.getCommissions({ agent_id: 'a1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with period filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await commissionsService.getCommissions({ period: '2024-06' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await commissionsService.getCommissions({ status: 'pending' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await commissionsService.getCommissions({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.getCommissions()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.getCommissions()).rejects.toBeDefined()
    })
    const statuses = ['pending', 'approved', 'paid', 'rejected']
    test.each(statuses)('should filter by status "%s"', async (status) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await commissionsService.getCommissions({ status })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('getCommissionStructures', () => {
    it('should fetch commission structures', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { commissionsService } = await import('../../services/commissions.service')
      const result = await commissionsService.getCommissionStructures()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.getCommissionStructures()).rejects.toBeDefined()
    })
  })

  describe('createCommissionStructure', () => {
    it('should create commission structure', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { commissionsService } = await import('../../services/commissions.service')
      const result = await commissionsService.createCommissionStructure({ name: 'Sales Commission', type: 'percentage', rate: 5, status: 'active' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.createCommissionStructure({ name: '', type: '', rate: -1, status: '' })).rejects.toBeDefined()
    })
  })

  describe('calculateCommissions', () => {
    it('should calculate commissions', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { total: 5000 } } })
      const { commissionsService } = await import('../../services/commissions.service')
      const result = await commissionsService.calculateCommissions({ period: '2024-06', agent_id: 'a1' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 500 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.calculateCommissions({ period: '2024-06' })).rejects.toBeDefined()
    })
  })

  describe('approveCommissions', () => {
    it('should approve commissions', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { approved: 10 } } })
      const { commissionsService } = await import('../../services/commissions.service')
      const result = await commissionsService.approveCommissions({ commission_ids: ['c1', 'c2'] })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.approveCommissions({ commission_ids: [] })).rejects.toBeDefined()
    })
  })

  describe('getCommissionSummary', () => {
    it('should fetch commission summary', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { total_pending: 10000 } } })
      const { commissionsService } = await import('../../services/commissions.service')
      const result = await commissionsService.getCommissionSummary()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { commissionsService } = await import('../../services/commissions.service')
      await expect(commissionsService.getCommissionSummary()).rejects.toBeDefined()
    })
  })
})
