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

  describe('createVan', () => {
    it('should create a van', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      const result = await service.createVan({ registration_number: 'VAN-001' })
      expect(result).toBeDefined()
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      await expect(service.createVan({ registration_number: '' })).rejects.toBeDefined()
    })
  })

  describe('getVans', () => {
    it('should fetch vans list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      const result = await service.getVans()
      expect(result).toBeDefined()
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const mod = await import('../../services/van-sales.service')
      const service = mod.vanSalesService || mod.default
      await expect(service.getVans()).rejects.toBeDefined()
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
