import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============================================
// TRADE MARKETING API SERVICE
// ============================================

export interface StoreVisit {
  id: number;
  visit_code: string;
  agent_id: number;
  store_id: number;
  store_name?: string;
  visit_type: string;
  visit_status: string;
  check_in_time: string;
  check_out_time?: string;
  entrance_photo_url?: string;
  exit_photo_url?: string;
  store_traffic: string;
  store_cleanliness: number;
  visit_notes?: string;
}

export interface CreateVisitRequest {
  storeId: number;
  visitType: string;
  checkInLatitude: number;
  checkInLongitude: number;
  entrancePhotoUrl?: string;
  storeTraffic?: string;
  storeCleanliness?: number;
}

export interface ShelfAnalytics {
  id: number;
  visit_id: number;
  category: string;
  total_shelf_space_meters: number;
  brand_shelf_space_meters: number;
  brand_shelf_share_percentage: number;
  total_facings: number;
  brand_facings: number;
  brand_facings_share_percentage: number;
  shelf_position: string;
  planogram_compliance: number;
  shelf_photo_url?: string;
}

export interface CreateShelfAnalyticsRequest {
  visitId: number;
  storeId: number;
  category: string;
  totalShelfSpaceMeters: number;
  brandShelfSpaceMeters: number;
  totalFacings: number;
  brandFacings: number;
  shelfPosition: string;
  planogramCompliance: number;
  shelfPhotoUrl?: string;
  competitorAnalysis?: any;
}

export interface SKUAvailability {
  id: number;
  visit_id: number;
  product_id: number;
  product_name?: string;
  availability_status: string;
  facing_count: number;
  shelf_position: string;
  actual_price: number;
  rrp: number;
  price_variance: number;
  price_compliant: boolean;
  expiry_visible: boolean;
  expiry_date?: string;
  product_condition: string;
  sku_photo_url?: string;
}

export interface CreateSKUAvailabilityRequest {
  visitId: number;
  storeId: number;
  productId: number;
  availabilityStatus: string;
  facingCount: number;
  shelfPosition: string;
  actualPrice: number;
  rrp: number;
  expiryVisible: boolean;
  expiryDate?: string;
  productCondition: string;
  skuPhotoUrl?: string;
  notes?: string;
}

export interface POSMaterial {
  id: number;
  material_name: string;
  material_type: string;
  brand_id?: number;
  brand_name?: string;
  is_active: boolean;
}

export interface POSMaterialTracking {
  id: number;
  visit_id: number;
  material_id: number;
  material_name?: string;
  material_type: string;
  material_status: string;
  location_in_store: string;
  condition: string;
  visibility_score: number;
  photo_url?: string;
}

export interface TrackPOSMaterialRequest {
  visitId: number;
  storeId: number;
  materialId: number;
  materialType: string;
  materialStatus: string;
  installationDate?: string;
  locationInStore: string;
  condition: string;
  visibilityScore: number;
  photoUrl?: string;
  notes?: string;
}

export interface BrandActivation {
  id: number;
  activation_code: string;
  visit_id: number;
  campaign_id: number;
  campaign_name?: string;
  activation_type: string;
  activation_status: string;
  setup_photo_url?: string;
  samples_distributed: number;
  consumers_engaged: number;
  activation_notes?: string;
}

export interface CreateBrandActivationRequest {
  visitId: number;
  campaignId: number;
  storeId: number;
  activationType: string;
  setupPhotoUrl?: string;
  activityPhotos?: string[];
  samplesDistributed: number;
  consumersEngaged: number;
  feedbackCollected?: any;
  storeManagerSignatureUrl?: string;
  activationNotes?: string;
}

export interface Campaign {
  id: number;
  campaign_name: string;
  campaign_type: string;
  brand_id?: number;
  brand_name?: string;
  start_date: string;
  end_date: string;
  status: string;
}

class TradeMarketingService {
  private getAuthToken() {
    return localStorage.getItem('token');
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Store Visits
  async createVisit(data: CreateVisitRequest): Promise<{ visit: StoreVisit }> {
    const response = await axios.post(
      `${API_URL}/trade-marketing-new/visits`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getVisits(params?: { status?: string; startDate?: string; endDate?: string }): Promise<{ visits: StoreVisit[] }> {
    const response = await axios.get(
      `${API_URL}/trade-marketing-new/visits`,
      {
        params,
        headers: this.getHeaders()
      }
    );
    return response.data;
  }

  async getVisitDetails(visitId: number): Promise<{
    visit: StoreVisit;
    shelfAnalytics: ShelfAnalytics[];
    skuAvailability: SKUAvailability[];
    posMaterials: POSMaterialTracking[];
    brandActivations: BrandActivation[];
  }> {
    const response = await axios.get(
      `${API_URL}/trade-marketing-new/visits/${visitId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async completeVisit(visitId: number, data: {
    checkOutLatitude: number;
    checkOutLongitude: number;
    exitPhotoUrl?: string;
    visitNotes?: string;
  }): Promise<{ visit: StoreVisit }> {
    const response = await axios.put(
      `${API_URL}/trade-marketing-new/visits/${visitId}/complete`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Shelf Analytics
  async createShelfAnalytics(data: CreateShelfAnalyticsRequest): Promise<{ analytics: ShelfAnalytics }> {
    const response = await axios.post(
      `${API_URL}/trade-marketing-new/shelf-analytics`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // SKU Availability
  async createSKUAvailability(data: CreateSKUAvailabilityRequest): Promise<{ availability: SKUAvailability }> {
    const response = await axios.post(
      `${API_URL}/trade-marketing-new/sku-availability`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // POS Materials
  async getPOSMaterials(params?: { brandId?: number; materialType?: string }): Promise<{ materials: POSMaterial[] }> {
    const response = await axios.get(
      `${API_URL}/trade-marketing-new/pos-materials`,
      {
        params,
        headers: this.getHeaders()
      }
    );
    return response.data;
  }

  async trackPOSMaterial(data: TrackPOSMaterialRequest): Promise<{ tracking: POSMaterialTracking }> {
    const response = await axios.post(
      `${API_URL}/trade-marketing-new/pos-materials/track`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Brand Activations
  async createBrandActivation(data: CreateBrandActivationRequest): Promise<{ activation: BrandActivation }> {
    const response = await axios.post(
      `${API_URL}/trade-marketing-new/brand-activations`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Campaigns
  async getCampaigns(params?: { brandId?: number; status?: string }): Promise<{ campaigns: Campaign[] }> {
    const response = await axios.get(
      `${API_URL}/trade-marketing-new/campaigns`,
      {
        params,
        headers: this.getHeaders()
      }
    );
    return response.data;
  }

  // Analytics
  async getAnalyticsSummary(params?: { startDate?: string; endDate?: string }): Promise<{
    visitsSummary: any;
    shelfSummary: any;
    skuSummary: any;
    activationsSummary: any;
  }> {
    const response = await axios.get(
      `${API_URL}/trade-marketing-new/analytics/summary`,
      {
        params,
        headers: this.getHeaders()
      }
    );
    return response.data;
  }
}

export default new TradeMarketingService();
