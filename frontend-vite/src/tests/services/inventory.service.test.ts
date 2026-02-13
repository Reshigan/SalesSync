import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Inventory Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getInventory', () => {
    it('should fetch inventory list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [{ id: '1', product_id: 'p1', quantity: 100 }], total: 1 } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.getStock()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch inventory with warehouse filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStock({ warehouse_id: 'w1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch inventory with product filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStock({ product_id: 'p1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch low stock items', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStock({ low_stock: true })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStock({ page: 1, limit: 25 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle search', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStock({ search: 'widget' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.getStock()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.getStock()).rejects.toBeDefined()
    })
  })

  describe('getStockMovements', () => {
    it('should fetch stock movements', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.getStockMovements()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should filter by movement type', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStockMovements({ type: 'in' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should filter by date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStockMovements({ start_date: '2024-01-01', end_date: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    const movementTypes = ['in', 'out', 'transfer', 'adjustment', 'return']
    test.each(movementTypes)('should handle movement type "%s"', async (type) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { inventoryService } = await import('../../services/inventory.service')
      await inventoryService.getStockMovements({ type })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('createStockMovement', () => {
    it('should create stock movement', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.createStockMovement({ product_id: 'p1', warehouse_id: 'w1', quantity: 50, type: 'in', reference: 'PO-001' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.createStockMovement({ product_id: '', warehouse_id: '', quantity: -1, type: '', reference: '' })).rejects.toBeDefined()
    })
  })

  describe('getStockCounts', () => {
    it('should fetch stock counts', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.getStockCounts()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.getStockCounts()).rejects.toBeDefined()
    })
  })

  describe('createStockCount', () => {
    it('should create stock count', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.createStockCount({ warehouse_id: 'w1', items: [{ product_id: 'p1', counted_quantity: 100 }] })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.createStockCount({ warehouse_id: '', items: [] })).rejects.toBeDefined()
    })
  })

  describe('getWarehouses', () => {
    it('should fetch warehouses', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [{ id: '1', name: 'Main Warehouse' }] } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.getWarehouses()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.getWarehouses()).rejects.toBeDefined()
    })
  })

  describe('transferStock', () => {
    it('should transfer stock between warehouses', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { inventoryService } = await import('../../services/inventory.service')
      const result = await inventoryService.transferStock({ from_warehouse_id: 'w1', to_warehouse_id: 'w2', items: [{ product_id: 'p1', quantity: 25 }] })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle insufficient stock', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400, data: { message: 'Insufficient stock' } } })
      const { inventoryService } = await import('../../services/inventory.service')
      await expect(inventoryService.transferStock({ from_warehouse_id: 'w1', to_warehouse_id: 'w2', items: [{ product_id: 'p1', quantity: 9999 }] })).rejects.toBeDefined()
    })
  })
})
