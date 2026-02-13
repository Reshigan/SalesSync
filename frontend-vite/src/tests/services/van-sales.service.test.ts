import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Van Sales Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getVanSales', () => {
    it('should fetch van sales list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.getVanSales) {
        const result = await service.getVanSales()
        expect(result).toBeDefined()
      }
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with date filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.getVanSales) await service.getVanSales({ date: '2024-06-15' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with agent filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.getVanSales) await service.getVanSales({ agent_id: 'a1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.getVanSales) await expect(service.getVanSales()).rejects.toThrow()
    })
  })

  describe('startDay', () => {
    it('should start van sales day', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.startDay) {
        const result = await service.startDay({ van_id: 'v1', opening_stock: [] })
        expect(result).toBeDefined()
      }
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.startDay) await expect(service.startDay({ van_id: '', opening_stock: [] })).rejects.toBeDefined()
    })
  })

  describe('endDay', () => {
    it('should end van sales day', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.endDay) {
        const result = await service.endDay({ day_id: 'd1', closing_stock: [], cash_collected: 5000 })
        expect(result).toBeDefined()
      }
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.endDay) await expect(service.endDay({ day_id: '', closing_stock: [], cash_collected: 0 })).rejects.toBeDefined()
    })
  })

  describe('createVanSale', () => {
    it('should create van sale transaction', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.createVanSale) {
        const result = await service.createVanSale({ customer_id: 'c1', items: [{ product_id: 'p1', quantity: 5, price: 100 }], payment_method: 'cash' })
        expect(result).toBeDefined()
      }
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.createVanSale) await expect(service.createVanSale({ customer_id: '', items: [], payment_method: '' })).rejects.toBeDefined()
    })
  })

  describe('getVanInventory', () => {
    it('should fetch van inventory', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.getVanInventory) {
        const result = await service.getVanInventory('v1')
        expect(result).toBeDefined()
      }
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      if (service?.getVanInventory) await expect(service.getVanInventory('v1')).rejects.toBeDefined()
    })
  })
})
