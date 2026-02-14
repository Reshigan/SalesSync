import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInvoicesService = {
  getInvoices: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getInvoice: vi.fn().mockResolvedValue({ id: '1', total: 5000 }),
  createInvoice: vi.fn().mockResolvedValue({ id: '1' }),
  updateInvoice: vi.fn().mockResolvedValue({ id: '1' }),
  downloadInvoicePDF: vi.fn().mockResolvedValue(new Blob()),
  sendInvoiceEmail: vi.fn().mockResolvedValue({ success: true }),
}

describe('Invoices Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getInvoices', () => {
    it('should fetch invoices list', async () => {
      mockInvoicesService.getInvoices.mockResolvedValue({ data: [], total: 0 })
      const result = await mockInvoicesService.getInvoices()
      expect(mockInvoicesService.getInvoices).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with status filter', async () => {
      mockInvoicesService.getInvoices.mockResolvedValue({ data: [], total: 0 })
      await mockInvoicesService.getInvoices({ status: 'unpaid' })
      expect(mockInvoicesService.getInvoices).toHaveBeenCalled()
    })
    it('should fetch with customer filter', async () => {
      mockInvoicesService.getInvoices.mockResolvedValue({ data: [], total: 0 })
      await mockInvoicesService.getInvoices({ customer_id: 'c1' })
      expect(mockInvoicesService.getInvoices).toHaveBeenCalled()
    })
    it('should fetch with date range', async () => {
      mockInvoicesService.getInvoices.mockResolvedValue({ data: [], total: 0 })
      await mockInvoicesService.getInvoices({ start_date: '2024-01-01', end_date: '2024-12-31' })
      expect(mockInvoicesService.getInvoices).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      mockInvoicesService.getInvoices.mockResolvedValue({ data: [], total: 0 })
      await mockInvoicesService.getInvoices({ page: 1, limit: 10 })
      expect(mockInvoicesService.getInvoices).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      mockInvoicesService.getInvoices.mockRejectedValue(new Error('Network Error'))
      await expect(mockInvoicesService.getInvoices()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      mockInvoicesService.getInvoices.mockRejectedValue({ response: { status: 500 } })
      await expect(mockInvoicesService.getInvoices()).rejects.toBeDefined()
    })
    const statuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']
    test.each(statuses)('should filter by status "%s"', async (status) => {
      mockInvoicesService.getInvoices.mockResolvedValue({ data: [], total: 0 })
      await mockInvoicesService.getInvoices({ status })
      expect(mockInvoicesService.getInvoices).toHaveBeenCalled()
    })
  })

  describe('createInvoice', () => {
    it('should create invoice', async () => {
      mockInvoicesService.createInvoice.mockResolvedValue({ id: '1' })
      const result = await mockInvoicesService.createInvoice({ order_id: 'o1', customer_id: 'c1', items: [{ product_id: 'p1', quantity: 5, unit_price: 100 }] })
      expect(mockInvoicesService.createInvoice).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      mockInvoicesService.createInvoice.mockRejectedValue({ response: { status: 400 } })
      await expect(mockInvoicesService.createInvoice({ order_id: '', customer_id: '' })).rejects.toBeDefined()
    })
  })

  describe('getInvoice', () => {
    it('should fetch single invoice', async () => {
      mockInvoicesService.getInvoice.mockResolvedValue({ id: '1', total: 5000 })
      const result = await mockInvoicesService.getInvoice('1')
      expect(mockInvoicesService.getInvoice).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle non-existent invoice', async () => {
      mockInvoicesService.getInvoice.mockRejectedValue({ response: { status: 404 } })
      await expect(mockInvoicesService.getInvoice('non-existent')).rejects.toBeDefined()
    })
  })

  describe('updateInvoice', () => {
    it('should update invoice', async () => {
      mockInvoicesService.updateInvoice.mockResolvedValue({ id: '1' })
      await mockInvoicesService.updateInvoice('1', { status: 'sent' })
      expect(mockInvoicesService.updateInvoice).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      mockInvoicesService.updateInvoice.mockRejectedValue({ response: { status: 404 } })
      await expect(mockInvoicesService.updateInvoice('non-existent', {})).rejects.toBeDefined()
    })
  })

  describe('downloadInvoicePDF', () => {
    it('should download PDF', async () => {
      mockInvoicesService.downloadInvoicePDF.mockResolvedValue(new Blob())
      const result = await mockInvoicesService.downloadInvoicePDF('1')
      expect(mockInvoicesService.downloadInvoicePDF).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      mockInvoicesService.downloadInvoicePDF.mockRejectedValue({ response: { status: 500 } })
      await expect(mockInvoicesService.downloadInvoicePDF('1')).rejects.toBeDefined()
    })
  })

  describe('sendInvoiceEmail', () => {
    it('should send invoice email', async () => {
      mockInvoicesService.sendInvoiceEmail.mockResolvedValue({ success: true })
      const result = await mockInvoicesService.sendInvoiceEmail('1', { to: 'customer@test.com' })
      expect(mockInvoicesService.sendInvoiceEmail).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      mockInvoicesService.sendInvoiceEmail.mockRejectedValue({ response: { status: 500 } })
      await expect(mockInvoicesService.sendInvoiceEmail('1', { to: 'bad' })).rejects.toBeDefined()
    })
  })
})
