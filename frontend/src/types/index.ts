// Core Types for SalesSync Platform

export interface User {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  role: UserRole
  tenantId: string
  permissions: Permission[]
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
}

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'van_sales'
  | 'promoter'
  | 'merchandiser'
  | 'field_agent'
  | 'warehouse_staff'
  | 'back_office'

export interface Permission {
  module: string
  function: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canExport: boolean
}

export interface Tenant {
  id: string
  name: string
  code: string
  modules: TenantModules
  limits: TenantLimits
  features: TenantFeatures
  status: 'active' | 'suspended' | 'trial'
  createdAt: Date
}

export interface TenantModules {
  vanSales: boolean
  promotions: boolean
  merchandising: boolean
  digitalDistribution: boolean
  warehouse: boolean
  backOffice: boolean
}

export interface TenantLimits {
  maxUsers: number
  maxTransactionsPerDay: number
  maxStorageGB: number
  maxAgentsPerRole: Record<UserRole, number>
}

export interface TenantFeatures {
  aiPredictions: boolean
  advancedReporting: boolean
  multiWarehouse: boolean
  customWorkflows: boolean
}

// Van Sales Types
export interface VanLoad {
  id: string
  tenantId: string
  vanId: string
  salesmanId: string
  loadDate: Date
  stockLoaded: LoadItem[]
  cashFloat: number
  stockReturned?: LoadItem[]
  stockSold?: LoadItem[]
  stockDamaged?: LoadItem[]
  cashCollected?: number
  cashDeposited?: number
  status: VanLoadStatus
  reconciliationStatus?: ReconciliationStatus
  discrepancyNotes?: string
  createdAt: Date
}

export interface LoadItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  batchNumber?: string
}

export type VanLoadStatus = 'loading' | 'in_field' | 'returning' | 'reconciling' | 'completed'
export type ReconciliationStatus = 'pending' | 'partial' | 'completed' | 'discrepancy'

// Promoter Types
export interface PromotionalCampaign {
  id: string
  tenantId: string
  name: string
  brandId?: string
  campaignType: CampaignType
  startDate: Date
  endDate: Date
  budget: number
  targetActivations: number
  targetSamples: number
  materials: CampaignMaterial[]
  successMetrics: Record<string, any>
  status: CampaignStatus
  createdAt: Date
}

export type CampaignType = 'sampling' | 'activation' | 'display' | 'education'
export type CampaignStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'

export interface CampaignMaterial {
  id: string
  name: string
  type: string
  quantity: number
  description?: string
}

export interface PromoterActivity {
  id: string
  tenantId: string
  promoterId: string
  campaignId: string
  customerId: string
  activityDate: Date
  activityType: ActivityType
  startTime: Date
  endTime: Date
  location: GeoLocation
  samplesDistributed: number
  contactsMade: number
  surveysCompleted: number
  photos: ActivityPhoto[]
  surveyData?: Record<string, any>
  verifiedLocation: boolean
  photoVerificationScore?: number
  managerApproved: boolean
  status: ActivityStatus
  notes?: string
  createdAt: Date
}

export type ActivityType = 'sampling' | 'demo' | 'display_setup' | 'survey'
export type ActivityStatus = 'pending' | 'verified' | 'approved' | 'rejected'

export interface ActivityPhoto {
  id: string
  url: string
  caption?: string
  timestamp: Date
  geoLocation?: GeoLocation
  aiAnalysis?: PhotoAnalysis
}

export interface PhotoAnalysis {
  brandDetected: boolean
  peopleCount: number
  setupCompliance: number
  insights: string[]
  confidence: number
}

// Merchandiser Types
export interface MerchandisingVisit {
  id: string
  tenantId: string
  merchandiserId: string
  customerId: string
  visitDate: Date
  shelfSharePercentage: number
  facingsCount: Record<string, number>
  planogramCompliance: number
  competitorPrices: Record<string, Record<string, number>>
  competitorPromotions: Record<string, any>
  storePhotos: ActivityPhoto[]
  displayPhotos: ActivityPhoto[]
  issuesIdentified: StoreIssue[]
  aiShelfAnalysis?: ShelfAnalysis
  aiComplianceScore?: number
  aiInsights: string[]
  status: VisitStatus
  createdAt: Date
}

export interface StoreIssue {
  type: IssueType
  severity: IssueSeverity
  description: string
  photo?: string
  resolved: boolean
}

export type IssueType = 'out_of_stock' | 'incorrect_pricing' | 'damaged_product' | 'poor_display' | 'competitor_activity'
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type VisitStatus = 'completed' | 'pending_review' | 'approved'

export interface ShelfAnalysis {
  brandShare: number
  facings: Record<string, number>
  outOfStock: string[]
  incorrectPricing: PricingIssue[]
  damagedProducts: string[]
  competitorActivity: CompetitorActivity[]
}

export interface PricingIssue {
  productId: string
  expectedPrice: number
  actualPrice: number
  variance: number
}

export interface CompetitorActivity {
  competitor: string
  activity: string
  impact: 'low' | 'medium' | 'high'
  description: string
}

// Field Agent Types
export interface FieldAgentActivity {
  id: string
  tenantId: string
  fieldAgentId: string
  activityType: FieldActivityType
  boardType?: string
  boardSize?: string
  placementLocation?: Record<string, any>
  placementPhoto?: string
  rentalAgreement?: string
  monthlyRental?: number
  productType?: DigitalProductType
  productDetails?: Record<string, any>
  quantityDistributed?: number
  activationCodes?: string[]
  newCustomer: boolean
  customerId?: string
  kycDocuments?: Record<string, any>
  location: GeoLocation
  activityDate: Date
  status: ActivityStatus
  createdAt: Date
}

export type FieldActivityType = 'board_placement' | 'sim_distribution' | 'voucher_sales'
export type DigitalProductType = 'sim_card' | 'airtime' | 'data_bundle' | 'voucher'

// Common Types
export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
}

export interface Product {
  id: string
  tenantId: string
  sku: string
  name: string
  description?: string
  categoryId: string
  category?: ProductCategory
  brand?: string
  unitPrice: number
  costPrice: number
  barcode?: string
  weight?: number
  dimensions?: ProductDimensions
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductCategory {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tenantId: string
  parentId?: string
  parent?: ProductCategory
  children?: ProductCategory[]
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'in'
}

export interface Customer {
  id: string
  tenantId: string
  code: string
  name: string
  customerType: CustomerType
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  coordinates?: any
  creditLimit?: number
  paymentTerms?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  routeId?: string
}

export type CustomerType = 'retail' | 'wholesale' | 'distributor' | 'institution'

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Warehouse {
  id: string
  tenantId: string
  code: string
  name: string
  type: WarehouseType
  location: GeoLocation
  address: Address
  capacityUnits: number
  managerId?: string
  operatingHours: OperatingHours
  status: 'active' | 'inactive'
  createdAt: Date
}

export type WarehouseType = 'main' | 'secondary' | 'mobile' | 'virtual'

export interface OperatingHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Dashboard Types
export interface DashboardStats {
  totalSales: number
  totalOrders: number
  activeAgents: number
  pendingReconciliations: number
  lowStockAlerts: number
  completedActivities: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
}

// Commission Types
export interface CommissionStructure {
  id: string
  tenantId: string
  name: string
  roleType: UserRole
  calculationType: CommissionCalculationType
  baseRate: number
  tiers?: CommissionTier[]
  achievementBonuses: Record<string, number>
  deductionRules: Record<string, number>
  effectiveFrom: Date
  effectiveTo?: Date
  status: 'active' | 'inactive'
  createdAt: Date
}

export type CommissionCalculationType = 'percentage' | 'fixed' | 'tiered' | 'mixed'

export interface CommissionTier {
  min: number
  max: number
  rate: number
}

export interface AgentCommission {
  id: string
  tenantId: string
  agentId: string
  periodStart: Date
  periodEnd: Date
  roleType: UserRole
  baseAchievement: number
  commissionStructureId: string
  baseCommission: number
  bonuses: Record<string, number>
  deductions: Record<string, number>
  finalAmount: number
  paymentStatus: PaymentStatus
  paymentDate?: Date
  paymentReference?: string
  createdAt: Date
}

export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'disputed'