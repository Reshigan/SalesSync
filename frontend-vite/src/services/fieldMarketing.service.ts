import { apiClient } from './api.service'

export interface GPSValidationRequest {
  customerId: number
  latitude: number
  longitude: number
  accuracy: number
}

export interface GPSValidationResponse {
  valid: boolean
  distance: number
  requiredDistance: number
  customerLocation: {
    latitude: number
    longitude: number
  }
}

export interface CustomerSearchParams {
  query?: string
  latitude?: number
  longitude?: number
  radius?: number
}

export interface Customer {
  id: number
  name: string
  code: string
  phone: string
  address: string
  latitude?: number
  longitude?: number
  distance?: number
  has_location: boolean
}

export interface Visit {
  id: number
  visit_code: string
  agent_id: number
  customer_id: number
  customer_name?: string
  visit_type: string
  visit_status: string
  start_time: string
  end_time?: string
  start_latitude: number
  start_longitude: number
  end_latitude?: number
  end_longitude?: number
  selected_brands: string[]
  gps_validation_passed: boolean
  visit_notes?: string
}

export interface CreateVisitRequest {
  customerId: number
  visitType: string
  startLatitude: number
  startLongitude: number
  selectedBrands: number[]
}

export interface Board {
  id: number
  board_name: string
  board_type: string
  brand_id: number
  brand_name?: string
  board_size: string
  commission_rate: number
  is_active: boolean
}

export interface BoardPlacement {
  id: number
  placement_code: string
  visit_id: number
  board_id: number
  customer_id: number
  agent_id: number
  placement_status: string
  latitude: number
  longitude: number
  placement_photo_url: string
  storefront_coverage_percentage: number
  quality_score: number
  visibility_score: number
  commission_amount: number
  commission_status: string
  placement_notes?: string
}

export interface CreateBoardPlacementRequest {
  visitId: number
  boardId: number
  customerId: number
  latitude: number
  longitude: number
  placementPhotoUrl: string
  storefrontCoveragePercentage: number
  qualityScore: number
  visibilityScore: number
  placementNotes?: string
}

export interface ProductDistribution {
  id: number
  distribution_code: string
  visit_id: number
  product_id: number
  product_name?: string
  agent_id: number
  customer_id: number
  distribution_status: string
  product_type: string
  product_serial_number: string
  quantity: number
  recipient_name: string
  recipient_id_number: string
  recipient_phone: string
  recipient_address: string
  recipient_signature_url: string
  recipient_photo_url: string
  id_document_photo_url: string
  form_data: any
  latitude: number
  longitude: number
  commission_amount: number
  commission_status: string
  distribution_notes?: string
}

export interface CreateProductDistributionRequest {
  visitId: number
  productId: number
  customerId: number
  productType: string
  productSerialNumber: string
  quantity: number
  recipientName: string
  recipientIdNumber: string
  recipientPhone: string
  recipientAddress: string
  recipientSignatureUrl: string
  recipientPhotoUrl: string
  idDocumentPhotoUrl: string
  formData: any
  latitude: number
  longitude: number
  distributionNotes?: string
}

export interface Commission {
  id: number
  agent_id: number
  visit_id: number
  visit_code?: string
  customer_name?: string
  commission_type: string
  reference_type: string
  reference_id: number
  commission_amount: number
  commission_status: string
  earned_date: string
}

export interface CommissionTotals {
  pending: number
  approved: number
  paid: number
}

export interface Survey {
  id: number
  survey_name: string
  survey_type: string
  survey_scope: string
  brand_id?: number
}

export interface SurveySubmission {
  visitId: number
  surveyId: number
  customerId: number
  surveyType: string
  surveyScope: string
  brandId?: number
  responses: any[]
}

class FieldMarketingService {
  async validateGPS(data: GPSValidationRequest): Promise<GPSValidationResponse> {
    const response = await apiClient.post('/field-marketing/gps/validate', data)
    return response.data
  }

  async searchCustomers(params: CustomerSearchParams): Promise<{ customers: Customer[] }> {
    const response = await apiClient.get('/field-marketing/customers/search', { params })
    return response.data
  }

  async createVisit(data: CreateVisitRequest): Promise<{ visit: Visit }> {
    const response = await apiClient.post('/field-marketing/visits', data)
    return response.data
  }

  async getVisits(params?: { status?: string; startDate?: string; endDate?: string }): Promise<{ visits: Visit[] }> {
    const response = await apiClient.get('/field-marketing/visits', { params })
    return response.data
  }

  async getVisitDetails(visitId: number): Promise<{
    visit: Visit
    boardPlacements: BoardPlacement[]
    productDistributions: ProductDistribution[]
    surveys: any[]
  }> {
    const response = await apiClient.get(`/field-marketing/visits/${visitId}`)
    return response.data
  }

  async completeVisit(visitId: number, data: {
    endLatitude: number
    endLongitude: number
    visitNotes?: string
  }): Promise<{ visit: Visit }> {
    const response = await apiClient.put(`/field-marketing/visits/${visitId}/complete`, data)
    return response.data
  }

  async getBoards(brandId?: number): Promise<{ boards: Board[] }> {
    const response = await apiClient.get('/field-marketing/boards', { params: { brandId } })
    return response.data
  }

  async createBoardPlacement(data: CreateBoardPlacementRequest): Promise<{ placement: BoardPlacement }> {
    const response = await apiClient.post('/field-marketing/board-placements', data)
    return response.data
  }

  async createProductDistribution(data: CreateProductDistributionRequest): Promise<{ distribution: ProductDistribution }> {
    const response = await apiClient.post('/field-marketing/product-distributions', data)
    return response.data
  }

  async getCommissions(params?: {
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    commissions: Commission[]
    totals: CommissionTotals
  }> {
    const response = await apiClient.get('/field-marketing/commissions', { params })
    return response.data
  }

  async submitSurvey(data: SurveySubmission): Promise<{ survey: any }> {
    const response = await apiClient.post('/field-marketing/surveys/submit', data)
    return response.data
  }

  async getSurveys(params?: { status?: string; survey_type?: string }): Promise<{ surveys: Survey[] }> {
    const response = await apiClient.get('/surveys', { params })
    return response.data
  }

  async getSurveyResponses(surveyId: number): Promise<{ responses: any[] }> {
    const response = await apiClient.get(`/surveys/${surveyId}/responses`)
    return response.data
  }

  async getSurveyStats(): Promise<{ stats: any }> {
    const response = await apiClient.get('/surveys/stats')
    return response.data
  }

  async getStoreAudits(params?: { status?: string; customer_id?: string }): Promise<{ audits: any[] }> {
    const response = await apiClient.get('/store-audits', { params })
    return response.data
  }

  async getStoreAudit(auditId: number): Promise<{ audit: any; items: any[] }> {
    const response = await apiClient.get(`/store-audits/${auditId}`)
    return response.data
  }

  async createStoreAudit(data: {
    customer_id: string
    audit_type: string
    scheduled_date?: string
    notes?: string
  }): Promise<{ audit: any }> {
    const response = await apiClient.post('/store-audits', data)
    return response.data
  }

  async startStoreAudit(auditId: number, data: { latitude?: number; longitude?: number }): Promise<{ audit: any }> {
    const response = await apiClient.post(`/store-audits/${auditId}/start`, data)
    return response.data
  }

  async addStoreAuditItem(auditId: number, data: {
    category: string
    item_name: string
    expected_value?: string
    actual_value?: string
    compliance_status?: string
    photo_url?: string
    notes?: string
  }): Promise<{ item: any }> {
    const response = await apiClient.post(`/store-audits/${auditId}/items`, data)
    return response.data
  }

  async completeStoreAudit(auditId: number, data: {
    overall_score?: number
    recommendations?: string
    latitude?: number
    longitude?: number
  }): Promise<{ audit: any }> {
    const response = await apiClient.post(`/store-audits/${auditId}/complete`, data)
    return response.data
  }

  async getStoreAuditStats(): Promise<{ stats: any }> {
    const response = await apiClient.get('/store-audits/stats')
    return response.data
  }

  async getBoardPlacements(params?: { status?: string; customer_id?: string }): Promise<{ placements: BoardPlacement[] }> {
    const response = await apiClient.get('/board-placements', { params })
    return response.data
  }

  async getBoardPlacement(placementId: number): Promise<{ placement: BoardPlacement; photos: any[]; history: any[] }> {
    const response = await apiClient.get(`/board-placements/${placementId}`)
    return response.data
  }

  async updateBoardPlacementStatus(placementId: number, data: {
    status: string
    notes?: string
  }): Promise<{ placement: BoardPlacement }> {
    const response = await apiClient.post(`/board-placements/${placementId}/status`, data)
    return response.data
  }

  async addBoardPlacementPhoto(placementId: number, data: {
    photo_url: string
    photo_type?: string
    latitude?: number
    longitude?: number
  }): Promise<{ photo: any }> {
    const response = await apiClient.post(`/board-placements/${placementId}/photos`, data)
    return response.data
  }

  async getBoardPlacementStats(): Promise<{ stats: any }> {
    const response = await apiClient.get('/board-placements/stats')
    return response.data
  }
}

export default new FieldMarketingService()
