import { apiClient } from './api.service'

export interface CashSession {
  id: string
  agent_id: string
  agent_name: string
  session_date: string
  opening_float: number
  expected_cash: number
  actual_cash: number
  variance: number
  variance_percentage: number
  status: 'open' | 'closed' | 'approved' | 'rejected'
  created_at: string
}

export interface CashCollection {
  id: string
  session_id: string
  order_id: string
  customer_id: string
  customer_name?: string
  amount: number
  payment_method: 'cash' | 'mobile_money'
  collected_at: string
}

export interface BankDeposit {
  id: string
  session_id: string
  deposit_date: string
  amount: number
  bank_name: string
  reference_number: string
  status: 'pending' | 'confirmed' | 'rejected'
}

class CashReconciliationService {
  private readonly baseUrl = '/cash-reconciliation'

  async getSessions(filter?: any): Promise<{ data: CashSession[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/sessions`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch cash sessions:', error)
      throw error
    }
  }

  async getSession(id: string): Promise<CashSession> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/sessions/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch cash session:', error)
      throw error
    }
  }

  async startSession(data: { agent_id: string; opening_float: number; notes?: string }): Promise<CashSession> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/sessions`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to start cash session:', error)
      throw error
    }
  }

  async getCollections(sessionId: string): Promise<CashCollection[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/sessions/${sessionId}/collections`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch collections:', error)
      throw error
    }
  }

  async recordCollection(sessionId: string, data: Partial<CashCollection>): Promise<CashCollection> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/sessions/${sessionId}/collections`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to record cash collection:', error)
      throw error
    }
  }

  async closeSession(sessionId: string, data: { closing_cash: number; notes?: string }): Promise<CashSession> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/sessions/${sessionId}/close`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to close cash session:', error)
      throw error
    }
  }

  async approveVariance(sessionId: string, data: { approved_by: string; approval_notes?: string }): Promise<CashSession> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/sessions/${sessionId}/approve-variance`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to approve variance:', error)
      throw error
    }
  }

  async getBankDeposits(filter?: any): Promise<{ data: BankDeposit[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/bank-deposits`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch bank deposits:', error)
      throw error
    }
  }

  async createBankDeposit(data: Partial<BankDeposit>): Promise<BankDeposit> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/bank-deposits`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create bank deposit:', error)
      throw error
    }
  }

  // Cash Reconciliations - New lifecycle methods matching backend
  async getReconciliations(filter?: any): Promise<{ data: CashReconciliation[], total: number }> {
    try {
      const response = await apiClient.get('/cash-reconciliations', { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch cash reconciliations:', error)
      throw error
    }
  }

  async getReconciliation(id: string): Promise<CashReconciliation & { items: CashReconciliationItem[] }> {
    try {
      const response = await apiClient.get(`/cash-reconciliations/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch cash reconciliation:', error)
      throw error
    }
  }

  async createReconciliation(data: {
    agent_id?: string
    reconciliation_date: string
    opening_balance?: number
    expected_cash?: number
    actual_cash?: number
    notes?: string
  }): Promise<CashReconciliation> {
    try {
      const response = await apiClient.post('/cash-reconciliations', data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create cash reconciliation:', error)
      throw error
    }
  }

  async updateReconciliation(id: string, data: Partial<CashReconciliation>): Promise<CashReconciliation> {
    try {
      const response = await apiClient.put(`/cash-reconciliations/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update cash reconciliation:', error)
      throw error
    }
  }

  async addReconciliationItem(id: string, data: {
    payment_id?: string
    payment_type?: string
    amount: number
    reference?: string
    notes?: string
  }): Promise<CashReconciliationItem> {
    try {
      const response = await apiClient.post(`/cash-reconciliations/${id}/items`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to add reconciliation item:', error)
      throw error
    }
  }

  async submitReconciliation(id: string): Promise<CashReconciliation> {
    try {
      const response = await apiClient.post(`/cash-reconciliations/${id}/submit`)
      return response.data.data
    } catch (error) {
      console.error('Failed to submit cash reconciliation:', error)
      throw error
    }
  }

  async approveReconciliation(id: string): Promise<CashReconciliation> {
    try {
      const response = await apiClient.post(`/cash-reconciliations/${id}/approve`)
      return response.data.data
    } catch (error) {
      console.error('Failed to approve cash reconciliation:', error)
      throw error
    }
  }

  async rejectReconciliation(id: string, reason: string): Promise<CashReconciliation> {
    try {
      const response = await apiClient.post(`/cash-reconciliations/${id}/reject`, { rejection_reason: reason })
      return response.data.data
    } catch (error) {
      console.error('Failed to reject cash reconciliation:', error)
      throw error
    }
  }

  async closeReconciliation(id: string): Promise<CashReconciliation> {
    try {
      const response = await apiClient.post(`/cash-reconciliations/${id}/close`)
      return response.data.data
    } catch (error) {
      console.error('Failed to close cash reconciliation:', error)
      throw error
    }
  }

  async getReconciliationStats(): Promise<any> {
    try {
      const response = await apiClient.get('/cash-reconciliations/stats')
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch reconciliation stats:', error)
      throw error
    }
  }
}

// Additional interfaces for new endpoints
export interface CashReconciliation {
  id: string
  tenant_id: string
  agent_id?: string
  reconciliation_date: string
  opening_balance: number
  expected_cash: number
  actual_cash: number
  discrepancy: number
  discrepancy_reason?: string
  status: 'open' | 'submitted' | 'approved' | 'rejected' | 'closed'
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  closed_by?: string
  closed_at?: string
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface CashReconciliationItem {
  id: string
  reconciliation_id: string
  payment_id?: string
  payment_type: string
  amount: number
  reference?: string
  notes?: string
  created_at: string
}

export const cashReconciliationService = new CashReconciliationService()
