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

describe('Customers Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCustomers', () => {
    it('should fetch customers list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [{ id: '1', name: 'Customer 1' }], total: 1 } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomers()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should fetch customers with pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch customers with search', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ search: 'test' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch customers with type filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ type: 'retail' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch customers with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ status: 'active' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should fetch customers with route filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ route_id: 'r1' })
      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should handle empty response', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomers()
      expect(result).toBeDefined()
    })

    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.getCustomers()).rejects.toThrow()
    })

    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.getCustomers()).rejects.toBeDefined()
    })

    const customerTypes = ['retail', 'wholesale', 'distributor']
    test.each(customerTypes)('should filter by type "%s"', async (type) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ type })
      expect(apiClient.get).toHaveBeenCalled()
    })

    const sortFields = ['name', 'code', 'type', 'total_orders', 'total_sales', 'created_at']
    test.each(sortFields)('should sort by "%s"', async (field) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.getCustomers({ sort_by: field, sort_order: 'asc' })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('getCustomer', () => {
    it('should fetch single customer', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', name: 'Customer 1' } } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomer('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle non-existent customer', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomer('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('createCustomer', () => {
    it('should create customer', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.createCustomer({
        name: 'New Customer',
        code: 'CUST-001',
        type: 'retail',
        phone: '1234567890',
        email: 'customer@test.com',
        address: '123 Main St',
        credit_limit: 10000,
        payment_terms: 30,
        status: 'active',
      })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.createCustomer({
        name: '',
        code: '',
        type: 'retail',
        credit_limit: 0,
        payment_terms: 0,
        status: 'active',
      })).rejects.toBeDefined()
    })

    it('should handle duplicate code', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 409 } })
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.createCustomer({
        name: 'Customer',
        code: 'EXISTING',
        type: 'retail',
        credit_limit: 0,
        payment_terms: 30,
        status: 'active',
      })).rejects.toBeDefined()
    })

    const types = ['retail', 'wholesale', 'distributor']
    test.each(types)('should create customer with type "%s"', async (type) => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1', type } } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.createCustomer({
        name: `${type} Customer`,
        code: `${type.toUpperCase()}-001`,
        type: type as any,
        credit_limit: 10000,
        payment_terms: 30,
        status: 'active',
      })
      expect(apiClient.post).toHaveBeenCalled()
    })
  })

  describe('updateCustomer', () => {
    it('should update customer', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.updateCustomer('1', { name: 'Updated Customer' })
      expect(apiClient.put).toHaveBeenCalled()
    })

    it('should handle non-existent customer', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.updateCustomer('non-existent', { name: 'Test' })).rejects.toBeDefined()
    })

    it('should update customer status', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1', status: 'inactive' } } })
      const { customersService } = await import('../../services/customers.service')
      await customersService.updateCustomer('1', { status: 'inactive' })
      expect(apiClient.put).toHaveBeenCalled()
    })
  })

  describe('deleteCustomer', () => {
    it('should delete customer', async () => {
      (apiClient.delete as any).mockResolvedValue({ data: {} })
      const { customersService } = await import('../../services/customers.service')
      await customersService.deleteCustomer('1')
      expect(apiClient.delete).toHaveBeenCalled()
    })

    it('should handle non-existent customer', async () => {
      (apiClient.delete as any).mockRejectedValue({ response: { status: 404 } })
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.deleteCustomer('non-existent')).rejects.toBeDefined()
    })
  })

  describe('getCustomerStats', () => {
    it('should fetch customer statistics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { total_customers: 100 } } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomerStats()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle error fetching stats', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { customersService } = await import('../../services/customers.service')
      await expect(customersService.getCustomerStats()).rejects.toBeDefined()
    })
  })

  describe('getCustomerOrders', () => {
    it('should fetch customer orders', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomerOrders('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle non-existent customer orders', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { customersService } = await import('../../services/customers.service')
      const result = await customersService.getCustomerOrders('non-existent')
      expect(result).toEqual([])
    })
  })
})
