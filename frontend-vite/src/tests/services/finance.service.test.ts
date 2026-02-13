import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Finance Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getFinancialSummary', () => {
    it('should fetch financial summary', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { revenue: 1000000, expenses: 500000 } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getFinancialSummary()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with date range', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: {} } })
      const { financeService } = await import('../../services/finance.service')
      await financeService.getFinancialSummary({ startDate: '2024-01-01', endDate: '2024-12-31' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getFinancialSummary()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getFinancialSummary()).rejects.toBeDefined()
    })
    it('should handle unauthorized', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 401 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getFinancialSummary()).rejects.toBeDefined()
    })
  })

  describe('getAccountsReceivable', () => {
    it('should fetch accounts receivable', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getAccountsReceivable()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with filters', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      await financeService.getAccountsReceivable({ status: 'overdue' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getAccountsReceivable()).rejects.toBeDefined()
    })
  })

  describe('getAccountsPayable', () => {
    it('should fetch accounts payable', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getAccountsPayable()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getAccountsPayable()).rejects.toBeDefined()
    })
  })

  describe('getCashFlow', () => {
    it('should fetch cash flow', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { inflow: 500000, outflow: 300000 } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getCashFlow()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with period', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: {} } })
      const { financeService } = await import('../../services/finance.service')
      await financeService.getCashFlow({ period: 'monthly' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getCashFlow()).rejects.toBeDefined()
    })
  })

  describe('getBankReconciliation', () => {
    it('should fetch bank reconciliation', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getBankReconciliation()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getBankReconciliation()).rejects.toBeDefined()
    })
  })

  describe('getExpenses', () => {
    it('should fetch expenses', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.getExpenses()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with category filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { financeService } = await import('../../services/finance.service')
      await financeService.getExpenses({ category: 'travel' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.getExpenses()).rejects.toBeDefined()
    })
  })

  describe('createExpense', () => {
    it('should create expense', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { financeService } = await import('../../services/finance.service')
      const result = await financeService.createExpense({ category: 'travel', amount: 500, description: 'Business trip', date: '2024-06-15' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { financeService } = await import('../../services/finance.service')
      await expect(financeService.createExpense({ category: '', amount: -1, description: '', date: '' })).rejects.toBeDefined()
    })
  })
})
