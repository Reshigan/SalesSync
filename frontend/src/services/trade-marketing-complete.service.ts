// Complete Trade Marketing Management System - Enterprise Implementation
import apiClient from '@/lib/api-client'

export interface TradeMarketingCampaign {
  id: string
  name: string
  description: string
  type: 'product_launch' | 'seasonal' | 'promotional' | 'brand_awareness' | 'competitive'
  status: 'draft' | 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  brandId: string
  brand: Brand
  objectives: CampaignObjective[]
  targetAudience: TargetAudience
  budget: CampaignBudget
  timeline: CampaignTimeline
  channels: MarketingChannel[]
  materials: MarketingMaterial[]
  activities: CampaignActivity[]
  kpis: CampaignKPI[]
  performance: CampaignPerformance
  roi: CampaignROI
  approvals: CampaignApproval[]
  stakeholders: CampaignStakeholder[]
  geography: GeographicScope
  compliance: ComplianceRequirement[]
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface RetailerPartnership {
  id: string
  retailerId: string
  retailer: Retailer
  brandId: string
  brand: Brand
  partnershipType: 'exclusive' | 'preferred' | 'standard' | 'strategic'
  status: 'active' | 'inactive' | 'pending' | 'terminated'
  contractDetails: PartnershipContract
  terms: PartnershipTerms
  benefits: PartnershipBenefit[]
  obligations: PartnershipObligation[]
  performance: PartnershipPerformance
  communications: PartnershipCommunication[]
  jointActivities: JointActivity[]
  supportPrograms: SupportProgram[]
  trainingPrograms: TrainingProgram[]
  incentives: PartnershipIncentive[]
  compliance: PartnershipCompliance
  reviews: PartnershipReview[]
  renewalTerms: RenewalTerms
  terminationClause: TerminationClause
  createdAt: string
  updatedAt: string
}

export interface Retailer {
  id: string
  name: string
  businessName: string
  type: 'chain' | 'independent' | 'franchise' | 'online' | 'hybrid'
  category: 'supermarket' | 'convenience' | 'specialty' | 'department' | 'discount'
  size: 'small' | 'medium' | 'large' | 'enterprise'
  locations: RetailerLocation[]
  contactInfo: RetailerContact
  businessInfo: RetailerBusinessInfo
  financialInfo: RetailerFinancialInfo
  operationalInfo: RetailerOperationalInfo
  demographics: RetailerDemographics
  preferences: RetailerPreferences
  history: RetailerHistory
  certifications: RetailerCertification[]
  ratings: RetailerRating[]
  status: 'active' | 'inactive' | 'prospect' | 'blacklisted'
  tags: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PromotionalActivity {
  id: string
  campaignId: string
  name: string
  description: string
  type: 'display' | 'sampling' | 'demonstration' | 'contest' | 'discount' | 'bundle'
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  locations: ActivityLocation[]
  materials: ActivityMaterial[]
  staff: ActivityStaff[]
  budget: ActivityBudget
  execution: ActivityExecution
  results: ActivityResults
  feedback: ActivityFeedback[]
  photos: string[]
  compliance: ActivityCompliance
  approvals: ActivityApproval[]
  createdAt: string
  updatedAt: string
}

export interface TradeMarketingMaterial {
  id: string
  name: string
  description: string
  type: 'pos' | 'brochure' | 'banner' | 'standee' | 'digital' | 'video' | 'audio'
  category: 'promotional' | 'educational' | 'brand' | 'product' | 'seasonal'
  format: MaterialFormat
  specifications: MaterialSpecifications
  brandGuidelines: BrandGuidelines
  languages: string[]
  versions: MaterialVersion[]
  approvals: MaterialApproval[]
  distribution: MaterialDistribution
  usage: MaterialUsage[]
  inventory: MaterialInventory
  costs: MaterialCosts
  effectiveness: MaterialEffectiveness
  compliance: MaterialCompliance
  tags: string[]
  status: 'draft' | 'approved' | 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface TradeShow {
  id: string
  name: string
  description: string
  type: 'industry' | 'consumer' | 'b2b' | 'regional' | 'international'
  status: 'planned' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  venue: TradeShowVenue
  dates: TradeShowDates
  organizer: TradeShowOrganizer
  participation: TradeShowParticipation
  booth: TradeShowBooth
  objectives: TradeShowObjective[]
  budget: TradeShowBudget
  team: TradeShowTeam[]
  materials: TradeShowMaterial[]
  activities: TradeShowActivity[]
  leads: TradeShowLead[]
  meetings: TradeShowMeeting[]
  competitors: CompetitorPresence[]
  results: TradeShowResults
  roi: TradeShowROI
  followUp: TradeShowFollowUp[]
  learnings: TradeShowLearning[]
  createdAt: string
  updatedAt: string
}

export interface TradeMarketingAnalytics {
  campaignMetrics: CampaignMetrics
  partnershipMetrics: PartnershipMetrics
  activityMetrics: ActivityMetrics
  materialMetrics: MaterialMetrics
  tradeShowMetrics: TradeShowMetrics
  roiMetrics: ROIMetrics
  performanceMetrics: PerformanceMetrics
  competitiveMetrics: CompetitiveMetrics
  marketMetrics: MarketMetrics
  insights: TradeMarketingInsight[]
  recommendations: TradeMarketingRecommendation[]
  forecasts: TradeMarketingForecast[]
  benchmarks: TradeMarketingBenchmark[]
  alerts: TradeMarketingAlert[]
}

// Supporting interfaces
export interface CampaignObjective {
  id: string
  type: 'awareness' | 'sales' | 'market_share' | 'distribution' | 'loyalty'
  description: string
  target: number
  metric: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  deadline: string
  status: 'not_started' | 'in_progress' | 'achieved' | 'missed'
}

export interface TargetAudience {
  primary: AudienceSegment
  secondary: AudienceSegment[]
  demographics: Demographics
  psychographics: Psychographics
  behaviors: BehaviorProfile
  preferences: PreferenceProfile
  channels: PreferredChannel[]
  touchpoints: CustomerTouchpoint[]
}

export interface CampaignBudget {
  total: number
  allocated: BudgetAllocation[]
  spent: BudgetSpent[]
  remaining: number
  variance: number
  approvals: BudgetApproval[]
  tracking: BudgetTracking[]
}

export interface CampaignTimeline {
  startDate: string
  endDate: string
  phases: CampaignPhase[]
  milestones: CampaignMilestone[]
  dependencies: CampaignDependency[]
  criticalPath: CriticalPathItem[]
}

export interface MarketingChannel {
  id: string
  name: string
  type: 'digital' | 'traditional' | 'experiential' | 'direct' | 'partnership'
  platform: string
  budget: number
  reach: number
  engagement: number
  conversion: number
  roi: number
  status: 'active' | 'inactive' | 'testing'
}

export interface MarketingMaterial {
  id: string
  name: string
  type: string
  format: string
  url: string
  usage: MaterialUsageStats
  effectiveness: MaterialEffectiveness
  compliance: boolean
}

export interface CampaignActivity {
  id: string
  name: string
  type: string
  status: string
  startDate: string
  endDate: string
  budget: number
  results: ActivityResults
  responsible: string
}

export interface CampaignKPI {
  id: string
  name: string
  description: string
  target: number
  actual: number
  unit: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved'
}

export interface CampaignPerformance {
  reach: number
  impressions: number
  engagement: number
  clicks: number
  conversions: number
  sales: number
  leads: number
  brandAwareness: number
  marketShare: number
  customerSatisfaction: number
}

export interface CampaignROI {
  investment: number
  revenue: number
  profit: number
  roi: number
  paybackPeriod: number
  ltv: number
  cac: number
  roas: number
}

class TradeMarketingCompleteService {
  // Campaign Management
  async getCampaigns(params?: {
    status?: string
    type?: string
    brandId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<TradeMarketingCampaign[]> {
    const response = await apiClient.get('/trade-marketing/campaigns', { params })
    return response.campaigns
  }

  async createCampaign(campaign: Omit<TradeMarketingCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradeMarketingCampaign> {
    return apiClient.post('/trade-marketing/campaigns', campaign)
  }

  async updateCampaign(id: string, updates: Partial<TradeMarketingCampaign>): Promise<TradeMarketingCampaign> {
    return apiClient.put(`/trade-marketing/campaigns/${id}`, updates)
  }

  async launchCampaign(id: string): Promise<TradeMarketingCampaign> {
    return apiClient.post(`/trade-marketing/campaigns/${id}/launch`)
  }

  async pauseCampaign(id: string, reason: string): Promise<TradeMarketingCampaign> {
    return apiClient.post(`/trade-marketing/campaigns/${id}/pause`, { reason })
  }

  async completeCampaign(id: string, results: CampaignResults): Promise<TradeMarketingCampaign> {
    return apiClient.post(`/trade-marketing/campaigns/${id}/complete`, results)
  }

  async getCampaignPerformance(id: string, period: string): Promise<CampaignPerformance> {
    return apiClient.get(`/trade-marketing/campaigns/${id}/performance`, { params: { period } })
  }

  async getCampaignROI(id: string): Promise<CampaignROI> {
    return apiClient.get(`/trade-marketing/campaigns/${id}/roi`)
  }

  // Retailer Partnership Management
  async getRetailerPartnerships(params?: {
    status?: string
    type?: string
    retailerId?: string
    brandId?: string
  }): Promise<RetailerPartnership[]> {
    const response = await apiClient.get('/trade-marketing/partnerships', { params })
    return response.partnerships
  }

  async createPartnership(partnership: Omit<RetailerPartnership, 'id' | 'createdAt' | 'updatedAt'>): Promise<RetailerPartnership> {
    return apiClient.post('/trade-marketing/partnerships', partnership)
  }

  async updatePartnership(id: string, updates: Partial<RetailerPartnership>): Promise<RetailerPartnership> {
    return apiClient.put(`/trade-marketing/partnerships/${id}`, updates)
  }

  async renewPartnership(id: string, terms: RenewalTerms): Promise<RetailerPartnership> {
    return apiClient.post(`/trade-marketing/partnerships/${id}/renew`, terms)
  }

  async terminatePartnership(id: string, reason: string): Promise<RetailerPartnership> {
    return apiClient.post(`/trade-marketing/partnerships/${id}/terminate`, { reason })
  }

  async getPartnershipPerformance(id: string, period: string): Promise<PartnershipPerformance> {
    return apiClient.get(`/trade-marketing/partnerships/${id}/performance`, { params: { period } })
  }

  // Retailer Management
  async getRetailers(params?: {
    type?: string
    category?: string
    size?: string
    status?: string
    location?: string
    search?: string
  }): Promise<Retailer[]> {
    const response = await apiClient.get('/trade-marketing/retailers', { params })
    return response.retailers
  }

  async createRetailer(retailer: Omit<Retailer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Retailer> {
    return apiClient.post('/trade-marketing/retailers', retailer)
  }

  async updateRetailer(id: string, updates: Partial<Retailer>): Promise<Retailer> {
    return apiClient.put(`/trade-marketing/retailers/${id}`, updates)
  }

  async getRetailerProfile(id: string): Promise<RetailerProfile> {
    return apiClient.get(`/trade-marketing/retailers/${id}/profile`)
  }

  async getRetailerAnalytics(id: string, period: string): Promise<RetailerAnalytics> {
    return apiClient.get(`/trade-marketing/retailers/${id}/analytics`, { params: { period } })
  }

  // Promotional Activities
  async getPromotionalActivities(params?: {
    campaignId?: string
    type?: string
    status?: string
    location?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<PromotionalActivity[]> {
    const response = await apiClient.get('/trade-marketing/activities', { params })
    return response.activities
  }

  async createActivity(activity: Omit<PromotionalActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromotionalActivity> {
    return apiClient.post('/trade-marketing/activities', activity)
  }

  async updateActivity(id: string, updates: Partial<PromotionalActivity>): Promise<PromotionalActivity> {
    return apiClient.put(`/trade-marketing/activities/${id}`, updates)
  }

  async executeActivity(id: string, executionData: ActivityExecution): Promise<PromotionalActivity> {
    return apiClient.post(`/trade-marketing/activities/${id}/execute`, executionData)
  }

  async completeActivity(id: string, results: ActivityResults): Promise<PromotionalActivity> {
    return apiClient.post(`/trade-marketing/activities/${id}/complete`, results)
  }

  async getActivityResults(id: string): Promise<ActivityResults> {
    return apiClient.get(`/trade-marketing/activities/${id}/results`)
  }

  // Marketing Materials
  async getMarketingMaterials(params?: {
    type?: string
    category?: string
    status?: string
    brandId?: string
    language?: string
  }): Promise<TradeMarketingMaterial[]> {
    const response = await apiClient.get('/trade-marketing/materials', { params })
    return response.materials
  }

  async createMaterial(material: Omit<TradeMarketingMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradeMarketingMaterial> {
    return apiClient.post('/trade-marketing/materials', material)
  }

  async updateMaterial(id: string, updates: Partial<TradeMarketingMaterial>): Promise<TradeMarketingMaterial> {
    return apiClient.put(`/trade-marketing/materials/${id}`, updates)
  }

  async approveMaterial(id: string, approval: MaterialApproval): Promise<TradeMarketingMaterial> {
    return apiClient.post(`/trade-marketing/materials/${id}/approve`, approval)
  }

  async distributeMaterial(id: string, distribution: MaterialDistribution): Promise<TradeMarketingMaterial> {
    return apiClient.post(`/trade-marketing/materials/${id}/distribute`, distribution)
  }

  async getMaterialUsage(id: string, period: string): Promise<MaterialUsage[]> {
    const response = await apiClient.get(`/trade-marketing/materials/${id}/usage`, { params: { period } })
    return response.usage
  }

  async getMaterialEffectiveness(id: string): Promise<MaterialEffectiveness> {
    return apiClient.get(`/trade-marketing/materials/${id}/effectiveness`)
  }

  // Trade Shows
  async getTradeShows(params?: {
    type?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    location?: string
  }): Promise<TradeShow[]> {
    const response = await apiClient.get('/trade-marketing/trade-shows', { params })
    return response.tradeShows
  }

  async createTradeShow(tradeShow: Omit<TradeShow, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradeShow> {
    return apiClient.post('/trade-marketing/trade-shows', tradeShow)
  }

  async updateTradeShow(id: string, updates: Partial<TradeShow>): Promise<TradeShow> {
    return apiClient.put(`/trade-marketing/trade-shows/${id}`, updates)
  }

  async registerForTradeShow(id: string, participation: TradeShowParticipation): Promise<TradeShow> {
    return apiClient.post(`/trade-marketing/trade-shows/${id}/register`, participation)
  }

  async getTradeShowLeads(id: string): Promise<TradeShowLead[]> {
    const response = await apiClient.get(`/trade-marketing/trade-shows/${id}/leads`)
    return response.leads
  }

  async addTradeShowLead(id: string, lead: Omit<TradeShowLead, 'id'>): Promise<TradeShowLead> {
    return apiClient.post(`/trade-marketing/trade-shows/${id}/leads`, lead)
  }

  async getTradeShowResults(id: string): Promise<TradeShowResults> {
    return apiClient.get(`/trade-marketing/trade-shows/${id}/results`)
  }

  async getTradeShowROI(id: string): Promise<TradeShowROI> {
    return apiClient.get(`/trade-marketing/trade-shows/${id}/roi`)
  }

  // Analytics & Reporting
  async getTradeMarketingAnalytics(params: {
    period: string
    brandId?: string
    campaignId?: string
    retailerId?: string
    metrics?: string[]
  }): Promise<TradeMarketingAnalytics> {
    return apiClient.get('/trade-marketing/analytics', { params })
  }

  async getCampaignAnalytics(campaignId: string, period: string): Promise<CampaignAnalytics> {
    return apiClient.get(`/trade-marketing/campaigns/${campaignId}/analytics`, { params: { period } })
  }

  async getPartnershipAnalytics(partnershipId: string, period: string): Promise<PartnershipAnalytics> {
    return apiClient.get(`/trade-marketing/partnerships/${partnershipId}/analytics`, { params: { period } })
  }

  async getMarketAnalysis(params: {
    market: string
    period: string
    competitors?: string[]
  }): Promise<MarketAnalysis> {
    return apiClient.get('/trade-marketing/analytics/market', { params })
  }

  async getCompetitiveAnalysis(params: {
    competitors: string[]
    period: string
    metrics: string[]
  }): Promise<CompetitiveAnalysis> {
    return apiClient.get('/trade-marketing/analytics/competitive', { params })
  }

  async getROIAnalysis(params: {
    type: 'campaign' | 'partnership' | 'activity' | 'material'
    period: string
    groupBy?: string
  }): Promise<ROIAnalysis> {
    return apiClient.get('/trade-marketing/analytics/roi', { params })
  }

  async getForecast(params: {
    type: 'sales' | 'market_share' | 'campaign_performance'
    horizon: number
    granularity: 'daily' | 'weekly' | 'monthly'
  }): Promise<TradeMarketingForecast> {
    return apiClient.get('/trade-marketing/analytics/forecast', { params })
  }

  // Compliance & Approvals
  async getComplianceRequirements(type: string): Promise<ComplianceRequirement[]> {
    const response = await apiClient.get('/trade-marketing/compliance/requirements', { params: { type } })
    return response.requirements
  }

  async checkCompliance(entityId: string, entityType: string): Promise<ComplianceCheck> {
    return apiClient.post('/trade-marketing/compliance/check', { entityId, entityType })
  }

  async requestApproval(request: ApprovalRequest): Promise<ApprovalResponse> {
    return apiClient.post('/trade-marketing/approvals/request', request)
  }

  async getApprovalStatus(requestId: string): Promise<ApprovalStatus> {
    return apiClient.get(`/trade-marketing/approvals/${requestId}/status`)
  }

  async processApproval(requestId: string, decision: ApprovalDecision): Promise<ApprovalResponse> {
    return apiClient.post(`/trade-marketing/approvals/${requestId}/process`, decision)
  }

  // Integration & Export
  async syncWithCRM(data: CRMSyncData): Promise<CRMSyncResult> {
    return apiClient.post('/trade-marketing/integrations/crm/sync', data)
  }

  async syncWithERP(data: ERPSyncData): Promise<ERPSyncResult> {
    return apiClient.post('/trade-marketing/integrations/erp/sync', data)
  }

  async exportData(params: {
    type: 'campaigns' | 'partnerships' | 'activities' | 'materials'
    format: 'csv' | 'excel' | 'json'
    dateFrom: string
    dateTo: string
    filters?: Record<string, any>
  }): Promise<Blob> {
    return apiClient.get('/trade-marketing/export', { params, responseType: 'blob' })
  }

  async generateReport(params: {
    type: 'campaign' | 'partnership' | 'activity' | 'roi'
    format: 'pdf' | 'excel' | 'powerpoint'
    template?: string
    data: Record<string, any>
  }): Promise<Blob> {
    return apiClient.post('/trade-marketing/reports/generate', params, { responseType: 'blob' })
  }
}

const tradeMarketingCompleteService = new TradeMarketingCompleteService()
export default tradeMarketingCompleteService