import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../store/auth.store', () => ({
  getAuthToken: vi.fn(() => 'mock-token'),
  useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) },
}))

vi.mock('../../services/tenant.service', () => ({
  tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') },
}))

describe('Orders Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrders', () => {
    it('should fetch orders list', async () => {
      const mockOrders = { data: { data: [{ id: '1', order_number: 'ORD-001' }], total: 1 } };
      (apiClient.get as any).mockResolvedValue(mockOrders)
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrders()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should fetch orders with pagination', async () => {
      const mockOrders = { data: { data: [], total: 0 } };
      (apiClient.get as any).mockResolvedValue(mockOrders)
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch orders with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ status: 'pending' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch orders with customer filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ customer_id: 'c1' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch orders with date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ start_date: '2024-01-01', end_date: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch orders with search query', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ search: 'ORD-001' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should handle empty orders list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrders()
      expect(result).toBeDefined()
    })

    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.getOrders()).rejects.toThrow()
    })

    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.getOrders()).rejects.toBeDefined()
    })

    it('should handle unauthorized error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 401 } })
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.getOrders()).rejects.toBeDefined()
    })

    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    test.each(statuses)('should filter orders by status "%s"', async (status) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ status })
      expect(apiClient.get).toHaveBeenCalled()
    })

    const sortFields = ['order_number', 'total_amount', 'order_date', 'customer_name', 'status']
    test.each(sortFields)('should sort orders by "%s"', async (field) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ sort_by: field, sort_order: 'asc' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    const pageSizes = [5, 10, 25, 50, 100]
    test.each(pageSizes)('should handle page size %d', async (limit) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.getOrders({ page: 1, limit })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('getOrder', () => {
    it('should fetch single order by ID', async () => {
      const mockOrder = { data: { data: { id: '1', order_number: 'ORD-001', items: [] } } };
      (apiClient.get as any).mockResolvedValue(mockOrder)
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrder('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle non-existent order', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrder('non-existent')
      expect(result).toBeNull()
    })

    it('should handle invalid order ID', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 400 } })
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrder('')
      expect(result).toBeNull()
    })
  })

  describe('createOrder', () => {
    it('should create order with items', async () => {
      const mockResponse = { data: { data: { id: '1', order_number: 'ORD-001' } } };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.createOrder({
        customer_id: 'c1',
        items: [{ product_id: 'p1', quantity: 5, unit_price: 100, line_total: 500 }],
        order_date: '2024-06-15',
      })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400, data: { message: 'Validation failed' } } })
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.createOrder({
        customer_id: '',
        items: [],
        order_date: '2024-06-15',
      })).rejects.toBeDefined()
    })

    it('should handle multiple items', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.createOrder({
        customer_id: 'c1',
        items: [
          { product_id: 'p1', quantity: 5, unit_price: 100, line_total: 500 },
          { product_id: 'p2', quantity: 10, unit_price: 50, line_total: 500 },
          { product_id: 'p3', quantity: 2, unit_price: 200, line_total: 400 },
        ],
        order_date: '2024-06-15',
      })
      expect(apiClient.post).toHaveBeenCalled()
    })

    it('should handle order with discount', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.createOrder({
        customer_id: 'c1',
        items: [{ product_id: 'p1', quantity: 5, unit_price: 100, line_total: 450, discount_percentage: 10 }],
        order_date: '2024-06-15',
        discount_amount: 50,
      })
      expect(apiClient.post).toHaveBeenCalled()
    })

    it('should handle order with notes', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.createOrder({
        customer_id: 'c1',
        items: [{ product_id: 'p1', quantity: 1, unit_price: 100, line_total: 100 }],
        order_date: '2024-06-15',
        notes: 'Rush delivery requested',
      })
      expect(apiClient.post).toHaveBeenCalled()
    })

    it('should handle server error during creation', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 500 } })
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.createOrder({
        customer_id: 'c1',
        items: [{ product_id: 'p1', quantity: 1, unit_price: 100, line_total: 100 }],
        order_date: '2024-06-15',
      })).rejects.toBeDefined()
    })
  })

  describe('updateOrder', () => {
    it('should update order', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.updateOrder('1', { order_status: 'confirmed' })
      expect(apiClient.put).toHaveBeenCalled()
    })

    it('should handle non-existent order update', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.updateOrder('non-existent', { order_status: 'confirmed' })).rejects.toBeDefined()
    })

    const orderStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    test.each(orderStatuses)('should update order status to "%s"', async (status) => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1', order_status: status } } })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.updateOrder('1', { order_status: status })
      expect(apiClient.put).toHaveBeenCalled()
    })
  })

  describe('deleteOrder', () => {
    it('should delete order', async () => {
      (apiClient.delete as any).mockResolvedValue({ data: {} })
      const { ordersService } = await import('../../services/orders.service')
      await ordersService.deleteOrder('1')
      expect(apiClient.delete).toHaveBeenCalled()
    })

    it('should handle non-existent order deletion', async () => {
      (apiClient.delete as any).mockRejectedValue({ response: { status: 404 } })
      const { ordersService } = await import('../../services/orders.service')
      await expect(ordersService.deleteOrder('non-existent')).rejects.toBeDefined()
    })
  })

  describe('getOrderStats', () => {
    it('should fetch order statistics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { total: 100, pending: 20 } } })
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrderStats()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle error fetching stats', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { ordersService } = await import('../../services/orders.service')
      const result = await ordersService.getOrderStats()
      expect(result).toBeNull()
    })
  })
})
