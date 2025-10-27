/**
import { API_CONFIG } from '../config/api.config'
 * Commissions Service
 * Handles commission tracking and calculations
 */

import { apiClient } from './api.service'

export interface Commission {
  id: string
  tenant_id: string
  user_id: string
  order_id?: string
  commission_amount: number
  base_amount: number
  commission_rate: number
  status: 'pending' | 'paid' | 'cancelled'
  payment_date?: string
  notes?: string
  created_at: string
  user?: {
    id: string
    name: string
    role: string
  }
}

export interface CommissionRule {
  id: string
  tenant_id: string
  name: string
  rule_type: 'percentage' | 'fixed' | 'tiered'
  value: number
  conditions?: any
  status: 'active' | 'inactive'
  created_at: string
}

export interface CommissionStats {
  total_commissions: number
  pending_commissions: number
  paid_commissions: number
  total_amount: number
  pending_amount: number
  paid_amount: number
  top_earners: Array<{
    user_id: string
    user_name: string
    total_earned: number
    commission_count: number
  }>
}

class CommissionsService {
  private readonly baseUrl = API_CONFIG.ENDPOINTS.COMMISSIONS.BASE
  // Build full URL using centralized config
  private buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
  }

  async getCommissions(filter?: any): Promise<{ commissions: Commission[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        commissions: response.data.data?.commissions || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch commissions:', error)
      throw error
    }
  }

  async getCommission(id: string): Promise<Commission> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch commission:', error)
      throw error
    }
  }

  async createCommission(commission: Partial<Commission>): Promise<Commission> {
    try {
      const response = await apiClient.post(this.baseUrl, commission)
      return response.data.data
    } catch (error) {
      console.error('Failed to create commission:', error)
      throw error
    }
  }

  async updateCommission(id: string, updates: Partial<Commission>): Promise<Commission> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update commission:', error)
      throw error
    }
  }

  async deleteCommission(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete commission:', error)
      throw error
    }
  }

  async getCommissionStats(): Promise<CommissionStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch commission stats:', error)
      throw error
    }
  }

  async getUserCommissions(userId: string, filter?: any): Promise<{ commissions: Commission[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/user/${userId}`, { params: filter })
      return {
        commissions: response.data.data?.commissions || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch user commissions:', error)
      throw error
    }
  }

  async calculateCommission(orderId: string): Promise<{ amount: number, details: any }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/calculate`, { order_id: orderId })
      return response.data.data
    } catch (error) {
      console.error('Failed to calculate commission:', error)
      throw error
    }
  }

  async payCommissions(commissionIds: string[]): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/pay`, { commission_ids: commissionIds })
    } catch (error) {
      console.error('Failed to pay commissions:', error)
      throw error
    }
  }

  // Commission Rules
  async getRules(): Promise<CommissionRule[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/rules`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch commission rules:', error)
      return []
    }
  }

  async createRule(rule: Partial<CommissionRule>): Promise<CommissionRule> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/rules`, rule)
      return response.data.data
    } catch (error) {
      console.error('Failed to create commission rule:', error)
      throw error
    }
  }

  async updateRule(id: string, updates: Partial<CommissionRule>): Promise<CommissionRule> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/rules/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update commission rule:', error)
      throw error
    }
  }

  async deleteRule(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/rules/${id}`)
    } catch (error) {
      console.error('Failed to delete commission rule:', error)
      throw error
    }
  }
}

export const commissionsService = new CommissionsService()
