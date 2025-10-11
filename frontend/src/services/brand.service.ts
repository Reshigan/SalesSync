// Comprehensive Brand Management Service
import apiClient from '@/lib/api-client'

export interface Brand {
  id: string
  name: string
  code: string
  description?: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  category: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  settings: BrandSettings
  requirements: BrandRequirements
  performance: BrandPerformance
  createdAt: string
  updatedAt: string
}

export interface BrandSettings {
  allowedRegions: string[]
  targetAudience: string[]
  seasonality: {
    peak: string[]
    low: string[]
  }
  budgetAllocation: {
    boardPlacements: number
    productDistribution: number
    fieldMarketing: number
  }
  commissionRates: {
    boardPlacement: number
    productDistribution: number
    visitCompletion: number
    customerAcquisition: number
  }
  qualityStandards: {
    minBoardSize: string
    preferredLocations: string[]
    photoRequirements: string[]
    visitDuration: number
  }
}

export interface BrandRequirements {
  mandatorySurveys: string[]
  requiredPhotos: string[]
  minimumVisitDuration: number
  requiredDocuments: string[]
  complianceChecks: string[]
  trainingRequired: boolean
  certificationNeeded: boolean
}

export interface BrandPerformance {
  totalBoards: number
  activeBoards: number
  totalVisits: number
  completedVisits: number
  totalProducts: number
  distributedProducts: number
  totalCommissions: number
  averageRating: number
  customerSatisfaction: number
  marketShare: number
  roi: number
  trends: {
    visits: Array<{ date: string; count: number }>
    boards: Array<{ date: string; count: number }>
    products: Array<{ date: string; count: number }>
    revenue: Array<{ date: string; amount: number }>
  }
}

export interface Campaign {
  id: string
  brandId: string
  name: string
  description: string
  type: 'BOARD_PLACEMENT' | 'PRODUCT_LAUNCH' | 'AWARENESS' | 'PROMOTION'
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  endDate: string
  budget: number
  spentBudget: number
  targetRegions: string[]
  targetAudience: string[]
  objectives: CampaignObjective[]
  requirements: CampaignRequirement[]
  performance: CampaignPerformance
  createdAt: string
  updatedAt: string
}

export interface CampaignObjective {
  type: 'VISITS' | 'BOARDS' | 'PRODUCTS' | 'REVENUE' | 'AWARENESS'
  target: number
  achieved: number
  unit: string
}

export interface CampaignRequirement {
  type: 'SURVEY' | 'PHOTO' | 'DOCUMENT' | 'TRAINING'
  description: string
  mandatory: boolean
  deadline?: string
}

export interface CampaignPerformance {
  totalVisits: number
  completedVisits: number
  totalBoards: number
  activeBoardPlacements: number
  totalProducts: number
  distributedProducts: number
  totalRevenue: number
  costPerVisit: number
  costPerBoard: number
  costPerProduct: number
  roi: number
  engagementRate: number
}

export interface BrandFilters {
  status?: Brand['status']
  category?: string
  region?: string
  search?: string
  createdAfter?: string
  createdBefore?: string
}

export interface BrandsResponse {
  brands: Brand[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateBrandRequest {
  name: string
  code: string
  description?: string
  category: string
  primaryColor: string
  secondaryColor: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  address?: Brand['address']
  settings?: Partial<BrandSettings>
  requirements?: Partial<BrandRequirements>
}

export interface UpdateBrandRequest {
  name?: string
  description?: string
  category?: string
  primaryColor?: string
  secondaryColor?: string
  status?: Brand['status']
  website?: string
  contactEmail?: string
  contactPhone?: string
  address?: Brand['address']
  settings?: Partial<BrandSettings>
  requirements?: Partial<BrandRequirements>
}

class BrandService {
  // Get brands with filtering and pagination
  async getBrands(params: {
    page?: number
    limit?: number
    filters?: BrandFilters
  } = {}): Promise<BrandsResponse> {
    const { page = 1, limit = 20, filters = {} } = params
    
    const queryParams = {
      page,
      limit,
      ...filters
    }

    return apiClient.get('/brands', { params: queryParams })
  }

  // Get single brand by ID
  async getBrand(brandId: string): Promise<Brand> {
    return apiClient.get(`/brands/${brandId}`)
  }

  // Get brand by code
  async getBrandByCode(code: string): Promise<Brand> {
    return apiClient.get(`/brands/code/${code}`)
  }

  // Create new brand
  async createBrand(brandData: CreateBrandRequest): Promise<Brand> {
    return apiClient.post('/brands', brandData)
  }

  // Update brand
  async updateBrand(brandId: string, updates: UpdateBrandRequest): Promise<Brand> {
    return apiClient.put(`/brands/${brandId}`, updates)
  }

  // Delete brand
  async deleteBrand(brandId: string): Promise<void> {
    return apiClient.delete(`/brands/${brandId}`)
  }

  // Update brand status
  async updateBrandStatus(brandId: string, status: Brand['status']): Promise<Brand> {
    return apiClient.patch(`/brands/${brandId}/status`, { status })
  }

  // Search brands
  async searchBrands(query: string, filters?: BrandFilters): Promise<Brand[]> {
    const params = { query, ...filters }
    const response = await apiClient.get('/brands/search', { params })
    return response.brands
  }

  // Get active brands
  async getActiveBrands(): Promise<Brand[]> {
    const response = await apiClient.get('/brands/active')
    return response.brands
  }

  // Get brands by category
  async getBrandsByCategory(category: string): Promise<Brand[]> {
    const response = await apiClient.get(`/brands/category/${category}`)
    return response.brands
  }

  // Upload brand logo
  async uploadLogo(brandId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('logo', file)

    return apiClient.post(`/brands/${brandId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // Delete brand logo
  async deleteLogo(brandId: string): Promise<void> {
    return apiClient.delete(`/brands/${brandId}/logo`)
  }

  // Brand performance analytics
  async getBrandPerformance(brandId: string, timeRange?: string): Promise<BrandPerformance> {
    const params = timeRange ? { timeRange } : {}
    return apiClient.get(`/brands/${brandId}/performance`, { params })
  }

  // Get brand analytics
  async getBrandAnalytics(timeRange?: string): Promise<{
    totalBrands: number
    activeBrands: number
    topPerformingBrands: Array<{
      brandId: string
      name: string
      performance: number
      revenue: number
    }>
    categoryDistribution: Record<string, number>
    regionDistribution: Record<string, number>
    performanceTrends: Array<{
      date: string
      visits: number
      boards: number
      products: number
      revenue: number
    }>
  }> {
    const params = timeRange ? { timeRange } : {}
    return apiClient.get('/brands/analytics', { params })
  }

  // Campaign management
  async getCampaigns(brandId?: string, params: {
    page?: number
    limit?: number
    status?: Campaign['status']
    type?: Campaign['type']
  } = {}): Promise<{
    campaigns: Campaign[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const queryParams = brandId ? { brandId, ...params } : params
    return apiClient.get('/campaigns', { params: queryParams })
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    return apiClient.get(`/campaigns/${campaignId}`)
  }

  async createCampaign(campaignData: {
    brandId: string
    name: string
    description: string
    type: Campaign['type']
    startDate: string
    endDate: string
    budget: number
    targetRegions: string[]
    targetAudience: string[]
    objectives: CampaignObjective[]
    requirements: CampaignRequirement[]
  }): Promise<Campaign> {
    return apiClient.post('/campaigns', campaignData)
  }

  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    return apiClient.put(`/campaigns/${campaignId}`, updates)
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    return apiClient.delete(`/campaigns/${campaignId}`)
  }

  async updateCampaignStatus(campaignId: string, status: Campaign['status']): Promise<Campaign> {
    return apiClient.patch(`/campaigns/${campaignId}/status`, { status })
  }

  // Campaign performance
  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance> {
    return apiClient.get(`/campaigns/${campaignId}/performance`)
  }

  // Brand requirements management
  async updateBrandRequirements(brandId: string, requirements: BrandRequirements): Promise<Brand> {
    return apiClient.patch(`/brands/${brandId}/requirements`, requirements)
  }

  async getBrandRequirements(brandId: string): Promise<BrandRequirements> {
    return apiClient.get(`/brands/${brandId}/requirements`)
  }

  // Brand settings management
  async updateBrandSettings(brandId: string, settings: BrandSettings): Promise<Brand> {
    return apiClient.patch(`/brands/${brandId}/settings`, settings)
  }

  async getBrandSettings(brandId: string): Promise<BrandSettings> {
    return apiClient.get(`/brands/${brandId}/settings`)
  }

  // Brand compliance
  async checkBrandCompliance(brandId: string, agentId: string): Promise<{
    compliant: boolean
    requirements: Array<{
      type: string
      description: string
      status: 'COMPLETED' | 'PENDING' | 'FAILED'
      completedAt?: string
    }>
    score: number
  }> {
    return apiClient.get(`/brands/${brandId}/compliance/${agentId}`)
  }

  // Brand territories
  async getBrandTerritories(brandId: string): Promise<Array<{
    id: string
    name: string
    region: string
    agents: number
    performance: number
  }>> {
    return apiClient.get(`/brands/${brandId}/territories`)
  }

  async assignBrandToTerritory(brandId: string, territoryId: string): Promise<void> {
    return apiClient.post(`/brands/${brandId}/territories/${territoryId}`)
  }

  async removeBrandFromTerritory(brandId: string, territoryId: string): Promise<void> {
    return apiClient.delete(`/brands/${brandId}/territories/${territoryId}`)
  }

  // Brand agents
  async getBrandAgents(brandId: string): Promise<Array<{
    id: string
    name: string
    email: string
    territory: string
    performance: number
    certificationStatus: 'CERTIFIED' | 'PENDING' | 'EXPIRED'
  }>> {
    return apiClient.get(`/brands/${brandId}/agents`)
  }

  async assignAgentToBrand(brandId: string, agentId: string): Promise<void> {
    return apiClient.post(`/brands/${brandId}/agents/${agentId}`)
  }

  async removeAgentFromBrand(brandId: string, agentId: string): Promise<void> {
    return apiClient.delete(`/brands/${brandId}/agents/${agentId}`)
  }

  // Brand training and certification
  async getBrandTraining(brandId: string): Promise<Array<{
    id: string
    title: string
    description: string
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'WEBINAR'
    duration: number
    mandatory: boolean
    completionRate: number
  }>> {
    return apiClient.get(`/brands/${brandId}/training`)
  }

  async createBrandTraining(brandId: string, trainingData: {
    title: string
    description: string
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'WEBINAR'
    content: string
    duration: number
    mandatory: boolean
  }): Promise<void> {
    return apiClient.post(`/brands/${brandId}/training`, trainingData)
  }

  // Brand reporting
  async generateBrandReport(brandId: string, params: {
    type: 'PERFORMANCE' | 'COMPLIANCE' | 'FINANCIAL' | 'OPERATIONAL'
    dateFrom: string
    dateTo: string
    format: 'PDF' | 'EXCEL' | 'CSV'
  }): Promise<Blob> {
    return apiClient.get(`/brands/${brandId}/reports`, {
      params,
      responseType: 'blob'
    })
  }

  // Bulk operations
  async bulkUpdateBrands(brandIds: string[], updates: UpdateBrandRequest): Promise<Brand[]> {
    return apiClient.patch('/brands/bulk', { brandIds, updates })
  }

  async bulkDeleteBrands(brandIds: string[]): Promise<void> {
    return apiClient.delete('/brands/bulk', { data: { brandIds } })
  }

  // Import/Export brands
  async importBrands(file: File): Promise<{
    imported: number
    failed: number
    errors: string[]
  }> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/brands/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async exportBrands(filters?: BrandFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = { ...filters, format }
    return apiClient.get('/brands/export', {
      params,
      responseType: 'blob'
    })
  }

  // Brand validation
  async validateBrandCode(code: string): Promise<{ available: boolean; suggestions?: string[] }> {
    return apiClient.post('/brands/validate/code', { code })
  }

  async validateBrandName(name: string): Promise<{ available: boolean; suggestions?: string[] }> {
    return apiClient.post('/brands/validate/name', { name })
  }
}

const brandService = new BrandService()
export default brandService