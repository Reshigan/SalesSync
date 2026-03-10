/**
 * Audit Service
 * Handles audit trail operations for all entity types
 */

import { apiClient } from './api.service'

export interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string
  action: string
  description: string
  performed_by: string
  performed_by_name?: string
  performed_at: string
  details?: Record<string, any>
  tenant_id: string
  created_at: string
}

class AuditService {
  private readonly baseUrl = '/audit'

  async getAuditTrail(entityType: string, entityId: string): Promise<AuditEntry[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${entityType}/${entityId}`)
      return response.data.data?.auditTrail || []
    } catch (error) {
      console.error('Failed to fetch audit trail:', error)
      return []
    }
  }

  async exportAuditTrail(entityType: string, entityId: string, params: { format: string; date_from?: string; date_to?: string }): Promise<{ download_url: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${entityType}/${entityId}/export`, params)
      return response.data.data
    } catch (error) {
      console.error('Failed to export audit trail:', error)
      throw error
    }
  }

  async getLogs(filter?: { search?: string; action?: string; entity_type?: string; date_from?: string; date_to?: string; page?: number; limit?: number }): Promise<{ logs: AuditEntry[]; total: number }> {
    try {
      const response = await apiClient.get('/audit-logs', { params: filter })
      const data = response.data.data || response.data
      return {
        logs: Array.isArray(data) ? data : data?.logs || [],
        total: data?.total || (Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return { logs: [], total: 0 }
    }
  }

  async getAuditEntry(entityType: string, entityId: string, entryId: string): Promise<AuditEntry | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${entityType}/${entityId}/entries/${entryId}`)
      return response.data.data?.entry || null
    } catch (error) {
      console.error('Failed to fetch audit entry:', error)
      return null
    }
  }
}

export const auditService = new AuditService()
