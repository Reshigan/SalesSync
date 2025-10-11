import { apiClient } from '../lib/api-client'

export interface Board {
  id: string
  name: string
  type: string
  size: string
  dimensions: {
    width: number
    height: number
    unit: 'cm' | 'inch'
  }
  material: string
  description?: string
  isActive: boolean
  brands: BoardBrand[]
  commissionRate: number
  installationCost?: number
  maintenanceCost?: number
  createdAt: string
  updatedAt: string
}

export interface BoardBrand {
  id: string
  boardId: string
  brandId: string
  brandName: string
  commissionRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BoardPlacement {
  id: string
  customerId: string
  agentId: string
  visitId?: string
  boardId: string
  brandId: string
  placementDate: string
  status: 'ACTIVE' | 'REMOVED' | 'DAMAGED' | 'EXPIRED' | 'PENDING_APPROVAL'
  location: string
  latitude?: number
  longitude?: number
  beforePhotoUrl?: string
  afterPhotoUrl?: string
  storefrontPhotoUrl?: string
  coveragePercentage?: number
  qualityScore?: number
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  notes?: string
  commissionAmount?: number
  installationCost?: number
  removalDate?: string
  removalReason?: string
  createdAt: string
  updatedAt: string
  
  // Relationships
  customer?: {
    id: string
    name: string
    address: string
    phone?: string
  }
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  board?: Board
  brand?: {
    id: string
    name: string
    logo?: string
  }
}

export interface StorefrontAnalysis {
  id: string
  boardPlacementId: string
  photoUrl: string
  analysisDate: string
  totalStorefrontArea: number
  boardArea: number
  coveragePercentage: number
  qualityScore: number
  visibility: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  lighting: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  obstruction: 'NONE' | 'MINIMAL' | 'MODERATE' | 'SIGNIFICANT'
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  compliance: boolean
  complianceIssues?: string[]
  recommendations?: string[]
  aiConfidence: number
  manualReview: boolean
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface BoardPlacementSearchParams {
  agentId?: string
  customerId?: string
  boardId?: string
  brandId?: string
  status?: string
  approvalStatus?: string
  dateFrom?: string
  dateTo?: string
  location?: string
  minCoveragePercentage?: number
  minQualityScore?: number
  latitude?: number
  longitude?: number
  radius?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BoardPlacementCreateRequest {
  customerId: string
  boardId: string
  brandId: string
  visitId?: string
  location: string
  latitude?: number
  longitude?: number
  beforePhotoUrl?: string
  afterPhotoUrl?: string
  storefrontPhotoUrl?: string
  notes?: string
  estimatedCoveragePercentage?: number
}

export interface BoardPlacementUpdateRequest extends Partial<BoardPlacementCreateRequest> {
  status?: 'ACTIVE' | 'REMOVED' | 'DAMAGED' | 'EXPIRED'
  coveragePercentage?: number
  qualityScore?: number
  removalDate?: string
  removalReason?: string
}

export interface BoardCreateRequest {
  name: string
  type: string
  size: string
  dimensions: {
    width: number
    height: number
    unit: 'cm' | 'inch'
  }
  material: string
  description?: string
  commissionRate: number
  installationCost?: number
  maintenanceCost?: number
  brandIds?: string[]
}

export interface BoardUpdateRequest extends Partial<BoardCreateRequest> {
  isActive?: boolean
}

class BoardService {
  private baseUrl = '/boards'

  // Board management (Admin)
  async getBoards(params?: {
    type?: string
    size?: string
    isActive?: boolean
    brandId?: string
    page?: number
    limit?: number
  }): Promise<{ boards: Board[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.type) queryParams.append('type', params.type)
    if (params?.size) queryParams.append('size', params.size)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl
    return await apiClient.get<{ boards: Board[]; total: number; page: number; limit: number }>(url)
  }

  async getBoard(id: string): Promise<Board> {
    return await apiClient.get<Board>(`${this.baseUrl}/${id}`)
  }

  async createBoard(data: BoardCreateRequest): Promise<Board> {
    return await apiClient.post<Board>(this.baseUrl, data)
  }

  async updateBoard(id: string, data: BoardUpdateRequest): Promise<Board> {
    return await apiClient.put<Board>(`${this.baseUrl}/${id}`, data)
  }

  async deleteBoard(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Board-Brand associations
  async getBoardBrands(boardId: string): Promise<BoardBrand[]> {
    return await apiClient.get<BoardBrand[]>(`${this.baseUrl}/${boardId}/brands`)
  }

  async addBoardBrand(boardId: string, data: {
    brandId: string
    commissionRate: number
  }): Promise<BoardBrand> {
    return await apiClient.post<BoardBrand>(`${this.baseUrl}/${boardId}/brands`, data)
  }

  async updateBoardBrand(boardId: string, brandId: string, data: {
    commissionRate?: number
    isActive?: boolean
  }): Promise<BoardBrand> {
    return await apiClient.put<BoardBrand>(`${this.baseUrl}/${boardId}/brands/${brandId}`, data)
  }

  async removeBoardBrand(boardId: string, brandId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${boardId}/brands/${brandId}`)
  }

  // Board placements
  async getBoardPlacements(params?: BoardPlacementSearchParams): Promise<{ placements: BoardPlacement[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.boardId) queryParams.append('boardId', params.boardId)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.approvalStatus) queryParams.append('approvalStatus', params.approvalStatus)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.location) queryParams.append('location', params.location)
    if (params?.minCoveragePercentage) queryParams.append('minCoveragePercentage', params.minCoveragePercentage.toString())
    if (params?.minQualityScore) queryParams.append('minQualityScore', params.minQualityScore.toString())
    if (params?.latitude) queryParams.append('latitude', params.latitude.toString())
    if (params?.longitude) queryParams.append('longitude', params.longitude.toString())
    if (params?.radius) queryParams.append('radius', params.radius.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = queryParams.toString() ? `${this.baseUrl}/placements?${queryParams.toString()}` : `${this.baseUrl}/placements`
    return await apiClient.get<{ placements: BoardPlacement[]; total: number; page: number; limit: number }>(url)
  }

  async getBoardPlacement(id: string): Promise<BoardPlacement> {
    return await apiClient.get<BoardPlacement>(`${this.baseUrl}/placements/${id}`)
  }

  async createBoardPlacement(data: BoardPlacementCreateRequest): Promise<BoardPlacement> {
    return await apiClient.post<BoardPlacement>(`${this.baseUrl}/placements`, data)
  }

  async updateBoardPlacement(id: string, data: BoardPlacementUpdateRequest): Promise<BoardPlacement> {
    return await apiClient.put<BoardPlacement>(`${this.baseUrl}/placements/${id}`, data)
  }

  async deleteBoardPlacement(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/placements/${id}`)
  }

  // Board placement approval workflow
  async approveBoardPlacement(id: string, notes?: string): Promise<BoardPlacement> {
    return await apiClient.post<BoardPlacement>(`${this.baseUrl}/placements/${id}/approve`, { notes })
  }

  async rejectBoardPlacement(id: string, reason: string): Promise<BoardPlacement> {
    return await apiClient.post<BoardPlacement>(`${this.baseUrl}/placements/${id}/reject`, { reason })
  }

  async requestApproval(id: string): Promise<BoardPlacement> {
    return await apiClient.post<BoardPlacement>(`${this.baseUrl}/placements/${id}/request-approval`)
  }

  // Photo upload and management
  async uploadBoardPhoto(placementId: string, photoType: 'before' | 'after' | 'storefront', file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('type', photoType)
    
    return await apiClient.upload<{ photoUrl: string }>(`${this.baseUrl}/placements/${placementId}/photos`, formData)
  }

  async deleteBoardPhoto(placementId: string, photoType: 'before' | 'after' | 'storefront'): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/placements/${placementId}/photos/${photoType}`)
  }

  // Storefront coverage analysis
  async analyzeStorefrontCoverage(placementId: string, photoUrl?: string): Promise<StorefrontAnalysis> {
    return await apiClient.post<StorefrontAnalysis>(`${this.baseUrl}/placements/${placementId}/analyze`, {
      photoUrl
    })
  }

  async getStorefrontAnalysis(placementId: string): Promise<StorefrontAnalysis[]> {
    return await apiClient.get<StorefrontAnalysis[]>(`${this.baseUrl}/placements/${placementId}/analysis`)
  }

  async updateStorefrontAnalysis(analysisId: string, data: {
    coveragePercentage?: number
    qualityScore?: number
    visibility?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    lighting?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    obstruction?: 'NONE' | 'MINIMAL' | 'MODERATE' | 'SIGNIFICANT'
    condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
    compliance?: boolean
    complianceIssues?: string[]
    recommendations?: string[]
    manualReview?: boolean
  }): Promise<StorefrontAnalysis> {
    return await apiClient.put<StorefrontAnalysis>(`${this.baseUrl}/analysis/${analysisId}`, data)
  }

  // Board removal
  async removeBoardPlacement(id: string, data: {
    removalDate: string
    removalReason: string
    notes?: string
    photoUrl?: string
  }): Promise<BoardPlacement> {
    return await apiClient.post<BoardPlacement>(`${this.baseUrl}/placements/${id}/remove`, data)
  }

  // Commission calculation
  async calculateCommission(placementId: string): Promise<{
    baseCommission: number
    qualityBonus: number
    coverageBonus: number
    totalCommission: number
    calculationDetails: {
      boardCommissionRate: number
      brandCommissionRate: number
      qualityMultiplier: number
      coverageMultiplier: number
    }
  }> {
    return await apiClient.get<{
      baseCommission: number
      qualityBonus: number
      coverageBonus: number
      totalCommission: number
      calculationDetails: {
        boardCommissionRate: number
        brandCommissionRate: number
        qualityMultiplier: number
        coverageMultiplier: number
      }
    }>(`${this.baseUrl}/placements/${placementId}/commission`)
  }

  // Analytics and reporting
  async getBoardPlacementStats(params?: {
    agentId?: string
    brandId?: string
    boardId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    totalPlacements: number
    activePlacements: number
    removedPlacements: number
    pendingApproval: number
    averageCoveragePercentage: number
    averageQualityScore: number
    totalCommissions: number
    topPerformingBoards: Array<{
      boardId: string
      boardName: string
      placementCount: number
      averageCoverage: number
      averageQuality: number
    }>
    topPerformingBrands: Array<{
      brandId: string
      brandName: string
      placementCount: number
      averageCoverage: number
      averageQuality: number
    }>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.boardId) queryParams.append('boardId', params.boardId)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/placements/stats?${queryParams.toString()}`
      : `${this.baseUrl}/placements/stats`
    
    return await apiClient.get(url)
  }

  async getAgentBoardPerformance(agentId: string, period?: string): Promise<{
    totalPlacements: number
    activePlacements: number
    averageCoverage: number
    averageQuality: number
    totalCommissions: number
    approvalRate: number
    removalRate: number
    topBoards: Array<{
      boardId: string
      boardName: string
      placementCount: number
      averageCoverage: number
    }>
    topBrands: Array<{
      brandId: string
      brandName: string
      placementCount: number
      averageCoverage: number
    }>
  }> {
    const url = period 
      ? `${this.baseUrl}/placements/agent/${agentId}/performance?period=${period}`
      : `${this.baseUrl}/placements/agent/${agentId}/performance`
    
    return await apiClient.get(url)
  }

  // Bulk operations
  async bulkUpdateBoardPlacements(placementIds: string[], updates: Partial<BoardPlacementUpdateRequest>): Promise<{ updated: number; errors: any[] }> {
    return await apiClient.post<{ updated: number; errors: any[] }>(`${this.baseUrl}/placements/bulk-update`, {
      placementIds,
      updates
    })
  }

  async bulkApprovePlacements(placementIds: string[], notes?: string): Promise<{ approved: number; errors: any[] }> {
    return await apiClient.post<{ approved: number; errors: any[] }>(`${this.baseUrl}/placements/bulk-approve`, {
      placementIds,
      notes
    })
  }

  async bulkRejectPlacements(placementIds: string[], reason: string): Promise<{ rejected: number; errors: any[] }> {
    return await apiClient.post<{ rejected: number; errors: any[] }>(`${this.baseUrl}/placements/bulk-reject`, {
      placementIds,
      reason
    })
  }

  // Export and reporting
  async exportBoardPlacements(params?: BoardPlacementSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.boardId) queryParams.append('boardId', params.boardId)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/placements/export?${queryParams.toString()}`
      : `${this.baseUrl}/placements/export`
    
    return await apiClient.download(url)
  }

  // Available boards for placement
  async getAvailableBoards(params?: {
    brandId?: string
    customerType?: string
    location?: string
  }): Promise<Board[]> {
    const queryParams = new URLSearchParams()
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.customerType) queryParams.append('customerType', params.customerType)
    if (params?.location) queryParams.append('location', params.location)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/available?${queryParams.toString()}`
      : `${this.baseUrl}/available`
    
    return await apiClient.get<Board[]>(url)
  }

  // Board placement recommendations
  async getBoardRecommendations(customerId: string, brandId?: string): Promise<Array<{
    board: Board
    suitabilityScore: number
    reasons: string[]
    estimatedCommission: number
    estimatedCoverage: number
  }>> {
    const url = brandId 
      ? `${this.baseUrl}/recommendations?customerId=${customerId}&brandId=${brandId}`
      : `${this.baseUrl}/recommendations?customerId=${customerId}`
    
    return await apiClient.get(url)
  }
}

const boardService = new BoardService()
export default boardService