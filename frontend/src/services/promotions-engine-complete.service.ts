// Complete Promotions Engine - Advanced Rules & Campaign Management
import apiClient from '@/lib/api-client'

export interface PromotionCampaign {
  id: string
  name: string
  description: string
  type: 'discount' | 'bogo' | 'bundle' | 'loyalty' | 'cashback' | 'gift' | 'contest' | 'sweepstakes'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
  brandId: string
  brand: Brand
  priority: number
  stackable: boolean
  exclusions: PromotionExclusion[]
  rules: PromotionRule[]
  conditions: PromotionCondition[]
  rewards: PromotionReward[]
  triggers: PromotionTrigger[]
  targeting: PromotionTargeting
  budget: PromotionBudget
  timeline: PromotionTimeline
  channels: PromotionChannel[]
  mechanics: PromotionMechanics
  creative: PromotionCreative
  tracking: PromotionTracking
  performance: PromotionPerformance
  analytics: PromotionAnalytics
  approvals: PromotionApproval[]
  compliance: PromotionCompliance
  testing: PromotionTesting
  personalization: PromotionPersonalization
  automation: PromotionAutomation
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface PromotionRule {
  id: string
  name: string
  description: string
  type: 'eligibility' | 'qualification' | 'calculation' | 'redemption' | 'stacking'
  operator: 'and' | 'or' | 'not'
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number
  active: boolean
  validFrom: string
  validTo: string
  usageLimit: number
  usageCount: number
  metadata: Record<string, any>
}

export interface RuleCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
  value: any
  valueType: 'static' | 'dynamic' | 'calculated'
  dataSource: string
  transformation: string
  validation: ConditionValidation
}

export interface RuleAction {
  id: string
  type: 'discount' | 'reward' | 'notification' | 'tracking' | 'redirect' | 'custom'
  parameters: ActionParameters
  execution: ActionExecution
  fallback: ActionFallback
  validation: ActionValidation
}

export interface PromotionCondition {
  id: string
  name: string
  type: 'customer' | 'product' | 'order' | 'time' | 'location' | 'behavior' | 'external'
  category: string
  operator: string
  value: any
  weight: number
  required: boolean
  group: string
  dependencies: string[]
  validation: ConditionValidation
}

export interface PromotionReward {
  id: string
  name: string
  type: 'percentage_discount' | 'fixed_discount' | 'free_product' | 'points' | 'cashback' | 'gift'
  value: number
  unit: string
  calculation: RewardCalculation
  distribution: RewardDistribution
  redemption: RewardRedemption
  expiration: RewardExpiration
  limitations: RewardLimitation[]
  personalization: RewardPersonalization
}

export interface PromotionTrigger {
  id: string
  name: string
  type: 'event' | 'schedule' | 'condition' | 'api' | 'manual'
  event: TriggerEvent
  schedule: TriggerSchedule
  condition: TriggerCondition
  action: TriggerAction
  priority: number
  active: boolean
  retries: number
  timeout: number
}

export interface PromotionTargeting {
  segments: CustomerSegment[]
  demographics: DemographicTargeting
  behavioral: BehavioralTargeting
  geographic: GeographicTargeting
  psychographic: PsychographicTargeting
  contextual: ContextualTargeting
  lookalike: LookalikeTargeting
  exclusions: TargetingExclusion[]
  personalization: TargetingPersonalization
}

export interface PromotionBudget {
  total: number
  allocated: BudgetAllocation[]
  spent: number
  remaining: number
  utilization: number
  forecasted: number
  controls: BudgetControl[]
  alerts: BudgetAlert[]
  approvals: BudgetApproval[]
  tracking: BudgetTracking[]
}

export interface PromotionTimeline {
  plannedStart: string
  plannedEnd: string
  actualStart?: string
  actualEnd?: string
  phases: PromotionPhase[]
  milestones: PromotionMilestone[]
  dependencies: PromotionDependency[]
  schedule: PromotionSchedule
  timezone: string
  recurring: RecurringPattern
}

export interface PromotionChannel {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'web' | 'mobile' | 'social' | 'print' | 'tv' | 'radio'
  platform: string
  configuration: ChannelConfiguration
  targeting: ChannelTargeting
  creative: ChannelCreative
  tracking: ChannelTracking
  performance: ChannelPerformance
  budget: ChannelBudget
  schedule: ChannelSchedule
  active: boolean
}

export interface PromotionMechanics {
  type: string
  rules: MechanicsRule[]
  flow: MechanicsFlow
  validation: MechanicsValidation
  calculation: MechanicsCalculation
  redemption: MechanicsRedemption
  stacking: MechanicsStacking
  limitations: MechanicsLimitation[]
  customization: MechanicsCustomization
}

export interface PromotionCreative {
  assets: CreativeAsset[]
  templates: CreativeTemplate[]
  variations: CreativeVariation[]
  personalization: CreativePersonalization
  testing: CreativeTestingConfig
  approval: CreativeApproval
  guidelines: CreativeGuidelines
  localization: CreativeLocalization[]
}

export interface PromotionTracking {
  events: TrackingEvent[]
  metrics: TrackingMetric[]
  attribution: AttributionModel
  conversion: ConversionTracking
  engagement: EngagementTracking
  revenue: RevenueTracking
  customer: CustomerTracking
  channel: ChannelTracking
  realTime: RealTimeTracking
}

export interface PromotionPerformance {
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  participants: number
  redemptions: number
  engagement: EngagementMetrics
  reach: ReachMetrics
  frequency: FrequencyMetrics
  roi: ROIMetrics
  lift: LiftMetrics
  attribution: AttributionMetrics
  trends: PerformanceTrend[]
}

export interface PromotionAnalytics {
  overview: AnalyticsOverview
  performance: PerformanceAnalytics
  audience: AudienceAnalytics
  channel: ChannelAnalytics
  product: ProductAnalytics
  geographic: GeographicAnalytics
  temporal: TemporalAnalytics
  cohort: CohortAnalytics
  funnel: FunnelAnalytics
  attribution: AttributionAnalytics
  predictive: PredictiveAnalytics
  insights: AnalyticsInsight[]
  recommendations: AnalyticsRecommendation[]
}

export interface PromotionTesting {
  type: 'ab' | 'multivariate' | 'split' | 'holdout'
  variants: TestVariant[]
  allocation: TestAllocation
  duration: TestDuration
  metrics: TestMetric[]
  hypothesis: TestHypothesis
  results: TestResults
  significance: StatisticalSignificance
  winner: TestWinner
  learnings: TestLearning[]
}

export interface PromotionPersonalization {
  enabled: boolean
  strategy: PersonalizationStrategy
  segments: PersonalizationSegment[]
  rules: PersonalizationRule[]
  content: PersonalizedContent[]
  recommendations: PersonalizationRecommendation[]
  optimization: PersonalizationOptimization
  testing: PersonalizationTesting
  performance: PersonalizationPerformance
}

export interface PromotionAutomation {
  enabled: boolean
  triggers: AutomationTrigger[]
  workflows: AutomationWorkflow[]
  rules: AutomationRule[]
  optimization: AutomationOptimization
  monitoring: AutomationMonitoring
  alerts: AutomationAlert[]
  reporting: AutomationReporting
}

export interface DiscountEngine {
  id: string
  name: string
  type: 'percentage' | 'fixed' | 'tiered' | 'progressive' | 'dynamic'
  calculation: DiscountCalculation
  application: DiscountApplication
  stacking: DiscountStacking
  limitations: DiscountLimitation[]
  validation: DiscountValidation
  optimization: DiscountOptimization
  testing: DiscountTesting
  performance: DiscountPerformance
}

export interface LoyaltyProgram {
  id: string
  name: string
  description: string
  type: 'points' | 'tiers' | 'cashback' | 'perks' | 'hybrid'
  structure: LoyaltyStructure
  earning: LoyaltyEarning
  redemption: LoyaltyRedemption
  tiers: LoyaltyTier[]
  benefits: LoyaltyBenefit[]
  rules: LoyaltyRule[]
  gamification: LoyaltyGamification
  personalization: LoyaltyPersonalization
  analytics: LoyaltyAnalytics
  integration: LoyaltyIntegration
}

export interface CouponSystem {
  id: string
  name: string
  type: 'single_use' | 'multi_use' | 'bulk' | 'dynamic'
  generation: CouponGeneration
  distribution: CouponDistribution
  validation: CouponValidation
  redemption: CouponRedemption
  tracking: CouponTracking
  security: CouponSecurity
  analytics: CouponAnalytics
  lifecycle: CouponLifecycle
}

export interface PromotionOptimization {
  enabled: boolean
  objectives: OptimizationObjective[]
  constraints: OptimizationConstraint[]
  algorithms: OptimizationAlgorithm[]
  testing: OptimizationTesting
  learning: OptimizationLearning
  automation: OptimizationAutomation
  performance: OptimizationPerformance
  recommendations: OptimizationRecommendation[]
}

class PromotionsEngineCompleteService {
  // Campaign Management
  async getPromotionCampaigns(params?: {
    status?: string
    type?: string
    brandId?: string
    channel?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<PromotionCampaign[]> {
    const response = await apiClient.get('/promotions/campaigns', { params })
    return response.campaigns
  }

  async createCampaign(campaign: Omit<PromotionCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromotionCampaign> {
    return apiClient.post('/promotions/campaigns', campaign)
  }

  async updateCampaign(id: string, updates: Partial<PromotionCampaign>): Promise<PromotionCampaign> {
    return apiClient.put(`/promotions/campaigns/${id}`, updates)
  }

  async launchCampaign(id: string, options?: {
    testMode?: boolean
    rolloutPercentage?: number
    channels?: string[]
  }): Promise<PromotionCampaign> {
    return apiClient.post(`/promotions/campaigns/${id}/launch`, options)
  }

  async pauseCampaign(id: string, reason: string): Promise<PromotionCampaign> {
    return apiClient.post(`/promotions/campaigns/${id}/pause`, { reason })
  }

  async resumeCampaign(id: string): Promise<PromotionCampaign> {
    return apiClient.post(`/promotions/campaigns/${id}/resume`)
  }

  async stopCampaign(id: string, reason: string): Promise<PromotionCampaign> {
    return apiClient.post(`/promotions/campaigns/${id}/stop`, { reason })
  }

  async duplicateCampaign(id: string, options: {
    name: string
    timeline?: PromotionTimeline
    targeting?: PromotionTargeting
  }): Promise<PromotionCampaign> {
    return apiClient.post(`/promotions/campaigns/${id}/duplicate`, options)
  }

  // Rules Engine
  async getPromotionRules(campaignId?: string): Promise<PromotionRule[]> {
    const params = campaignId ? { campaignId } : {}
    const response = await apiClient.get('/promotions/rules', { params })
    return response.rules
  }

  async createRule(rule: Omit<PromotionRule, 'id'>): Promise<PromotionRule> {
    return apiClient.post('/promotions/rules', rule)
  }

  async updateRule(id: string, updates: Partial<PromotionRule>): Promise<PromotionRule> {
    return apiClient.put(`/promotions/rules/${id}`, updates)
  }

  async testRule(rule: PromotionRule, testData: any): Promise<RuleTestResult> {
    return apiClient.post('/promotions/rules/test', { rule, testData })
  }

  async validateRules(campaignId: string): Promise<RuleValidationResult> {
    return apiClient.post(`/promotions/campaigns/${campaignId}/validate-rules`)
  }

  async optimizeRules(campaignId: string, objectives: string[]): Promise<RuleOptimizationResult> {
    return apiClient.post(`/promotions/campaigns/${campaignId}/optimize-rules`, { objectives })
  }

  // Discount Engine
  async calculateDiscount(params: {
    customerId: string
    products: ProductItem[]
    promotionIds?: string[]
    context?: DiscountContext
  }): Promise<DiscountCalculationResult> {
    return apiClient.post('/promotions/discount/calculate', params)
  }

  async applyDiscount(params: {
    orderId: string
    discountId: string
    customerId: string
    validationCode?: string
  }): Promise<DiscountApplicationResult> {
    return apiClient.post('/promotions/discount/apply', params)
  }

  async validateDiscount(params: {
    discountId: string
    customerId: string
    products: ProductItem[]
    context?: DiscountContext
  }): Promise<DiscountValidationResult> {
    return apiClient.post('/promotions/discount/validate', params)
  }

  async getDiscountHistory(customerId: string, period?: string): Promise<DiscountHistory[]> {
    const response = await apiClient.get(`/promotions/discount/history/${customerId}`, { params: { period } })
    return response.history
  }

  // Coupon System
  async generateCoupons(params: {
    campaignId: string
    quantity: number
    type: 'single_use' | 'multi_use'
    pattern?: string
    expiration?: string
    limitations?: CouponLimitation[]
  }): Promise<CouponGenerationResult> {
    return apiClient.post('/promotions/coupons/generate', params)
  }

  async validateCoupon(code: string, customerId: string, context?: CouponContext): Promise<CouponValidationResult> {
    return apiClient.post('/promotions/coupons/validate', { code, customerId, context })
  }

  async redeemCoupon(params: {
    code: string
    customerId: string
    orderId: string
    products: ProductItem[]
  }): Promise<CouponRedemptionResult> {
    return apiClient.post('/promotions/coupons/redeem', params)
  }

  async getCouponUsage(code: string): Promise<CouponUsage> {
    return apiClient.get(`/promotions/coupons/${code}/usage`)
  }

  async distributeCoupons(params: {
    campaignId: string
    coupons: string[]
    channels: DistributionChannel[]
    targeting?: CouponTargeting
    schedule?: DistributionSchedule
  }): Promise<CouponDistributionResult> {
    return apiClient.post('/promotions/coupons/distribute', params)
  }

  // Loyalty Program
  async getLoyaltyPrograms(brandId?: string): Promise<LoyaltyProgram[]> {
    const params = brandId ? { brandId } : {}
    const response = await apiClient.get('/promotions/loyalty/programs', { params })
    return response.programs
  }

  async createLoyaltyProgram(program: Omit<LoyaltyProgram, 'id'>): Promise<LoyaltyProgram> {
    return apiClient.post('/promotions/loyalty/programs', program)
  }

  async updateLoyaltyProgram(id: string, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    return apiClient.put(`/promotions/loyalty/programs/${id}`, updates)
  }

  async enrollCustomer(programId: string, customerId: string): Promise<LoyaltyEnrollmentResult> {
    return apiClient.post(`/promotions/loyalty/programs/${programId}/enroll`, { customerId })
  }

  async getCustomerLoyalty(customerId: string): Promise<CustomerLoyaltyStatus> {
    return apiClient.get(`/promotions/loyalty/customers/${customerId}`)
  }

  async earnPoints(params: {
    customerId: string
    programId: string
    points: number
    source: string
    reference?: string
    metadata?: Record<string, any>
  }): Promise<PointsTransaction> {
    return apiClient.post('/promotions/loyalty/points/earn', params)
  }

  async redeemPoints(params: {
    customerId: string
    programId: string
    points: number
    rewardId: string
    orderId?: string
  }): Promise<PointsRedemptionResult> {
    return apiClient.post('/promotions/loyalty/points/redeem', params)
  }

  async getPointsHistory(customerId: string, programId?: string): Promise<PointsTransaction[]> {
    const params = programId ? { programId } : {}
    const response = await apiClient.get(`/promotions/loyalty/customers/${customerId}/points`, { params })
    return response.transactions
  }

  // Targeting & Personalization
  async getCustomerSegments(brandId?: string): Promise<CustomerSegment[]> {
    const params = brandId ? { brandId } : {}
    const response = await apiClient.get('/promotions/targeting/segments', { params })
    return response.segments
  }

  async createSegment(segment: Omit<CustomerSegment, 'id'>): Promise<CustomerSegment> {
    return apiClient.post('/promotions/targeting/segments', segment)
  }

  async updateSegment(id: string, updates: Partial<CustomerSegment>): Promise<CustomerSegment> {
    return apiClient.put(`/promotions/targeting/segments/${id}`, updates)
  }

  async getSegmentMembers(segmentId: string, limit?: number): Promise<SegmentMember[]> {
    const params = limit ? { limit } : {}
    const response = await apiClient.get(`/promotions/targeting/segments/${segmentId}/members`, { params })
    return response.members
  }

  async getPersonalizedOffers(customerId: string, context?: PersonalizationContext): Promise<PersonalizedOffer[]> {
    const response = await apiClient.get(`/promotions/personalization/offers/${customerId}`, { params: context })
    return response.offers
  }

  async recordPersonalizationEvent(event: PersonalizationEvent): Promise<void> {
    return apiClient.post('/promotions/personalization/events', event)
  }

  // A/B Testing
  async createTest(test: Omit<PromotionTesting, 'results' | 'winner'>): Promise<PromotionTesting> {
    return apiClient.post('/promotions/testing/tests', test)
  }

  async startTest(testId: string): Promise<PromotionTesting> {
    return apiClient.post(`/promotions/testing/tests/${testId}/start`)
  }

  async stopTest(testId: string, reason?: string): Promise<PromotionTesting> {
    return apiClient.post(`/promotions/testing/tests/${testId}/stop`, { reason })
  }

  async getTestResults(testId: string): Promise<TestResults> {
    return apiClient.get(`/promotions/testing/tests/${testId}/results`)
  }

  async declareWinner(testId: string, variantId: string): Promise<PromotionTesting> {
    return apiClient.post(`/promotions/testing/tests/${testId}/winner`, { variantId })
  }

  // Analytics & Reporting
  async getPromotionAnalytics(params: {
    campaignId?: string
    period: string
    metrics?: string[]
    groupBy?: string
    filters?: Record<string, any>
  }): Promise<PromotionAnalytics> {
    return apiClient.get('/promotions/analytics', { params })
  }

  async getCampaignPerformance(campaignId: string, period: string): Promise<PromotionPerformance> {
    return apiClient.get(`/promotions/campaigns/${campaignId}/performance`, { params: { period } })
  }

  async getChannelPerformance(channelId: string, period: string): Promise<ChannelPerformance> {
    return apiClient.get(`/promotions/channels/${channelId}/performance`, { params: { period } })
  }

  async getROIAnalysis(params: {
    campaignIds?: string[]
    period: string
    attribution?: string
  }): Promise<ROIAnalysis> {
    return apiClient.get('/promotions/analytics/roi', { params })
  }

  async getLiftAnalysis(params: {
    campaignId: string
    controlGroup: string
    testGroup: string
    metrics: string[]
  }): Promise<LiftAnalysis> {
    return apiClient.get('/promotions/analytics/lift', { params })
  }

  async getAttributionAnalysis(params: {
    customerId?: string
    period: string
    touchpoints: string[]
    model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based'
  }): Promise<AttributionAnalysis> {
    return apiClient.get('/promotions/analytics/attribution', { params })
  }

  async getForecast(params: {
    campaignId: string
    horizon: number
    metrics: string[]
    confidence?: number
  }): Promise<PromotionForecast> {
    return apiClient.get('/promotions/analytics/forecast', { params })
  }

  // Optimization
  async optimizeCampaign(campaignId: string, objectives: OptimizationObjective[]): Promise<OptimizationResult> {
    return apiClient.post(`/promotions/campaigns/${campaignId}/optimize`, { objectives })
  }

  async getOptimizationRecommendations(campaignId: string): Promise<OptimizationRecommendation[]> {
    const response = await apiClient.get(`/promotions/campaigns/${campaignId}/recommendations`)
    return response.recommendations
  }

  async applyOptimization(campaignId: string, optimizationId: string): Promise<PromotionCampaign> {
    return apiClient.post(`/promotions/campaigns/${campaignId}/apply-optimization`, { optimizationId })
  }

  // Real-time Processing
  async processRealTimeEvent(event: PromotionEvent): Promise<PromotionEventResult> {
    return apiClient.post('/promotions/events/process', event)
  }

  async getEligiblePromotions(params: {
    customerId: string
    products?: ProductItem[]
    context?: PromotionContext
    channel?: string
  }): Promise<EligiblePromotion[]> {
    const response = await apiClient.get('/promotions/eligible', { params })
    return response.promotions
  }

  async trackPromotionEvent(event: PromotionTrackingEvent): Promise<void> {
    return apiClient.post('/promotions/tracking/events', event)
  }

  // Integration & Export
  async syncWithEcommerce(data: EcommerceSyncData): Promise<EcommerceSyncResult> {
    return apiClient.post('/promotions/integrations/ecommerce/sync', data)
  }

  async syncWithCRM(data: CRMSyncData): Promise<CRMSyncResult> {
    return apiClient.post('/promotions/integrations/crm/sync', data)
  }

  async exportCampaignData(campaignId: string, format: 'csv' | 'excel' | 'json'): Promise<Blob> {
    return apiClient.get(`/promotions/campaigns/${campaignId}/export`, { 
      params: { format }, 
      responseType: 'blob' 
    })
  }

  async generateCampaignReport(campaignId: string, template: string): Promise<Blob> {
    return apiClient.post(`/promotions/campaigns/${campaignId}/report`, 
      { template }, 
      { responseType: 'blob' }
    )
  }
}

const promotionsEngineCompleteService = new PromotionsEngineCompleteService()
export default promotionsEngineCompleteService