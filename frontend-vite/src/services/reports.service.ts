/**
import { API_CONFIG } from '../config/api.config'
 * Reports Service
 * Handles report generation and analytics
 */

import { apiClient } from './api.service'

export interface Report {
  id: string
  tenant_id: string
  report_type: string
  report_name: string
  generated_by: string
  generated_at: string
  status: 'pending' | 'completed' | 'failed'
  file_path?: string
  file_size?: number
  parameters?: any
}

export interface ReportTemplate {
  id: string
  name: string
  type: string
  description: string
  parameters: any[]
  format: 'pdf' | 'excel' | 'csv'
}

export interface ReportStats {
  total_reports: number
  completed_reports: number
  pending_reports: number
  failed_reports: number
  recent_reports: Report[]
  popular_types: Array<{
    type: string
    count: number
  }>
}

class ReportsService {
  private readonly baseUrl = API_CONFIG.ENDPOINTS.REPORTS.BASE
  // Build full URL using centralized config
  private buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
  }

  async getReports(filter?: any): Promise<{ reports: Report[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        reports: response.data.data?.reports || response.data.data || [],
        total: response.data.data?.pagination?.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      throw error
    }
  }

  async getReport(id: string): Promise<Report> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch report:', error)
      throw error
    }
  }

  async generateReport(params: {
    report_type: string
    parameters?: any
    format?: 'pdf' | 'excel' | 'csv'
  }): Promise<Report> {
    try {
      const response = await apiClient.post(this.baseUrl, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to generate report:', error)
      throw error
    }
  }

  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${reportId}/download`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Failed to download report:', error)
      throw error
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete report:', error)
      throw error
    }
  }

  async getReportStats(): Promise<ReportStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch report stats:', error)
      throw error
    }
  }

  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/templates`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch report templates:', error)
      return []
    }
  }

  async scheduleReport(params: {
    report_type: string
    schedule: string // cron expression
    parameters?: any
    format?: 'pdf' | 'excel' | 'csv'
    recipients?: string[]
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/schedule`, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to schedule report:', error)
      throw error
    }
  }

  // Specific report types
  async generateSalesReport(params: {
    date_from: string
    date_to: string
    group_by?: 'day' | 'week' | 'month'
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/sales`, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to generate sales report:', error)
      throw error
    }
  }

  async generateInventoryReport(params?: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/inventory`, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to generate inventory report:', error)
      throw error
    }
  }

  async generateCustomerReport(params?: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customers`, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to generate customer report:', error)
      throw error
    }
  }

  async generateFinancialReport(params: {
    date_from: string
    date_to: string
    type: 'income' | 'expenses' | 'profit_loss' | 'balance_sheet'
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/financial`, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to generate financial report:', error)
      throw error
    }
  }
}

export const reportsService = new ReportsService()
