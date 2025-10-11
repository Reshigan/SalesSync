import { apiClient } from '../lib/api-client'

export interface Visit {
  id: string
  customerId: string
  agentId: string
  scheduledDate: string
  actualDate?: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  purpose: string
  notes?: string
  latitude?: number
  longitude?: number
  checkInTime?: string
  checkOutTime?: string
  duration?: number
  gpsAccuracy?: number
  distanceFromCustomer?: number
  manualLocationOverride?: boolean
  overrideReason?: string
  createdAt: string
  updatedAt: string
  
  // Relationships
  customer?: {
    id: string
    name: string
    address: string
    phone?: string
    latitude?: number
    longitude?: number
  }
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  surveys?: Survey[]
  boardPlacements?: BoardPlacement[]
  productDistributions?: ProductDistribution[]
}

export interface Survey {
  id: string
  visitId: string
  surveyTemplateId: string
  title: string
  type: 'MANDATORY' | 'ADHOC' | 'BRAND_SPECIFIC'
  brandId?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  responses: SurveyResponse[]
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SurveyResponse {
  id: string
  surveyId: string
  questionId: string
  questionText: string
  questionType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING' | 'PHOTO'
  response: any
  photoUrls?: string[]
  notes?: string
}

export interface BoardPlacement {
  id: string
  visitId?: string
  customerId: string
  agentId: string
  boardId: string
  boardType: string
  boardSize: string
  brandId: string
  brandName: string
  placementDate: string
  status: 'ACTIVE' | 'REMOVED' | 'DAMAGED' | 'EXPIRED'
  location: string
  latitude?: number
  longitude?: number
  beforePhotoUrl?: string
  afterPhotoUrl?: string
  storefrontPhotoUrl?: string
  coveragePercentage?: number
  qualityScore?: number
  notes?: string
  commissionAmount?: number
  createdAt: string
  updatedAt: string
}

export interface ProductDistribution {
  id: string
  visitId?: string
  customerId: string
  agentId: string
  productId: string
  productName: string
  productType: 'SIM_CARD' | 'PHONE' | 'ACCESSORY' | 'MARKETING_MATERIAL'
  quantity: number
  distributionDate: string
  recipientName: string
  recipientPhone?: string
  recipientIdNumber?: string
  recipientSignature?: string
  status: 'PENDING' | 'DISTRIBUTED' | 'RETURNED'
  notes?: string
  photoUrl?: string
  commissionAmount?: number
  createdAt: string
  updatedAt: string
}

export interface VisitList {
  id: string
  agentId: string
  name: string
  description?: string
  date: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  brandIds: string[]
  customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  estimatedDuration: number
  visits: Visit[]
  createdAt: string
  updatedAt: string
}

export interface VisitSearchParams {
  agentId?: string
  customerId?: string
  status?: string
  purpose?: string
  dateFrom?: string
  dateTo?: string
  brandId?: string
  latitude?: number
  longitude?: number
  radius?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface VisitCreateRequest {
  customerId: string
  scheduledDate: string
  purpose: string
  notes?: string
  brandIds?: string[]
  estimatedDuration?: number
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export interface VisitUpdateRequest extends Partial<VisitCreateRequest> {
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  actualDate?: string
  checkInTime?: string
  checkOutTime?: string
  latitude?: number
  longitude?: number
  gpsAccuracy?: number
  manualLocationOverride?: boolean
  overrideReason?: string
}

export interface CheckInRequest {
  latitude: number
  longitude: number
  gpsAccuracy: number
  notes?: string
  manualOverride?: boolean
  overrideReason?: string
}

export interface CheckOutRequest {
  latitude: number
  longitude: number
  notes?: string
  completionStatus: 'COMPLETED' | 'PARTIAL' | 'CANCELLED'
}

class VisitService {
  private baseUrl = '/visits'

  // Visit CRUD operations
  async getVisits(params?: VisitSearchParams): Promise<{ visits: Visit[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.purpose) queryParams.append('purpose', params.purpose)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.latitude) queryParams.append('latitude', params.latitude.toString())
    if (params?.longitude) queryParams.append('longitude', params.longitude.toString())
    if (params?.radius) queryParams.append('radius', params.radius.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl
    return await apiClient.get<{ visits: Visit[]; total: number; page: number; limit: number }>(url)
  }

  async getVisit(id: string): Promise<Visit> {
    return await apiClient.get<Visit>(`${this.baseUrl}/${id}`)
  }

  async createVisit(data: VisitCreateRequest): Promise<Visit> {
    return await apiClient.post<Visit>(this.baseUrl, data)
  }

  async updateVisit(id: string, data: VisitUpdateRequest): Promise<Visit> {
    return await apiClient.put<Visit>(`${this.baseUrl}/${id}`, data)
  }

  async deleteVisit(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Visit status management
  async checkIn(visitId: string, data: CheckInRequest): Promise<Visit> {
    return await apiClient.post<Visit>(`${this.baseUrl}/${visitId}/check-in`, data)
  }

  async checkOut(visitId: string, data: CheckOutRequest): Promise<Visit> {
    return await apiClient.post<Visit>(`${this.baseUrl}/${visitId}/check-out`, data)
  }

  async startVisit(visitId: string, latitude: number, longitude: number): Promise<Visit> {
    return await apiClient.post<Visit>(`${this.baseUrl}/${visitId}/start`, {
      latitude,
      longitude
    })
  }

  async completeVisit(visitId: string, data: {
    latitude: number
    longitude: number
    notes?: string
    completionStatus: 'COMPLETED' | 'PARTIAL'
  }): Promise<Visit> {
    return await apiClient.post<Visit>(`${this.baseUrl}/${visitId}/complete`, data)
  }

  async cancelVisit(visitId: string, reason: string): Promise<Visit> {
    return await apiClient.post<Visit>(`${this.baseUrl}/${visitId}/cancel`, { reason })
  }

  // GPS and location validation
  async validateVisitLocation(visitId: string, latitude: number, longitude: number): Promise<{
    isValid: boolean
    distance: number
    accuracy: string
    allowManualOverride: boolean
    customerLocation: { latitude: number; longitude: number }
  }> {
    return await apiClient.post<{
      isValid: boolean
      distance: number
      accuracy: string
      allowManualOverride: boolean
      customerLocation: { latitude: number; longitude: number }
    }>(`${this.baseUrl}/${visitId}/validate-location`, {
      latitude,
      longitude
    })
  }

  // Visit lists management
  async getVisitLists(agentId?: string): Promise<VisitList[]> {
    const url = agentId ? `${this.baseUrl}/lists?agentId=${agentId}` : `${this.baseUrl}/lists`
    return await apiClient.get<VisitList[]>(url)
  }

  async getVisitList(id: string): Promise<VisitList> {
    return await apiClient.get<VisitList>(`${this.baseUrl}/lists/${id}`)
  }

  async createVisitList(data: {
    name: string
    description?: string
    date: string
    brandIds: string[]
    customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    customerIds: string[]
  }): Promise<VisitList> {
    return await apiClient.post<VisitList>(`${this.baseUrl}/lists`, data)
  }

  async updateVisitList(id: string, data: Partial<{
    name: string
    description: string
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }>): Promise<VisitList> {
    return await apiClient.put<VisitList>(`${this.baseUrl}/lists/${id}`, data)
  }

  async deleteVisitList(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/lists/${id}`)
  }

  // Dynamic visit list generation
  async generateVisitList(params: {
    date: string
    brandIds: string[]
    customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
    maxCustomers?: number
    radius?: number
    centerLatitude?: number
    centerLongitude?: number
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }): Promise<{
    suggestedCustomers: Array<{
      customer: any
      distance?: number
      lastVisitDate?: string
      priority: number
      reason: string
    }>
    estimatedDuration: number
    totalDistance: number
  }> {
    return await apiClient.post<{
      suggestedCustomers: Array<{
        customer: any
        distance?: number
        lastVisitDate?: string
        priority: number
        reason: string
      }>
      estimatedDuration: number
      totalDistance: number
    }>(`${this.baseUrl}/generate-list`, params)
  }

  // Survey management
  async getVisitSurveys(visitId: string): Promise<Survey[]> {
    return await apiClient.get<Survey[]>(`${this.baseUrl}/${visitId}/surveys`)
  }

  async startSurvey(visitId: string, surveyTemplateId: string): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${visitId}/surveys`, {
      surveyTemplateId
    })
  }

  async submitSurveyResponse(surveyId: string, responses: Array<{
    questionId: string
    response: any
    photoUrls?: string[]
    notes?: string
  }>): Promise<Survey> {
    return await apiClient.post<Survey>(`/surveys/${surveyId}/responses`, {
      responses
    })
  }

  async completeSurvey(surveyId: string): Promise<Survey> {
    return await apiClient.post<Survey>(`/surveys/${surveyId}/complete`)
  }

  // Board placement during visits
  async getVisitBoardPlacements(visitId: string): Promise<BoardPlacement[]> {
    return await apiClient.get<BoardPlacement[]>(`${this.baseUrl}/${visitId}/board-placements`)
  }

  async createBoardPlacement(visitId: string, data: {
    boardId: string
    brandId: string
    location: string
    latitude?: number
    longitude?: number
    beforePhotoUrl?: string
    afterPhotoUrl?: string
    storefrontPhotoUrl?: string
    notes?: string
  }): Promise<BoardPlacement> {
    return await apiClient.post<BoardPlacement>(`${this.baseUrl}/${visitId}/board-placements`, data)
  }

  // Product distribution during visits
  async getVisitProductDistributions(visitId: string): Promise<ProductDistribution[]> {
    return await apiClient.get<ProductDistribution[]>(`${this.baseUrl}/${visitId}/product-distributions`)
  }

  async createProductDistribution(visitId: string, data: {
    productId: string
    quantity: number
    recipientName: string
    recipientPhone?: string
    recipientIdNumber?: string
    notes?: string
    photoUrl?: string
  }): Promise<ProductDistribution> {
    return await apiClient.post<ProductDistribution>(`${this.baseUrl}/${visitId}/product-distributions`, data)
  }

  // Analytics and reporting
  async getVisitStats(params?: {
    agentId?: string
    dateFrom?: string
    dateTo?: string
    brandId?: string
  }): Promise<{
    totalVisits: number
    completedVisits: number
    cancelledVisits: number
    noShowVisits: number
    averageDuration: number
    totalDistance: number
    completionRate: number
    onTimeRate: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.brandId) queryParams.append('brandId', params.brandId)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/stats?${queryParams.toString()}`
      : `${this.baseUrl}/stats`
    
    return await apiClient.get(url)
  }

  async getAgentVisitPerformance(agentId: string, period?: string): Promise<{
    totalVisits: number
    completedVisits: number
    completionRate: number
    averageDuration: number
    totalCommissions: number
    boardPlacements: number
    productDistributions: number
    surveysCompleted: number
    customerSatisfaction: number
  }> {
    const url = period 
      ? `${this.baseUrl}/agent/${agentId}/performance?period=${period}`
      : `${this.baseUrl}/agent/${agentId}/performance`
    
    return await apiClient.get(url)
  }

  // Bulk operations
  async bulkUpdateVisits(visitIds: string[], updates: Partial<VisitUpdateRequest>): Promise<{ updated: number; errors: any[] }> {
    return await apiClient.post<{ updated: number; errors: any[] }>(`${this.baseUrl}/bulk-update`, {
      visitIds,
      updates
    })
  }

  async bulkScheduleVisits(visits: Array<{
    customerId: string
    scheduledDate: string
    purpose: string
    notes?: string
  }>): Promise<{ created: number; errors: any[] }> {
    return await apiClient.post<{ created: number; errors: any[] }>(`${this.baseUrl}/bulk-schedule`, {
      visits
    })
  }

  // Export and reporting
  async exportVisits(params?: VisitSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/export?${queryParams.toString()}`
      : `${this.baseUrl}/export`
    
    return await apiClient.download(url)
  }
}

const visitService = new VisitService()
export default visitService