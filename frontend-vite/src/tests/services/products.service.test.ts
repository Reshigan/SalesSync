import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: {
    post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Products Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getProducts', () => {
    it('should fetch products list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [{ id: '1', name: 'Product 1' }], total: 1 } })
      const { productsService } = await import('../../services/products.service')
      const result = await productsService.getProducts()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch products with pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch products with search', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ search: 'widget' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch products with category filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ category_id: 'cat1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch products with brand filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ brand_id: 'brand1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch products with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ status: 'active' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle empty response', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      const result = await productsService.getProducts()
      expect(result).toBeDefined()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.getProducts()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.getProducts()).rejects.toBeDefined()
    })
    const sortFields = ['name', 'sku', 'price', 'stock', 'category', 'brand', 'created_at']
    test.each(sortFields)('should sort products by "%s"', async (field) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ sort_by: field, sort_order: 'asc' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    const pageSizes = [5, 10, 25, 50, 100]
    test.each(pageSizes)('should handle page size %d', async (limit) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { productsService } = await import('../../services/products.service')
      await productsService.getProducts({ page: 1, limit })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('getProduct', () => {
    it('should fetch single product', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', name: 'Product 1' } } })
      const { productsService } = await import('../../services/products.service')
      const result = await productsService.getProduct('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle non-existent product', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.getProduct('non-existent')).rejects.toBeDefined()
    })
  })

  describe('createProduct', () => {
    it('should create product', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { productsService } = await import('../../services/products.service')
      const result = await productsService.createProduct({ name: 'New Product', sku: 'SKU-001', price: 100, category_id: 'c1', status: 'active' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.createProduct({ name: '', sku: '', price: -1, category_id: '', status: 'active' })).rejects.toBeDefined()
    })
    it('should handle duplicate SKU', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 409 } })
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.createProduct({ name: 'Product', sku: 'EXISTING', price: 100, category_id: 'c1', status: 'active' })).rejects.toBeDefined()
    })
    it('should create product with all fields', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { productsService } = await import('../../services/products.service')
      await productsService.createProduct({
        name: 'Full Product', sku: 'SKU-002', price: 250, cost_price: 150, category_id: 'c1', brand_id: 'b1',
        description: 'Full product description', unit_of_measure: 'EA', tax_rate: 15, status: 'active',
        min_stock_level: 10, max_stock_level: 1000, reorder_point: 50, weight: 2.5,
      })
      expect(apiClient.post).toHaveBeenCalled()
    })
  })

  describe('updateProduct', () => {
    it('should update product', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { productsService } = await import('../../services/products.service')
      await productsService.updateProduct('1', { name: 'Updated Product' })
      expect(apiClient.put).toHaveBeenCalled()
    })
    it('should handle non-existent product', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.updateProduct('non-existent', { name: 'Test' })).rejects.toBeDefined()
    })
  })

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      (apiClient.delete as any).mockResolvedValue({ data: {} })
      const { productsService } = await import('../../services/products.service')
      await productsService.deleteProduct('1')
      expect(apiClient.delete).toHaveBeenCalled()
    })
    it('should handle non-existent product deletion', async () => {
      (apiClient.delete as any).mockRejectedValue({ response: { status: 404 } })
      const { productsService } = await import('../../services/products.service')
      await expect(productsService.deleteProduct('non-existent')).rejects.toBeDefined()
    })
  })
})
