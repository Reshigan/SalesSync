// Complete Advanced Inventory Management System - AI-Powered Optimization
import apiClient from '@/lib/api-client'

export interface InventoryItem {
  id: string
  productId: string
  product: Product
  locationId: string
  location: InventoryLocation
  sku: string
  batchNumber?: string
  serialNumber?: string
  currentStock: number
  availableStock: number
  reservedStock: number
  inTransitStock: number
  damagedStock: number
  expiredStock: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  reorderQuantity: number
  safetyStock: number
  leadTime: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  lastCounted: string
  nextCountDate: string
  movements: InventoryMovement[]
  forecasting: InventoryForecast
  optimization: InventoryOptimization
  alerts: InventoryAlert[]
  compliance: InventoryCompliance
  quality: InventoryQuality
  sustainability: InventorySustainability
  automation: InventoryAutomation
  analytics: InventoryAnalytics
  createdAt: string
  updatedAt: string
}

export interface InventoryLocation {
  id: string
  name: string
  code: string
  type: 'warehouse' | 'store' | 'van' | 'distribution_center' | 'supplier' | 'customer'
  address: LocationAddress
  coordinates: GeoLocation
  capacity: LocationCapacity
  zones: InventoryZone[]
  equipment: LocationEquipment[]
  staff: LocationStaff[]
  operating: OperatingSchedule
  climate: ClimateControl
  security: LocationSecurity
  compliance: LocationCompliance
  automation: LocationAutomation
  analytics: LocationAnalytics
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: string
  updatedAt: string
}

export interface InventoryZone {
  id: string
  name: string
  code: string
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine' | 'returns'
  capacity: ZoneCapacity
  conditions: StorageConditions
  restrictions: ZoneRestriction[]
  equipment: ZoneEquipment[]
  layout: ZoneLayout
  optimization: ZoneOptimization
  performance: ZonePerformance
  status: 'active' | 'inactive' | 'full' | 'maintenance'
}

export interface InventoryMovement {
  id: string
  itemId: string
  type: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'return' | 'damage' | 'expiry'
  direction: 'in' | 'out'
  quantity: number
  unitCost: number
  totalCost: number
  fromLocation?: string
  toLocation?: string
  reason: string
  reference: string
  documentNumber?: string
  userId: string
  user: User
  timestamp: string
  batchNumber?: string
  serialNumbers?: string[]
  quality: MovementQuality
  compliance: MovementCompliance
  automation: MovementAutomation
  tracking: MovementTracking
  approval: MovementApproval
  reversal?: MovementReversal
  createdAt: string
}

export interface InventoryForecast {
  itemId: string
  period: ForecastPeriod
  method: 'moving_average' | 'exponential_smoothing' | 'arima' | 'machine_learning' | 'hybrid'
  demand: DemandForecast
  supply: SupplyForecast
  recommendations: ForecastRecommendation[]
  accuracy: ForecastAccuracy
  confidence: number
  seasonality: SeasonalityPattern
  trends: TrendAnalysis
  external: ExternalFactors
  scenarios: ForecastScenario[]
  alerts: ForecastAlert[]
  optimization: ForecastOptimization
  lastUpdated: string
  nextUpdate: string
}

export interface DemandForecast {
  historical: HistoricalDemand[]
  predicted: PredictedDemand[]
  factors: DemandFactor[]
  patterns: DemandPattern[]
  volatility: DemandVolatility
  correlation: DemandCorrelation[]
  segmentation: DemandSegmentation
  elasticity: DemandElasticity
  cannibalization: DemandCannibalization
  substitution: DemandSubstitution
}

export interface SupplyForecast {
  leadTimes: LeadTimeForecast[]
  capacity: CapacityForecast
  constraints: SupplyConstraint[]
  reliability: SupplyReliability
  costs: CostForecast
  risks: SupplyRisk[]
  alternatives: SupplyAlternative[]
  optimization: SupplyOptimization
}

export interface InventoryOptimization {
  enabled: boolean
  objectives: OptimizationObjective[]
  constraints: OptimizationConstraint[]
  algorithms: OptimizationAlgorithm[]
  parameters: OptimizationParameter[]
  results: OptimizationResult[]
  recommendations: OptimizationRecommendation[]
  implementation: OptimizationImplementation
  monitoring: OptimizationMonitoring
  performance: OptimizationPerformance
  automation: OptimizationAutomation
  lastRun: string
  nextRun: string
}

export interface StockReplenishment {
  id: string
  itemId: string
  type: 'automatic' | 'manual' | 'emergency' | 'scheduled'
  trigger: ReplenishmentTrigger
  quantity: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  supplierId: string
  supplier: Supplier
  estimatedCost: number
  leadTime: number
  deliveryDate: string
  status: 'pending' | 'ordered' | 'confirmed' | 'shipped' | 'received' | 'cancelled'
  orderNumber?: string
  tracking?: string
  approval: ReplenishmentApproval
  alternatives: ReplenishmentAlternative[]
  optimization: ReplenishmentOptimization
  automation: ReplenishmentAutomation
  createdAt: string
  updatedAt: string
}

export interface InventoryCount {
  id: string
  name: string
  type: 'full' | 'partial' | 'cycle' | 'spot' | 'perpetual'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  locationId: string
  location: InventoryLocation
  items: CountItem[]
  schedule: CountSchedule
  team: CountTeam[]
  instructions: CountInstructions
  methodology: CountMethodology
  technology: CountTechnology
  quality: CountQuality
  discrepancies: CountDiscrepancy[]
  adjustments: CountAdjustment[]
  approval: CountApproval
  reporting: CountReporting
  analytics: CountAnalytics
  automation: CountAutomation
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface InventoryAnalytics {
  overview: AnalyticsOverview
  turnover: TurnoverAnalytics
  accuracy: AccuracyAnalytics
  availability: AvailabilityAnalytics
  efficiency: EfficiencyAnalytics
  costs: CostAnalytics
  performance: PerformanceAnalytics
  trends: TrendAnalytics
  forecasting: ForecastingAnalytics
  optimization: OptimizationAnalytics
  compliance: ComplianceAnalytics
  sustainability: SustainabilityAnalytics
  risks: RiskAnalytics
  benchmarking: BenchmarkingAnalytics
  insights: AnalyticsInsight[]
  recommendations: AnalyticsRecommendation[]
  alerts: AnalyticsAlert[]
  reports: AnalyticsReport[]
}

export interface InventoryAlert {
  id: string
  type: 'low_stock' | 'overstock' | 'expiry' | 'damage' | 'discrepancy' | 'forecast' | 'cost'
  severity: 'low' | 'medium' | 'high' | 'critical'
  itemId: string
  locationId: string
  message: string
  description: string
  threshold: AlertThreshold
  current: AlertCurrent
  recommendations: AlertRecommendation[]
  actions: AlertAction[]
  escalation: AlertEscalation
  acknowledgment: AlertAcknowledgment
  resolution: AlertResolution
  automation: AlertAutomation
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface InventoryAutomation {
  enabled: boolean
  rules: AutomationRule[]
  triggers: AutomationTrigger[]
  workflows: AutomationWorkflow[]
  scheduling: AutomationScheduling
  monitoring: AutomationMonitoring
  optimization: AutomationOptimization
  integration: AutomationIntegration
  reporting: AutomationReporting
  performance: AutomationPerformance
  alerts: AutomationAlert[]
  maintenance: AutomationMaintenance
}

export interface InventoryCompliance {
  regulations: ComplianceRegulation[]
  standards: ComplianceStandard[]
  certifications: ComplianceCertification[]
  audits: ComplianceAudit[]
  documentation: ComplianceDocumentation
  training: ComplianceTraining
  monitoring: ComplianceMonitoring
  reporting: ComplianceReporting
  violations: ComplianceViolation[]
  remediation: ComplianceRemediation
}

export interface InventoryQuality {
  standards: QualityStandard[]
  inspections: QualityInspection[]
  testing: QualityTesting
  certifications: QualityCertification[]
  defects: QualityDefect[]
  improvements: QualityImprovement[]
  metrics: QualityMetric[]
  reporting: QualityReporting
  automation: QualityAutomation
  compliance: QualityCompliance
}

export interface InventorySustainability {
  goals: SustainabilityGoal[]
  metrics: SustainabilityMetric[]
  initiatives: SustainabilityInitiative[]
  reporting: SustainabilityReporting
  certifications: SustainabilityCertification[]
  lifecycle: ProductLifecycle
  circular: CircularEconomy
  carbon: CarbonFootprint
  waste: WasteManagement
  energy: EnergyEfficiency
}

class InventoryManagementCompleteService {
  // Inventory Item Management
  async getInventoryItems(params?: {
    locationId?: string
    productId?: string
    category?: string
    status?: string
    lowStock?: boolean
    expiring?: boolean
    search?: string
  }): Promise<InventoryItem[]> {
    const response = await apiClient.get('/inventory/items', { params })
    return response.items
  }

  async getInventoryItem(id: string): Promise<InventoryItem> {
    return apiClient.get(`/inventory/items/${id}`)
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    return apiClient.post('/inventory/items', item)
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    return apiClient.put(`/inventory/items/${id}`, updates)
  }

  async adjustInventory(id: string, adjustment: {
    quantity: number
    reason: string
    reference?: string
    cost?: number
    notes?: string
  }): Promise<InventoryMovement> {
    return apiClient.post(`/inventory/items/${id}/adjust`, adjustment)
  }

  async transferInventory(fromItemId: string, toLocationId: string, quantity: number, reason: string): Promise<InventoryMovement> {
    return apiClient.post(`/inventory/items/${fromItemId}/transfer`, {
      toLocationId,
      quantity,
      reason
    })
  }

  async reserveInventory(itemId: string, quantity: number, reference: string, expiresAt?: string): Promise<InventoryReservation> {
    return apiClient.post(`/inventory/items/${itemId}/reserve`, {
      quantity,
      reference,
      expiresAt
    })
  }

  async releaseReservation(reservationId: string): Promise<void> {
    return apiClient.delete(`/inventory/reservations/${reservationId}`)
  }

  // Location Management
  async getLocations(params?: {
    type?: string
    status?: string
    region?: string
    search?: string
  }): Promise<InventoryLocation[]> {
    const response = await apiClient.get('/inventory/locations', { params })
    return response.locations
  }

  async createLocation(location: Omit<InventoryLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryLocation> {
    return apiClient.post('/inventory/locations', location)
  }

  async updateLocation(id: string, updates: Partial<InventoryLocation>): Promise<InventoryLocation> {
    return apiClient.put(`/inventory/locations/${id}`, updates)
  }

  async getLocationInventory(locationId: string, params?: {
    category?: string
    status?: string
    lowStock?: boolean
  }): Promise<InventoryItem[]> {
    const response = await apiClient.get(`/inventory/locations/${locationId}/items`, { params })
    return response.items
  }

  async optimizeLocationLayout(locationId: string, objectives: string[]): Promise<LayoutOptimizationResult> {
    return apiClient.post(`/inventory/locations/${locationId}/optimize-layout`, { objectives })
  }

  // Movement Tracking
  async getMovements(params?: {
    itemId?: string
    locationId?: string
    type?: string
    dateFrom?: string
    dateTo?: string
    userId?: string
  }): Promise<InventoryMovement[]> {
    const response = await apiClient.get('/inventory/movements', { params })
    return response.movements
  }

  async createMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
    return apiClient.post('/inventory/movements', movement)
  }

  async reverseMovement(movementId: string, reason: string): Promise<InventoryMovement> {
    return apiClient.post(`/inventory/movements/${movementId}/reverse`, { reason })
  }

  async getMovementHistory(itemId: string, period?: string): Promise<InventoryMovement[]> {
    const params = period ? { period } : {}
    const response = await apiClient.get(`/inventory/items/${itemId}/movements`, { params })
    return response.movements
  }

  // Forecasting & Demand Planning
  async getForecast(params: {
    itemId?: string
    locationId?: string
    period: string
    method?: string
    confidence?: number
  }): Promise<InventoryForecast[]> {
    const response = await apiClient.get('/inventory/forecast', { params })
    return response.forecasts
  }

  async generateForecast(params: {
    itemIds: string[]
    locationIds?: string[]
    horizon: number
    method: string
    parameters?: Record<string, any>
  }): Promise<ForecastGenerationResult> {
    return apiClient.post('/inventory/forecast/generate', params)
  }

  async updateForecastParameters(itemId: string, parameters: ForecastParameters): Promise<InventoryForecast> {
    return apiClient.put(`/inventory/forecast/${itemId}/parameters`, parameters)
  }

  async getDemandAnalysis(params: {
    itemId: string
    period: string
    segmentation?: string[]
    factors?: string[]
  }): Promise<DemandAnalysis> {
    return apiClient.get('/inventory/demand/analysis', { params })
  }

  async getSeasonalityAnalysis(itemId: string, years: number): Promise<SeasonalityAnalysis> {
    return apiClient.get(`/inventory/items/${itemId}/seasonality`, { params: { years } })
  }

  // Optimization
  async optimizeInventory(params: {
    locationIds?: string[]
    itemIds?: string[]
    objectives: string[]
    constraints?: OptimizationConstraint[]
    horizon?: number
  }): Promise<InventoryOptimizationResult> {
    return apiClient.post('/inventory/optimize', params)
  }

  async getOptimizationRecommendations(params: {
    locationId?: string
    category?: string
    priority?: string
  }): Promise<OptimizationRecommendation[]> {
    const response = await apiClient.get('/inventory/optimization/recommendations', { params })
    return response.recommendations
  }

  async applyOptimization(optimizationId: string, recommendations: string[]): Promise<OptimizationApplication> {
    return apiClient.post(`/inventory/optimization/${optimizationId}/apply`, { recommendations })
  }

  async calculateOptimalStock(itemId: string, parameters: OptimalStockParameters): Promise<OptimalStockResult> {
    return apiClient.post(`/inventory/items/${itemId}/optimal-stock`, parameters)
  }

  // Replenishment
  async getReplenishmentSuggestions(params?: {
    locationId?: string
    urgency?: string
    automated?: boolean
  }): Promise<StockReplenishment[]> {
    const response = await apiClient.get('/inventory/replenishment/suggestions', { params })
    return response.suggestions
  }

  async createReplenishmentOrder(replenishment: Omit<StockReplenishment, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockReplenishment> {
    return apiClient.post('/inventory/replenishment/orders', replenishment)
  }

  async approveReplenishment(replenishmentId: string, approval: ReplenishmentApproval): Promise<StockReplenishment> {
    return apiClient.post(`/inventory/replenishment/${replenishmentId}/approve`, approval)
  }

  async trackReplenishment(replenishmentId: string): Promise<ReplenishmentTracking> {
    return apiClient.get(`/inventory/replenishment/${replenishmentId}/tracking`)
  }

  async receiveReplenishment(replenishmentId: string, receipt: ReplenishmentReceipt): Promise<StockReplenishment> {
    return apiClient.post(`/inventory/replenishment/${replenishmentId}/receive`, receipt)
  }

  async automateReplenishment(itemId: string, rules: AutomationRule[]): Promise<ReplenishmentAutomation> {
    return apiClient.post(`/inventory/items/${itemId}/automate-replenishment`, { rules })
  }

  // Inventory Counting
  async getCounts(params?: {
    locationId?: string
    type?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<InventoryCount[]> {
    const response = await apiClient.get('/inventory/counts', { params })
    return response.counts
  }

  async createCount(count: Omit<InventoryCount, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryCount> {
    return apiClient.post('/inventory/counts', count)
  }

  async startCount(countId: string): Promise<InventoryCount> {
    return apiClient.post(`/inventory/counts/${countId}/start`)
  }

  async recordCount(countId: string, itemId: string, countData: {
    countedQuantity: number
    condition?: string
    notes?: string
    photos?: string[]
    countedBy: string
  }): Promise<CountItem> {
    return apiClient.post(`/inventory/counts/${countId}/items/${itemId}/record`, countData)
  }

  async completeCount(countId: string): Promise<InventoryCount> {
    return apiClient.post(`/inventory/counts/${countId}/complete`)
  }

  async getCountDiscrepancies(countId: string): Promise<CountDiscrepancy[]> {
    const response = await apiClient.get(`/inventory/counts/${countId}/discrepancies`)
    return response.discrepancies
  }

  async resolveDiscrepancy(countId: string, discrepancyId: string, resolution: DiscrepancyResolution): Promise<CountDiscrepancy> {
    return apiClient.post(`/inventory/counts/${countId}/discrepancies/${discrepancyId}/resolve`, resolution)
  }

  async generateCycleCountSchedule(locationId: string, parameters: CycleCountParameters): Promise<CycleCountSchedule> {
    return apiClient.post(`/inventory/locations/${locationId}/cycle-count-schedule`, parameters)
  }

  // Analytics & Reporting
  async getInventoryAnalytics(params: {
    locationIds?: string[]
    itemIds?: string[]
    period: string
    metrics?: string[]
    groupBy?: string
  }): Promise<InventoryAnalytics> {
    return apiClient.get('/inventory/analytics', { params })
  }

  async getTurnoverAnalysis(params: {
    locationId?: string
    category?: string
    period: string
  }): Promise<TurnoverAnalysis> {
    return apiClient.get('/inventory/analytics/turnover', { params })
  }

  async getAccuracyMetrics(params: {
    locationId?: string
    period: string
    type?: string
  }): Promise<AccuracyMetrics> {
    return apiClient.get('/inventory/analytics/accuracy', { params })
  }

  async getAvailabilityMetrics(params: {
    locationId?: string
    category?: string
    period: string
  }): Promise<AvailabilityMetrics> {
    return apiClient.get('/inventory/analytics/availability', { params })
  }

  async getCostAnalysis(params: {
    locationId?: string
    category?: string
    period: string
    breakdown?: string[]
  }): Promise<CostAnalysis> {
    return apiClient.get('/inventory/analytics/costs', { params })
  }

  async getPerformanceMetrics(params: {
    locationId?: string
    period: string
    benchmarks?: boolean
  }): Promise<PerformanceMetrics> {
    return apiClient.get('/inventory/analytics/performance', { params })
  }

  async generateInventoryReport(params: {
    type: 'valuation' | 'movement' | 'turnover' | 'accuracy' | 'forecast'
    format: 'pdf' | 'excel' | 'csv'
    locationIds?: string[]
    itemIds?: string[]
    period: string
    template?: string
  }): Promise<Blob> {
    return apiClient.post('/inventory/reports/generate', params, { responseType: 'blob' })
  }

  // Alerts & Notifications
  async getAlerts(params?: {
    type?: string
    severity?: string
    status?: string
    locationId?: string
    itemId?: string
  }): Promise<InventoryAlert[]> {
    const response = await apiClient.get('/inventory/alerts', { params })
    return response.alerts
  }

  async acknowledgeAlert(alertId: string, acknowledgment: AlertAcknowledgment): Promise<InventoryAlert> {
    return apiClient.post(`/inventory/alerts/${alertId}/acknowledge`, acknowledgment)
  }

  async resolveAlert(alertId: string, resolution: AlertResolution): Promise<InventoryAlert> {
    return apiClient.post(`/inventory/alerts/${alertId}/resolve`, resolution)
  }

  async configureAlertRules(locationId: string, rules: AlertRule[]): Promise<AlertConfiguration> {
    return apiClient.post(`/inventory/locations/${locationId}/alert-rules`, { rules })
  }

  async subscribeToAlerts(subscription: AlertSubscription): Promise<AlertSubscriptionResult> {
    return apiClient.post('/inventory/alerts/subscribe', subscription)
  }

  // Automation
  async getAutomationRules(locationId?: string): Promise<AutomationRule[]> {
    const params = locationId ? { locationId } : {}
    const response = await apiClient.get('/inventory/automation/rules', { params })
    return response.rules
  }

  async createAutomationRule(rule: Omit<AutomationRule, 'id'>): Promise<AutomationRule> {
    return apiClient.post('/inventory/automation/rules', rule)
  }

  async updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    return apiClient.put(`/inventory/automation/rules/${ruleId}`, updates)
  }

  async testAutomationRule(ruleId: string, testData: any): Promise<AutomationTestResult> {
    return apiClient.post(`/inventory/automation/rules/${ruleId}/test`, testData)
  }

  async getAutomationHistory(params?: {
    ruleId?: string
    locationId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<AutomationExecution[]> {
    const response = await apiClient.get('/inventory/automation/history', { params })
    return response.executions
  }

  // Integration & Export
  async syncWithERP(data: ERPSyncData): Promise<ERPSyncResult> {
    return apiClient.post('/inventory/integrations/erp/sync', data)
  }

  async syncWithWMS(data: WMSSyncData): Promise<WMSSyncResult> {
    return apiClient.post('/inventory/integrations/wms/sync', data)
  }

  async exportInventoryData(params: {
    locationIds?: string[]
    itemIds?: string[]
    format: 'csv' | 'excel' | 'json'
    includeMovements?: boolean
    includeForecasts?: boolean
    dateFrom?: string
    dateTo?: string
  }): Promise<Blob> {
    return apiClient.get('/inventory/export', { params, responseType: 'blob' })
  }

  async importInventoryData(file: File, options: {
    format: 'csv' | 'excel' | 'json'
    mapping?: Record<string, string>
    validation?: boolean
    dryRun?: boolean
  }): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))
    
    return apiClient.post('/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // Real-time Monitoring
  async getInventoryStatus(locationId?: string): Promise<InventoryStatus> {
    const params = locationId ? { locationId } : {}
    return apiClient.get('/inventory/status', { params })
  }

  async subscribeToInventoryUpdates(callback: (update: InventoryUpdate) => void): Promise<() => void> {
    // WebSocket subscription implementation
    const ws = new WebSocket('/inventory/updates/subscribe')
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      callback(update)
    }
    
    return () => ws.close()
  }

  async getInventoryHealth(locationId?: string): Promise<InventoryHealth> {
    const params = locationId ? { locationId } : {}
    return apiClient.get('/inventory/health', { params })
  }
}

const inventoryManagementCompleteService = new InventoryManagementCompleteService()
export default inventoryManagementCompleteService