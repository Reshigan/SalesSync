import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Invoices Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getInvoices', () => {
    it('should fetch invoices list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { invoicesService } = await import('../../services/invoices.service')
      const result = await invoicesService.getInvoices()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await invoicesService.getInvoices({ status: 'unpaid' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with customer filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await invoicesService.getInvoices({ customer_id: 'c1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await invoicesService.getInvoices({ start_date: '2024-01-01', end_date: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await invoicesService.getInvoices({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.getInvoices()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.getInvoices()).rejects.toBeDefined()
    })
    const statuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']
    test.each(statuses)('should filter by status "%s"', async (status) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await invoicesService.getInvoices({ status })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('createInvoice', () => {
    it('should create invoice', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { invoicesService } = await import('../../services/invoices.service')
      const result = await invoicesService.createInvoice({ order_id: 'o1', customer_id: 'c1', items: [{ product_id: 'p1', quantity: 5, unit_price: 100 }] })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.createInvoice({ order_id: '', customer_id: '' })).rejects.toBeDefined()
    })
  })

  describe('getInvoice', () => {
    it('should fetch single invoice', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', total: 5000 } } })
      const { invoicesService } = await import('../../services/invoices.service')
      const result = await invoicesService.getInvoice('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle non-existent invoice', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.getInvoice('non-existent')).rejects.toBeDefined()
    })
  })

  describe('updateInvoice', () => {
    it('should update invoice', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { invoicesService } = await import('../../services/invoices.service')
      await invoicesService.updateInvoice('1', { status: 'sent' })
      expect(apiClient.put).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.updateInvoice('non-existent', {})).rejects.toBeDefined()
    })
  })

  describe('downloadInvoicePDF', () => {
    it('should download PDF', async () => {
      (apiClient.get as any).mockResolvedValue({ data: new Blob() })
      const { invoicesService } = await import('../../services/invoices.service')
      const result = await invoicesService.downloadInvoicePDF('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.downloadInvoicePDF('1')).rejects.toBeDefined()
    })
  })

  describe('sendInvoiceEmail', () => {
    it('should send invoice email', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { success: true } })
      const { invoicesService } = await import('../../services/invoices.service')
      const result = await invoicesService.sendInvoiceEmail('1', { to: 'customer@test.com' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 500 } })
      const { invoicesService } = await import('../../services/invoices.service')
      await expect(invoicesService.sendInvoiceEmail('1', { to: 'bad' })).rejects.toBeDefined()
    })
  })
})
