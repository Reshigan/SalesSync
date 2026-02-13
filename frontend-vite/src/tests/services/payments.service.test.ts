import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Payments Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getPayments', () => {
    it('should fetch payments list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      const result = await paymentsService.getPayments()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ status: 'completed' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with method filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ method: 'cash' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ start_date: '2024-01-01', end_date: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with customer filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ customer_id: 'c1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { paymentsService } = await import('../../services/payments.service')
      await expect(paymentsService.getPayments()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { paymentsService } = await import('../../services/payments.service')
      await expect(paymentsService.getPayments()).rejects.toBeDefined()
    })
    const methods = ['cash', 'cheque', 'bank_transfer', 'credit_card', 'mobile_payment']
    test.each(methods)('should filter by method "%s"', async (method) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ method })
      expect(apiClient.get).toHaveBeenCalled()
    })
    const statuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled']
    test.each(statuses)('should filter by status "%s"', async (status) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.getPayments({ status })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('createPayment', () => {
    it('should create payment', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { paymentsService } = await import('../../services/payments.service')
      const result = await paymentsService.createPayment({ invoice_id: 'inv1', amount: 5000, method: 'cash', reference: 'PAY-001' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { paymentsService } = await import('../../services/payments.service')
      await expect(paymentsService.createPayment({ invoice_id: '', amount: -1, method: '' })).rejects.toBeDefined()
    })
    it('should create payment with cheque details', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.createPayment({ invoice_id: 'inv1', amount: 5000, method: 'cheque', reference: 'CHQ-001', cheque_number: '12345', bank_name: 'ABC Bank' })
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should create payment with bank transfer details', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.createPayment({ invoice_id: 'inv1', amount: 5000, method: 'bank_transfer', reference: 'TRF-001', bank_reference: 'REF123' })
      expect(apiClient.post).toHaveBeenCalled()
    })
  })

  describe('getPayment', () => {
    it('should fetch single payment', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', amount: 5000 } } })
      const { paymentsService } = await import('../../services/payments.service')
      const result = await paymentsService.getPayment('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle non-existent payment', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { paymentsService } = await import('../../services/payments.service')
      await expect(paymentsService.getPayment('non-existent')).rejects.toBeDefined()
    })
  })

  describe('refundPayment', () => {
    it('should refund payment', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1', status: 'refunded' } } })
      const { paymentsService } = await import('../../services/payments.service')
      const result = await paymentsService.refundPayment('1', { reason: 'Customer request', amount: 5000 })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle partial refund', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { paymentsService } = await import('../../services/payments.service')
      await paymentsService.refundPayment('1', { reason: 'Partial return', amount: 2500 })
      expect(apiClient.post).toHaveBeenCalled()
    })
    it('should handle refund error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { paymentsService } = await import('../../services/payments.service')
      await expect(paymentsService.refundPayment('1', { reason: '', amount: -1 })).rejects.toBeDefined()
    })
  })

  describe('getPaymentSummary', () => {
    it('should fetch payment summary', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { total_collected: 500000 } } })
      const { paymentsService } = await import('../../services/payments.service')
      const result = await paymentsService.getPaymentSummary()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { paymentsService } = await import('../../services/payments.service')
      await expect(paymentsService.getPaymentSummary()).rejects.toBeDefined()
    })
  })
})
