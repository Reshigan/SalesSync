import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Warehouses Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getWarehouses', () => {
    it('should fetch warehouses list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [{ id: '1', name: 'Main Warehouse' }], total: 1 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      const result = await warehousesService.getWarehouses()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await warehousesService.getWarehouses({ status: 'active' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with type filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await warehousesService.getWarehouses({ type: 'main' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle search', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await warehousesService.getWarehouses({ search: 'main' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { warehousesService } = await import('../../services/warehouses.service')
      await expect(warehousesService.getWarehouses()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await expect(warehousesService.getWarehouses()).rejects.toBeDefined()
    })
  })

  describe('getWarehouse', () => {
    it('should fetch single warehouse', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', name: 'Main' } } })
      const { warehousesService } = await import('../../services/warehouses.service')
      const result = await warehousesService.getWarehouse('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle non-existent warehouse', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await expect(warehousesService.getWarehouse('non-existent')).rejects.toBeDefined()
    })
  })

  describe('createWarehouse', () => {
    it('should create warehouse', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { warehousesService } = await import('../../services/warehouses.service')
      const result = await warehousesService.createWarehouse({ name: 'New Warehouse', code: 'WH-001', type: 'main', address: '123 Main St' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await expect(warehousesService.createWarehouse({ name: '', code: '' })).rejects.toBeDefined()
    })
  })

  describe('updateWarehouse', () => {
    it('should update warehouse', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await warehousesService.updateWarehouse('1', { name: 'Updated Warehouse' })
      expect(apiClient.put).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await expect(warehousesService.updateWarehouse('non-existent', { name: 'Test' })).rejects.toBeDefined()
    })
  })

  describe('deleteWarehouse', () => {
    it('should delete warehouse', async () => {
      (apiClient.delete as any).mockResolvedValue({ data: {} })
      const { warehousesService } = await import('../../services/warehouses.service')
      await warehousesService.deleteWarehouse('1')
      expect(apiClient.delete).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.delete as any).mockRejectedValue({ response: { status: 404 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      await expect(warehousesService.deleteWarehouse('non-existent')).rejects.toBeDefined()
    })
  })

  describe('getWarehouseStock', () => {
    it('should fetch warehouse stock', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { warehousesService } = await import('../../services/warehouses.service')
      const result = await warehousesService.getWarehouseStock('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { warehousesService } = await import('../../services/warehouses.service')
      const result = await warehousesService.getWarehouseStock('1')
      expect(result).toEqual([])
    })
  })
})
