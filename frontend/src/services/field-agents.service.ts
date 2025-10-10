import { apiClient } from '../lib/api-client'

// ============================================================================
// INTERFACES
// ============================================================================

export interface FieldAgent {
  id: string
  name: string
  email: string
  phone: string
  employeeId: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  territory?: string
  commissionRate: number
  performanceMetrics?: {
    totalVisits: number
    totalCommissions: number
  }
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  businessName?: string
  customerCode?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  creditLimit?: number
  paymentTerms?: string
  status: 'ACTIVE' | 'INACTIVE'
  type: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  distance?: number
  createdAt: string
  updatedAt: string
}

export interface Board {
  id: string
  boardNumber: string
  name?: string
  title?: string
  type: 'BILLBOARD' | 'POSTER' | 'DIGITAL'
  size: string
  dimensions?: {
    width: number
    height: number
  }
  location: string
  latitude?: number
  longitude?: number
  coordinates?: { latitude: number; longitude: number }
  installationDate?: string
  status: 'ACTIVE' | 'INACTIVE' | 'REMOVED'
  agentId?: string
  brandName?: string
  brandId?: string
  competitiveAnalysis?: {
    shareOfVoice: number
  }
  maintenanceRequired?: boolean
  createdAt: string
  updatedAt: string
}

export interface BoardPlacement {
  id: string
  boardId: string
  agentId: string
  fieldAgentId: string
  placementDate: string
  removalDate?: string
  verifiedAt?: string
  status: 'ACTIVE' | 'REMOVED' | 'VERIFIED' | 'PENDING'
  location?: string
  latitude?: number
  longitude?: number
  coordinates?: { lat: number; lng: number }
  imageUrl?: string
  coveragePercentage?: number
  notes?: string
  board?: Board
  agent?: FieldAgent
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id: string
  customerId: string
  agentId: string
  visitDate: string
  purpose: 'SALES' | 'COLLECTION' | 'SURVEY' | 'DELIVERY' | 'OTHER'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  latitude?: number
  longitude?: number
  notes?: string
  duration?: number
  outcome?: string
  createdAt: string
  updatedAt: string
}

export interface ProductDistribution {
  id: string
  productId: string
  productName?: string
  agentId: string
  customerId: string
  quantity: number
  distributionDate: string
  status: 'PENDING' | 'DISTRIBUTED' | 'RETURNED'
  location?: string
  latitude?: number
  longitude?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Commission {
  id: string
  agentId: string
  type: 'SALES' | 'PLACEMENT' | 'COLLECTION' | 'BONUS'
  amount: number
  currency: string
  calculationDate: string
  earnedDate?: string
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED'
  paymentDate?: string
  paidDate?: string
  description?: string
  referenceId?: string
  activityId?: string
  activityType?: 'SALES' | 'PLACEMENT' | 'COLLECTION' | 'BONUS'
  createdAt: string
  updatedAt: string
}

export interface Survey {
  id: string
  title: string
  description?: string
  type: 'MANDATORY' | 'ADHOC'
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  questions: SurveyQuestion[]
  targetAgents?: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface SurveyQuestion {
  id: string
  question: string
  type: 'TEXT' | 'MULTIPLE_CHOICE' | 'RATING' | 'YES_NO'
  required: boolean
  options?: string[]
}

export interface SurveyResponse {
  id: string
  surveyId: string
  agentId: string
  responses: { [questionId: string]: any }
  submittedAt: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class FieldAgentsService {
  private baseUrl = '/field-agents'

  // ============================================================================
  // FIELD AGENTS MANAGEMENT
  // ============================================================================

  async getFieldAgents(filters?: any) {
    return apiClient.get<{ data: FieldAgent[]; pagination: any }>(`${this.baseUrl}`, { params: filters })
  }

  async getFieldAgentById(id: string) {
    return apiClient.get<FieldAgent>(`${this.baseUrl}/${id}`)
  }

  async createFieldAgent(agent: Partial<FieldAgent>) {
    return apiClient.post<FieldAgent>(`${this.baseUrl}`, agent)
  }

  async updateFieldAgent(id: string, agent: Partial<FieldAgent>) {
    return apiClient.put<FieldAgent>(`${this.baseUrl}/${id}`, agent)
  }

  async deleteFieldAgent(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT
  // ============================================================================

  async getCustomers(filters?: any) {
    return apiClient.get<{ data: Customer[]; pagination: any }>('/customers', { params: filters })
  }

  async getCustomerById(id: string) {
    return apiClient.get<Customer>(`/customers/${id}`)
  }

  async createCustomer(customer: Partial<Customer>) {
    return apiClient.post<Customer>('/customers', customer)
  }

  async updateCustomer(id: string, customer: Partial<Customer>) {
    return apiClient.put<Customer>(`/customers/${id}`, customer)
  }

  async deleteCustomer(id: string) {
    return apiClient.delete(`/customers/${id}`)
  }

  async searchCustomers(query: string) {
    return apiClient.get<{ data: Customer[]; pagination: any }>('/customers/search', { params: { q: query } })
  }

  async getNearbyCustomers(latitude: number, longitude: number, radius: number = 5) {
    return apiClient.get<Customer[]>('/customers/nearby', {
      params: { latitude, longitude, radius }
    })
  }

  // ============================================================================
  // BOARD MANAGEMENT
  // ============================================================================

  async getBoards(filters?: any) {
    return apiClient.get<{ data: Board[]; pagination: any }>('/boards', { params: filters })
  }

  async getBoardById(id: string) {
    return apiClient.get<Board>(`/boards/${id}`)
  }

  async createBoard(board: Partial<Board>) {
    return apiClient.post<Board>('/boards', board)
  }

  async updateBoard(id: string, board: Partial<Board>) {
    return apiClient.put<Board>(`/boards/${id}`, board)
  }

  async deleteBoard(id: string) {
    return apiClient.delete(`/boards/${id}`)
  }

  // ============================================================================
  // BOARD PLACEMENT MANAGEMENT
  // ============================================================================

  async getBoardPlacements(filters?: any) {
    return apiClient.get<{ data: BoardPlacement[]; pagination: any }>('/board-placements', { params: filters })
  }

  async getBoardPlacementById(id: string) {
    return apiClient.get<BoardPlacement>(`/board-placements/${id}`)
  }

  async createBoardPlacement(placement: Partial<BoardPlacement>) {
    return apiClient.post<BoardPlacement>('/board-placements', placement)
  }

  async updateBoardPlacement(id: string, placement: Partial<BoardPlacement>) {
    return apiClient.put<BoardPlacement>(`/board-placements/${id}`, placement)
  }

  async deleteBoardPlacement(id: string) {
    return apiClient.delete(`/board-placements/${id}`)
  }

  // ============================================================================
  // VISIT MANAGEMENT
  // ============================================================================

  async getVisits(filters?: any) {
    return apiClient.get<{ data: Visit[]; pagination: any }>('/visits', { params: filters })
  }

  async getVisitById(id: string) {
    return apiClient.get<Visit>(`/visits/${id}`)
  }

  async createVisit(visit: Partial<Visit>) {
    return apiClient.post<Visit>('/visits', visit)
  }

  async updateVisit(id: string, visit: Partial<Visit>) {
    return apiClient.put<Visit>(`/visits/${id}`, visit)
  }

  async deleteVisit(id: string) {
    return apiClient.delete(`/visits/${id}`)
  }

  async checkInVisit(id: string, latitude: number, longitude: number) {
    return apiClient.post(`/visits/${id}/checkin`, { latitude, longitude })
  }

  async checkOutVisit(id: string, notes?: string, outcome?: string) {
    return apiClient.post(`/visits/${id}/checkout`, { notes, outcome })
  }

  // ============================================================================
  // PRODUCT DISTRIBUTION MANAGEMENT
  // ============================================================================

  async getProductDistributions(filters?: any) {
    return apiClient.get<{ data: ProductDistribution[]; pagination: any }>('/product-distributions', { params: filters })
  }

  async getProductDistributionById(id: string) {
    return apiClient.get<ProductDistribution>(`/product-distributions/${id}`)
  }

  async createProductDistribution(distribution: Partial<ProductDistribution>) {
    return apiClient.post<ProductDistribution>('/product-distributions', distribution)
  }

  async updateProductDistribution(id: string, distribution: Partial<ProductDistribution>) {
    return apiClient.put<ProductDistribution>(`/product-distributions/${id}`, distribution)
  }

  async deleteProductDistribution(id: string) {
    return apiClient.delete(`/product-distributions/${id}`)
  }

  // ============================================================================
  // COMMISSION MANAGEMENT
  // ============================================================================

  async getCommissions(filters?: any) {
    return apiClient.get<{ data: Commission[]; pagination: any }>('/commissions', { params: filters })
  }

  async getCommissionById(id: string) {
    return apiClient.get<Commission>(`/commissions/${id}`)
  }

  async createCommission(commission: Partial<Commission>) {
    return apiClient.post<Commission>('/commissions', commission)
  }

  async updateCommission(id: string, commission: Partial<Commission>) {
    return apiClient.put<Commission>(`/commissions/${id}`, commission)
  }

  async deleteCommission(id: string) {
    return apiClient.delete(`/commissions/${id}`)
  }

  async calculateCommissions(agentId: string, startDate: string, endDate: string) {
    return apiClient.post('/commissions/calculate', { agentId, startDate, endDate })
  }

  // ============================================================================
  // SURVEY MANAGEMENT
  // ============================================================================

  async getSurveys(filters?: any) {
    return apiClient.get<{ data: Survey[]; pagination: any }>('/surveys', { params: filters })
  }

  async getSurveyById(id: string) {
    return apiClient.get<Survey>(`/surveys/${id}`)
  }

  async createSurvey(survey: Partial<Survey>) {
    return apiClient.post<Survey>('/surveys', survey)
  }

  async updateSurvey(id: string, survey: Partial<Survey>) {
    return apiClient.put<Survey>(`/surveys/${id}`, survey)
  }

  async deleteSurvey(id: string) {
    return apiClient.delete(`/surveys/${id}`)
  }

  async submitSurveyResponse(surveyId: string, responses: { [questionId: string]: any }) {
    return apiClient.post<SurveyResponse>(`/surveys/${surveyId}/responses`, { responses })
  }

  async getSurveyResponses(surveyId: string) {
    return apiClient.get<{ data: SurveyResponse[]; pagination: any }>(`/surveys/${surveyId}/responses`)
  }

  // ============================================================================
  // GPS AND LOCATION SERVICES
  // ============================================================================

  async validateLocation(latitude: number, longitude: number, targetLatitude: number, targetLongitude: number, radius: number = 100) {
    return apiClient.post('/location/validate', {
      latitude,
      longitude,
      targetLatitude,
      targetLongitude,
      radius
    })
  }

  async updateAgentLocation(agentId: string, latitude: number, longitude: number) {
    return apiClient.post(`${this.baseUrl}/${agentId}/location`, { latitude, longitude })
  }

  // ============================================================================
  // IMAGE UPLOAD AND ANALYTICS
  // ============================================================================

  async uploadImage(file: File, type: 'BOARD_PLACEMENT' | 'VISIT' | 'PRODUCT_DISTRIBUTION', referenceId: string) {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    formData.append('referenceId', referenceId)

    return apiClient.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  async analyzeImage(imageId: string) {
    return apiClient.post(`/images/${imageId}/analyze`)
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getAgentPerformance(agentId: string, startDate: string, endDate: string) {
    return apiClient.get(`${this.baseUrl}/${agentId}/performance`, {
      params: { startDate, endDate }
    })
  }

  async getTeamPerformance(startDate: string, endDate: string) {
    return apiClient.get(`${this.baseUrl}/team/performance`, {
      params: { startDate, endDate }
    })
  }

  async getBoardAnalytics(boardId?: string) {
    const url = boardId ? `/boards/${boardId}/analytics` : '/boards/analytics'
    return apiClient.get(url)
  }

  async getVisitAnalytics(agentId?: string, startDate?: string, endDate?: string) {
    return apiClient.get('/visits/analytics', {
      params: { agentId, startDate, endDate }
    })
  }

  async getCommissionAnalytics(agentId?: string, startDate?: string, endDate?: string) {
    return apiClient.get('/commissions/analytics', {
      params: { agentId, startDate, endDate }
    })
  }

  // ============================================================================
  // COMMISSION MANAGEMENT
  // ============================================================================

  async updateCommissionStatus(id: string, status: string, notes?: string) {
    return apiClient.patch(`/commissions/${id}/status`, { status, notes })
  }

  async processCommissionPayment(commissionIds: string[], paymentDetails: any) {
    return apiClient.post('/commissions/process-payment', {
      commissionIds,
      paymentDetails
    })
  }
}

export const fieldAgentsService = new FieldAgentsService()