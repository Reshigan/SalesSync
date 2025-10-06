import { apiClient } from '@/lib/api-client'

export interface Brand {
  id?: string
  name: string
  code: string
  category: 'telecom' | 'fmcg' | 'beverage' | 'other'
  logo?: string
  description?: string
  active: boolean
  products?: string[]
  createdAt?: string
}

export interface AgentBrandAssignment {
  id?: string
  agentId: string
  agentName?: string
  brandId: string
  brandName?: string
  assignedDate: string
  expiryDate?: string
  permissions: {
    canDistributeSims: boolean
    canDistributeVouchers: boolean
    canInstallBoards: boolean
    canConductSurveys: boolean
    canDoKYC: boolean
  }
  status: 'active' | 'expired' | 'revoked'
  notes?: string
  createdAt?: string
}

class BrandsService {
  private baseUrl = '/brands'

  // Brands
  async getBrands(filters?: any) {
    return apiClient.get<{ brands: Brand[]; total: number }>(this.baseUrl, { params: filters })
  }

  async getBrandById(id: string) {
    return apiClient.get<Brand>(`${this.baseUrl}/${id}`)
  }

  async createBrand(brand: Brand) {
    return apiClient.post<Brand>(this.baseUrl, brand)
  }

  async updateBrand(id: string, brand: Partial<Brand>) {
    return apiClient.put<Brand>(`${this.baseUrl}/${id}`, brand)
  }

  async deleteBrand(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Agent Brand Assignments
  async getAgentAssignments(agentId?: string) {
    const url = agentId ? `${this.baseUrl}/assignments/agent/${agentId}` : `${this.baseUrl}/assignments`
    return apiClient.get<{ assignments: AgentBrandAssignment[]; total: number }>(url)
  }

  async assignBrandToAgent(assignment: AgentBrandAssignment) {
    return apiClient.post<AgentBrandAssignment>(`${this.baseUrl}/assignments`, assignment)
  }

  async updateAssignment(id: string, assignment: Partial<AgentBrandAssignment>) {
    return apiClient.put<AgentBrandAssignment>(`${this.baseUrl}/assignments/${id}`, assignment)
  }

  async revokeAssignment(id: string) {
    return apiClient.patch<AgentBrandAssignment>(`${this.baseUrl}/assignments/${id}/revoke`)
  }

  async getAgentBrands(agentId: string) {
    return apiClient.get<{ brands: Brand[] }>(`${this.baseUrl}/assignments/agent/${agentId}/brands`)
  }
}

export const brandsService = new BrandsService()
