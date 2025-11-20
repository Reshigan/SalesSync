import { apiClient } from './api.service';

// ============================================
// FIELD MARKETING API SERVICE
// ============================================

export interface GPSValidationRequest {
  customerId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GPSValidationResponse {
  valid: boolean;
  distance: number;
  requiredDistance: number;
  customerLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface CustomerSearchParams {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface Customer {
  id: number;
  name: string;
  code: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  has_location: boolean;
}

export interface Visit {
  id: number;
  visit_code: string;
  agent_id: number;
  customer_id: number;
  customer_name?: string;
  visit_type: string;
  visit_status: string;
  start_time: string;
  end_time?: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude?: number;
  end_longitude?: number;
  selected_brands: string[];
  gps_validation_passed: boolean;
  visit_notes?: string;
}

export interface CreateVisitRequest {
  customerId: number;
  visitType: string;
  startLatitude: number;
  startLongitude: number;
  selectedBrands: number[];
}

export interface Board {
  id: number;
  board_name: string;
  board_type: string;
  brand_id: number;
  brand_name?: string;
  board_size: string;
  commission_rate: number;
  is_active: boolean;
}

export interface BoardPlacement {
  id: number;
  placement_code: string;
  visit_id: number;
  board_id: number;
  customer_id: number;
  agent_id: number;
  placement_status: string;
  latitude: number;
  longitude: number;
  placement_photo_url: string;
  storefront_coverage_percentage: number;
  quality_score: number;
  visibility_score: number;
  commission_amount: number;
  commission_status: string;
  placement_notes?: string;
}

export interface CreateBoardPlacementRequest {
  visitId: number;
  boardId: number;
  customerId: number;
  latitude: number;
  longitude: number;
  placementPhotoUrl: string;
  storefrontCoveragePercentage: number;
  qualityScore: number;
  visibilityScore: number;
  placementNotes?: string;
}

export interface ProductDistribution {
  id: number;
  distribution_code: string;
  visit_id: number;
  product_id: number;
  product_name?: string;
  agent_id: number;
  customer_id: number;
  distribution_status: string;
  product_type: string;
  product_serial_number: string;
  quantity: number;
  recipient_name: string;
  recipient_id_number: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_signature_url: string;
  recipient_photo_url: string;
  id_document_photo_url: string;
  form_data: any;
  latitude: number;
  longitude: number;
  commission_amount: number;
  commission_status: string;
  distribution_notes?: string;
}

export interface CreateProductDistributionRequest {
  visitId: number;
  productId: number;
  customerId: number;
  productType: string;
  productSerialNumber: string;
  quantity: number;
  recipientName: string;
  recipientIdNumber: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientSignatureUrl: string;
  recipientPhotoUrl: string;
  idDocumentPhotoUrl: string;
  formData: any;
  latitude: number;
  longitude: number;
  distributionNotes?: string;
}

export interface Commission {
  id: number;
  agent_id: number;
  visit_id: number;
  visit_code?: string;
  customer_name?: string;
  commission_type: string;
  reference_type: string;
  reference_id: number;
  commission_amount: number;
  commission_status: string;
  earned_date: string;
}

export interface CommissionTotals {
  pending: number;
  approved: number;
  paid: number;
}

export interface Survey {
  id: number;
  survey_name: string;
  survey_type: string;
  survey_scope: string;
  brand_id?: number;
}

export interface SurveySubmission {
  visitId: number;
  surveyId: number;
  customerId: number;
  surveyType: string;
  surveyScope: string;
  brandId?: number;
  responses: any[];
}

class FieldMarketingService {
  // GPS Validation
  async validateGPS(data: GPSValidationRequest): Promise<GPSValidationResponse> {
    const response = await apiClient.post('/field-marketing/gps/validate', data);
    return response.data;
  }

  // Customer Search
  async searchCustomers(params: CustomerSearchParams): Promise<{ customers: Customer[] }> {
    const response = await apiClient.get('/field-marketing/customers/search', { params });
    return response.data;
  }

  // Visits
  async createVisit(data: CreateVisitRequest): Promise<{ visit: Visit }> {
    const response = await apiClient.post('/field-marketing/visits', data);
    return response.data;
  }

  async getVisits(params?: { status?: string; startDate?: string; endDate?: string }): Promise<{ visits: Visit[] }> {
    const response = await apiClient.get('/field-marketing/visits', { params });
    return response.data;
  }

  async getVisitDetails(visitId: number): Promise<{
    visit: Visit;
    boardPlacements: BoardPlacement[];
    productDistributions: ProductDistribution[];
    surveys: any[];
  }> {
    const response = await apiClient.get(`/field-marketing/visits/${visitId}`);
    return response.data;
  }

  async completeVisit(visitId: number, data: {
    endLatitude: number;
    endLongitude: number;
    visitNotes?: string;
  }): Promise<{ visit: Visit }> {
    const response = await apiClient.put(`/field-marketing/visits/${visitId}/complete`, data);
    return response.data;
  }

  // Boards
  async getBoards(brandId?: number): Promise<{ boards: Board[] }> {
    const response = await apiClient.get('/field-marketing/boards', {
      params: { brandId }
    });
    return response.data;
  }

  // Board Placements
  async createBoardPlacement(data: CreateBoardPlacementRequest): Promise<{ placement: BoardPlacement }> {
    const response = await apiClient.post('/field-marketing/board-placements', data);
    return response.data;
  }

  // Product Distributions
  async createProductDistribution(data: CreateProductDistributionRequest): Promise<{ distribution: ProductDistribution }> {
    const response = await apiClient.post('/field-marketing/product-distributions', data);
    return response.data;
  }

  // Commissions
  async getCommissions(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    commissions: Commission[];
    totals: CommissionTotals;
  }> {
    const response = await apiClient.get('/field-marketing/commissions', { params });
    return response.data;
  }

  // Surveys
  async submitSurvey(data: SurveySubmission): Promise<{ survey: any }> {
    const response = await apiClient.post('/field-marketing/surveys/submit', data);
    return response.data;
  }
}

export default new FieldMarketingService();
