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
}

export const cashReconciliationService = new CashReconciliationService()
