import { apiClient } from './api.service'

export interface Visit {
  id: string
  agent_id: string
  customer_id: string
  customer_name?: string
  visit_date: string
  visit_type: 'scheduled' | 'ad_hoc' | 'follow_up'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  check_in_time?: string
  check_out_time?: string
  gps_location?: { latitude: number; longitude: number }
  notes?: string
}

export interface AgentLocation {
  agent_id: string
  agent_name: string
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
  status: 'active' | 'idle' | 'offline'
}

export interface Beat {
  id: string
  beat_name: string
  territory_id: string
  agent_id?: string
  customers: string[]
  visit_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  created_at: string
}

class FieldOperationsService {
  private readonly baseUrl = '/field-operations'

  async getVisits(filter?: any): Promise<{ data: Visit[], total: number }> {
    try {
      const response = await apiClient.get('/visits', { params: filter })
      const visits = Array.isArray(response.data.data?.visits) ? response.data.data.visits : 
                     Array.isArray(response.data.data) ? response.data.data : []
      return { data: visits, total: response.data.data?.stats?.total_visits || visits.length }
    } catch (error) {
      console.error('Failed to fetch visits:', error)
      return { data: [], total: 0 }
    }
  }

  async getVisit(id: string): Promise<Visit> {
    try {
      const response = await apiClient.get(`/visits/${id}`)
      return response.data.data?.visit || response.data.data
    } catch (error) {
      console.error('Failed to fetch visit:', error)
      throw error
    }
  }

  async createVisit(data: Partial<Visit>): Promise<any> {
    try {
      const response = await apiClient.post('/visits', data)
      return response.data
    } catch (error) {
      console.error('Failed to create visit:', error)
      throw error
    }
  }

  async updateVisit(id: string, data: Partial<Visit>): Promise<Visit> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/visits/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update visit:', error)
      throw error
    }
  }

  async checkInVisit(id: string, location: { latitude: number; longitude: number }): Promise<Visit> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/visits/${id}/check-in`, { location })
      return response.data.data
    } catch (error) {
      console.error('Failed to check in visit:', error)
      throw error
    }
  }

  async checkOutVisit(id: string, data: any): Promise<Visit> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/visits/${id}/check-out`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to check out visit:', error)
      throw error
    }
  }

  async getLiveLocations(): Promise<AgentLocation[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/live-locations`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch live locations:', error)
      throw error
    }
  }

  async getAgents(filter?: any): Promise<{ data: any[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/agents`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      throw error
    }
  }

  async getAgentPerformance(agentId: string, filter?: any): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/agents/${agentId}/performance`, { params: filter })
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch agent performance:', error)
      throw error
    }
  }

  async getBeats(filter?: any): Promise<{ data: Beat[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/beats`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch beats:', error)
      throw error
    }
  }

  async createBeat(data: Partial<Beat>): Promise<Beat> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/beats`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create beat:', error)
      throw error
    }
  }

  async getFieldOperationsStats(filter?: any): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`, { params: filter })
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch field operations stats:', error)
      throw error
    }
  }
}

export const fieldOperationsService = new FieldOperationsService()
