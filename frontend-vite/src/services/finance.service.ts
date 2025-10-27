/**
import { API_CONFIG } from '../config/api.config'
 * Finance Service
 * Handles invoices, payments, and financial operations
 */

import { apiClient } from './api.service'

export interface Invoice {
  id: string
  tenant_id: string
  invoice_number: string
  customer_id: string
  order_id?: string
  invoice_date: string
  due_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  created_at: string
}

export interface Payment {
  id: string
  tenant_id: string
  payment_number: string
  customer_id: string
  invoice_id?: string
  order_id?: string
  payment_date: string
  amount: number
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque'
  reference_number?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  notes?: string
  created_at: string
}

export interface FinanceStats {
  total_invoices: number
  total_payments: number
  total_revenue: number
  outstanding_amount: number
  overdue_amount: number
  paid_invoices: number
  pending_invoices: number
  overdue_invoices: number
}

class FinanceService {
  private readonly baseUrl = '/finance'
  // Build full URL using centralized config
  private buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
  }
  private paymentsUrl = '/api/payments'

  // Invoices
  async getInvoices(filter?: any): Promise<{ invoices: Invoice[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        invoices: response.data.data?.invoices || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      throw error
    }
  }

  async getInvoice(id: string): Promise<Invoice> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
      throw error
    }
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await apiClient.post(this.baseUrl, invoice)
      return response.data.data
    } catch (error) {
      console.error('Failed to create invoice:', error)
      throw error
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data
    } catch (error) {
      console.error('Failed to update invoice:', error)
      throw error
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      throw error
    }
  }

  async getFinanceStats(): Promise<FinanceStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch finance stats:', error)
      throw error
    }
  }

  // Payments
  async getPayments(filter?: any): Promise<{ payments: Payment[], total: number }> {
    try {
      const response = await apiClient.get(this.paymentsUrl, { params: filter })
      return {
        payments: response.data.data?.payments || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      throw error
    }
  }

  async getPayment(id: string): Promise<Payment> {
    try {
      const response = await apiClient.get(`${this.paymentsUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch payment:', error)
      throw error
    }
  }

  async createPayment(payment: Partial<Payment>): Promise<Payment> {
    try {
      const response = await apiClient.post(this.paymentsUrl, payment)
      return response.data.data
    } catch (error) {
      console.error('Failed to create payment:', error)
      throw error
    }
  }

  async getPaymentStats(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.paymentsUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch payment stats:', error)
      throw error
    }
  }
}

export const financeService = new FinanceService()
