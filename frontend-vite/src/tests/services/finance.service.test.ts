import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))
vi.mock('../../config/api.config', () => ({ API_CONFIG: { BASE_URL: 'http://localhost:3000', ENDPOINTS: { FINANCE: { BASE: '/finance' } } } }))

describe('Finance Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getInvoices', () => {
    it('should fetch invoices list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { invoices: [], pagination: { total: 0 } } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getInvoices()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { invoices: [], pagination: { total: 0 } } } })
      const { financeService } = await import('../../services/finance.service')
      await financeService.getInvoices({ status: 'paid' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getInvoices()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getInvoices()).rejects.toBeDefined()
    })
    it('should handle unauthorized', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 401 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getInvoices()).rejects.toBeDefined()
    })
  })

  describe('getInvoice', () => {
    it('should fetch single invoice', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', total_amount: 5000 } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getInvoice('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getInvoice('x')).rejects.toBeDefined()
    })
  })

  describe('createInvoice', () => {
    it('should create invoice', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.createInvoice({ customer_id: 'c1', invoice_date: '2024-01-01', due_date: '2024-02-01' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.createInvoice({})).rejects.toBeDefined()
    })
  })

  describe('getFinanceStats', () => {
    it('should fetch finance stats', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { total_invoices: 100, total_revenue: 500000 } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getFinanceStats()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getFinanceStats()).rejects.toBeDefined()
    })
  })

  describe('getPayments', () => {
    it('should fetch payments', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { payments: [], pagination: { total: 0 } } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getPayments()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with filters', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { payments: [], pagination: { total: 0 } } } })
      const { financeService } = await import('../../services/finance.service')
      await financeService.getPayments({ status: 'completed' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getPayments()).rejects.toBeDefined()
    })
  })

  describe('createPayment', () => {
    it('should create payment', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.createPayment({ customer_id: 'c1', amount: 500, payment_method: 'cash' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.createPayment({})).rejects.toBeDefined()
    })
  })

  describe('getCashReconciliations', () => {
    it('should fetch cash reconciliations', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getCashReconciliations()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getCashReconciliations()).rejects.toBeDefined()
    })
  })

  describe('deleteInvoice', () => {
    it('should delete invoice', async () => {
      (apiClient.delete as any).mockResolvedValue({ data: {} })
      const { financeService } = await import('../../services/finance.service')
      await financeService.deleteInvoice('1')
      expect(apiClient.delete).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.delete as any).mockRejectedValue({ response: { status: 404 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.deleteInvoice('x')).rejects.toBeDefined()
    })
  })
})
