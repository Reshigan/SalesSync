import { apiClient } from './api.service'

export interface Campaign {
  id: string
  campaign_name: string
  brand_id: string
  brand_name?: string
  start_date: string
  end_date: string
  budget: number
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  target_customers: number
  actual_reach: number
}

export interface BoardInstallation {
  id: string
  board_id: string
  customer_id: string
  customer_name?: string
  installation_date: string
  photo_url?: string
  coverage_percentage?: number
  status: 'pending' | 'installed' | 'removed'
  agent_id: string
}

export interface Activation {
  id: string
  activation_name: string
  campaign_id: string
  location: string
  activation_date: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_promoters: number
  samples_distributed: number
}

class TradeMarketingService {
  private readonly baseUrl = '/field-marketing'

  async getCampaigns(filter?: any): Promise<{ data: Campaign[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/campaigns`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      throw error
    }
  }

  async getCampaign(id: string): Promise<Campaign> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/campaigns/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
      throw error
    }
  }

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/campaigns`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create campaign:', error)
      throw error
    }
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/campaigns/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update campaign:', error)
      throw error
    }
  }

  async getBoardInstallations(filter?: any): Promise<{ data: BoardInstallation[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/board-installations`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch board installations:', error)
      throw error
    }
  }

  async createBoardInstallation(data: Partial<BoardInstallation>): Promise<BoardInstallation> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/board-installations`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create board installation:', error)
      throw error
    }
  }

  async getActivations(filter?: any): Promise<{ data: Activation[], total: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/activations`, { params: filter })
      return { data: response.data.data || [], total: response.data.total || 0 }
    } catch (error) {
      console.error('Failed to fetch activations:', error)
      throw error
    }
  }

  async createActivation(data: Partial<Activation>): Promise<Activation> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/activations`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to create activation:', error)
      throw error
    }
  }

  async getTradeMarketingStats(filter?: any): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`, { params: filter })
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch trade marketing stats:', error)
      throw error
    }
  }
}

export const tradeMarketingService = new TradeMarketingService()
