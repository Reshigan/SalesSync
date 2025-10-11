// Complete Van Sales Management System - Enterprise Implementation
import apiClient from '@/lib/api-client'

export interface VanSalesRoute {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'optimizing'
  driverId: string
  vehicleId: string
  customers: VanSalesCustomer[]
  waypoints: RouteWaypoint[]
  estimatedDuration: number
  actualDuration?: number
  distance: number
  fuelCost: number
  tollCost: number
  optimizationScore: number
  trafficConditions: TrafficCondition[]
  weatherConditions: WeatherCondition[]
  deliveryWindows: DeliveryWindow[]
  routeConstraints: RouteConstraint[]
  performance: RoutePerformance
  createdAt: string
  updatedAt: string
}

export interface VanSalesCustomer {
  id: string
  name: string
  address: CustomerAddress
  location: GeoLocation
  contactPerson: string
  phone: string
  email: string
  customerType: 'retail' | 'wholesale' | 'distributor'
  creditLimit: number
  paymentTerms: string
  preferredDeliveryTime: string
  specialInstructions: string
  orderHistory: CustomerOrderHistory[]
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  averageOrderValue: number
  visitFrequency: number
  lastVisitDate: string
  nextScheduledVisit: string
  status: 'active' | 'inactive' | 'suspended'
}

export interface RouteWaypoint {
  id: string
  customerId: string
  sequence: number
  estimatedArrival: string
  actualArrival?: string
  estimatedDeparture: string
  actualDeparture?: string
  travelTime: number
  serviceTime: number
  waitTime: number
  distance: number
  coordinates: GeoLocation
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'rescheduled'
  deliveryNotes: string
  signature?: string
  photos: string[]
}

export interface VanSalesInventory {
  id: string
  vanId: string
  productId: string
  product: VanSalesProduct
  currentStock: number
  reservedStock: number
  availableStock: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  lastRestocked: string
  expiryDate?: string
  batchNumber?: string
  location: string
  temperature?: number
  condition: 'excellent' | 'good' | 'fair' | 'damaged'
  movements: InventoryMovement[]
}

export interface VanSalesProduct {
  id: string
  sku: string
  name: string
  description: string
  category: ProductCategory
  brand: string
  unitPrice: number
  wholesalePrice: number
  retailPrice: number
  costPrice: number
  margin: number
  weight: number
  dimensions: ProductDimensions
  barcode: string
  images: string[]
  specifications: Record<string, any>
  variants: ProductVariant[]
  promotions: ProductPromotion[]
  inventory: ProductInventory
  salesData: ProductSalesData
  status: 'active' | 'inactive' | 'discontinued'
  tags: string[]
  seasonality: SeasonalityData
  competitorPricing: CompetitorPrice[]
}

export interface VanSalesOrder {
  id: string
  orderNumber: string
  customerId: string
  customer: VanSalesCustomer
  routeId: string
  driverId: string
  orderDate: string
  deliveryDate: string
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingCost: number
  totalAmount: number
  paymentMethod: 'cash' | 'card' | 'credit' | 'bank_transfer'
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue'
  paymentTerms: string
  deliveryInstructions: string
  specialRequests: string
  promotionsApplied: AppliedPromotion[]
  loyaltyPointsEarned: number
  loyaltyPointsUsed: number
  signature?: string
  deliveryPhotos: string[]
  feedback: CustomerFeedback
  returns: OrderReturn[]
  invoiceNumber?: string
  receiptNumber?: string
  createdAt: string
  updatedAt: string
}

export interface MobilePOSTransaction {
  id: string
  transactionNumber: string
  orderId: string
  customerId: string
  driverId: string
  vanId: string
  timestamp: string
  items: POSItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paymentMethod: 'cash' | 'card' | 'mobile' | 'credit'
  paymentDetails: PaymentDetails
  receiptData: ReceiptData
  loyaltyTransaction: LoyaltyTransaction
  location: GeoLocation
  deviceInfo: DeviceInfo
  offlineMode: boolean
  syncStatus: 'synced' | 'pending' | 'failed'
  refunds: TransactionRefund[]
  status: 'completed' | 'cancelled' | 'refunded'
}

export interface RouteOptimization {
  id: string
  routeId: string
  optimizationType: 'time' | 'distance' | 'fuel' | 'cost' | 'balanced'
  constraints: OptimizationConstraint[]
  originalRoute: RouteWaypoint[]
  optimizedRoute: RouteWaypoint[]
  improvements: RouteImprovement
  algorithm: 'genetic' | 'ant_colony' | 'simulated_annealing' | 'machine_learning'
  executionTime: number
  confidence: number
  recommendations: string[]
  trafficData: TrafficData
  weatherImpact: WeatherImpact
  fuelSavings: number
  timeSavings: number
  costSavings: number
  environmentalImpact: EnvironmentalImpact
  createdAt: string
}

export interface VanSalesAnalytics {
  routePerformance: RoutePerformanceMetrics
  salesMetrics: SalesMetrics
  inventoryMetrics: InventoryMetrics
  customerMetrics: CustomerMetrics
  driverMetrics: DriverMetrics
  profitabilityMetrics: ProfitabilityMetrics
  operationalMetrics: OperationalMetrics
  forecastingData: ForecastingData
  benchmarkData: BenchmarkData
  insights: AnalyticsInsight[]
  recommendations: AnalyticsRecommendation[]
  alerts: AnalyticsAlert[]
}

// Supporting interfaces
export interface CustomerAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  coordinates: GeoLocation
  deliveryInstructions: string
  accessNotes: string
}

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  heading?: number
  speed?: number
}

export interface TrafficCondition {
  segment: string
  condition: 'light' | 'moderate' | 'heavy' | 'severe'
  delay: number
  alternativeRoute?: string
  timestamp: string
}

export interface WeatherCondition {
  location: GeoLocation
  temperature: number
  humidity: number
  precipitation: number
  windSpeed: number
  visibility: number
  conditions: string
  impact: 'none' | 'low' | 'medium' | 'high'
  timestamp: string
}

export interface DeliveryWindow {
  customerId: string
  startTime: string
  endTime: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  flexibility: number
  penalty: number
}

export interface RouteConstraint {
  type: 'vehicle_capacity' | 'driver_hours' | 'delivery_window' | 'road_restriction'
  value: any
  priority: number
  flexible: boolean
}

export interface RoutePerformance {
  onTimeDeliveries: number
  totalDeliveries: number
  averageDeliveryTime: number
  fuelEfficiency: number
  customerSatisfaction: number
  driverProductivity: number
  costPerDelivery: number
  revenuePerRoute: number
}

export interface ProductCategory {
  id: string
  name: string
  description: string
  parentId?: string
  level: number
  attributes: CategoryAttribute[]
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'in'
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  attributes: Record<string, string>
  price: number
  inventory: number
}

export interface ProductPromotion {
  id: string
  name: string
  type: 'discount' | 'bogo' | 'bundle'
  value: number
  startDate: string
  endDate: string
  conditions: PromotionCondition[]
}

export interface ProductInventory {
  totalStock: number
  availableStock: number
  reservedStock: number
  inTransit: number
  reorderLevel: number
  maxStock: number
}

export interface ProductSalesData {
  totalSold: number
  revenue: number
  averagePrice: number
  salesTrend: number
  topCustomers: string[]
  seasonalPattern: SeasonalPattern[]
}

export interface SeasonalityData {
  pattern: 'seasonal' | 'cyclical' | 'trend' | 'irregular'
  peaks: SeasonalPeak[]
  valleys: SeasonalValley[]
  forecast: SeasonalForecast[]
}

export interface CompetitorPrice {
  competitor: string
  price: number
  date: string
  source: string
}

export interface CustomerOrderHistory {
  orderId: string
  date: string
  amount: number
  items: number
  status: string
}

export interface OrderItem {
  productId: string
  product: VanSalesProduct
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  total: number
  promotions: AppliedPromotion[]
}

export interface AppliedPromotion {
  promotionId: string
  name: string
  type: string
  discount: number
  conditions: string[]
}

export interface CustomerFeedback {
  rating: number
  comment: string
  categories: FeedbackCategory[]
  timestamp: string
}

export interface OrderReturn {
  id: string
  items: ReturnItem[]
  reason: string
  status: 'pending' | 'approved' | 'processed'
  refundAmount: number
  timestamp: string
}

export interface POSItem {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  total: number
}

export interface PaymentDetails {
  method: string
  amount: number
  currency: string
  reference: string
  cardLast4?: string
  authCode?: string
  timestamp: string
}

export interface ReceiptData {
  number: string
  items: POSItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  timestamp: string
  customerInfo: CustomerInfo
  driverInfo: DriverInfo
}

export interface LoyaltyTransaction {
  pointsEarned: number
  pointsUsed: number
  balance: number
  tier: string
  benefits: LoyaltyBenefit[]
}

export interface DeviceInfo {
  deviceId: string
  platform: string
  version: string
  location: GeoLocation
  networkType: string
}

export interface TransactionRefund {
  id: string
  amount: number
  reason: string
  timestamp: string
  status: 'pending' | 'processed'
}

export interface OptimizationConstraint {
  type: string
  value: any
  priority: number
  flexible: boolean
}

export interface RouteImprovement {
  timeSaved: number
  distanceReduced: number
  fuelSaved: number
  costReduced: number
  efficiencyGain: number
}

export interface TrafficData {
  segments: TrafficSegment[]
  averageSpeed: number
  congestionLevel: number
  incidents: TrafficIncident[]
  alternativeRoutes: AlternativeRoute[]
}

export interface WeatherImpact {
  visibility: number
  roadConditions: string
  drivingDifficulty: number
  deliveryDelay: number
  recommendations: string[]
}

export interface EnvironmentalImpact {
  co2Saved: number
  fuelSaved: number
  emissionReduction: number
  sustainabilityScore: number
}

export interface InventoryMovement {
  id: string
  type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  reason: string
  reference: string
  timestamp: string
  userId: string
}

class VanSalesCompleteService {
  // Route Management
  async getRoutes(params?: {
    status?: string
    driverId?: string
    date?: string
    optimized?: boolean
  }): Promise<VanSalesRoute[]> {
    const response = await apiClient.get('/van-sales/routes', { params })
    return response.routes
  }

  async createRoute(route: Omit<VanSalesRoute, 'id' | 'createdAt' | 'updatedAt'>): Promise<VanSalesRoute> {
    return apiClient.post('/van-sales/routes', route)
  }

  async optimizeRoute(routeId: string, options: {
    type: 'time' | 'distance' | 'fuel' | 'cost' | 'balanced'
    constraints?: OptimizationConstraint[]
    realTimeTraffic?: boolean
    weatherConsideration?: boolean
  }): Promise<RouteOptimization> {
    return apiClient.post(`/van-sales/routes/${routeId}/optimize`, options)
  }

  async updateRoute(id: string, updates: Partial<VanSalesRoute>): Promise<VanSalesRoute> {
    return apiClient.put(`/van-sales/routes/${id}`, updates)
  }

  async duplicateRoute(id: string, options: {
    name: string
    date: string
    driverId?: string
  }): Promise<VanSalesRoute> {
    return apiClient.post(`/van-sales/routes/${id}/duplicate`, options)
  }

  // Customer Management
  async getCustomers(params?: {
    routeId?: string
    type?: string
    status?: string
    loyaltyTier?: string
    search?: string
  }): Promise<VanSalesCustomer[]> {
    const response = await apiClient.get('/van-sales/customers', { params })
    return response.customers
  }

  async createCustomer(customer: Omit<VanSalesCustomer, 'id'>): Promise<VanSalesCustomer> {
    return apiClient.post('/van-sales/customers', customer)
  }

  async updateCustomer(id: string, updates: Partial<VanSalesCustomer>): Promise<VanSalesCustomer> {
    return apiClient.put(`/van-sales/customers/${id}`, updates)
  }

  async getCustomerAnalytics(customerId: string, period: string): Promise<any> {
    return apiClient.get(`/van-sales/customers/${customerId}/analytics`, { params: { period } })
  }

  // Inventory Management
  async getVanInventory(vanId: string): Promise<VanSalesInventory[]> {
    const response = await apiClient.get(`/van-sales/vans/${vanId}/inventory`)
    return response.inventory
  }

  async updateInventory(vanId: string, productId: string, updates: {
    quantity?: number
    location?: string
    condition?: string
    notes?: string
  }): Promise<VanSalesInventory> {
    return apiClient.put(`/van-sales/vans/${vanId}/inventory/${productId}`, updates)
  }

  async restockVan(vanId: string, items: any[]): Promise<VanSalesInventory[]> {
    return apiClient.post(`/van-sales/vans/${vanId}/restock`, { items })
  }

  async getInventoryForecast(vanId: string, days: number): Promise<any> {
    return apiClient.get(`/van-sales/vans/${vanId}/inventory/forecast`, { params: { days } })
  }

  // Product Management
  async getProducts(params?: {
    category?: string
    brand?: string
    status?: string
    search?: string
    inStock?: boolean
  }): Promise<VanSalesProduct[]> {
    const response = await apiClient.get('/van-sales/products', { params })
    return response.products
  }

  async createProduct(product: Omit<VanSalesProduct, 'id'>): Promise<VanSalesProduct> {
    return apiClient.post('/van-sales/products', product)
  }

  async updateProduct(id: string, updates: Partial<VanSalesProduct>): Promise<VanSalesProduct> {
    return apiClient.put(`/van-sales/products/${id}`, updates)
  }

  async getProductAnalytics(productId: string, period: string): Promise<any> {
    return apiClient.get(`/van-sales/products/${productId}/analytics`, { params: { period } })
  }

  // Order Management
  async getOrders(params?: {
    customerId?: string
    routeId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<VanSalesOrder[]> {
    const response = await apiClient.get('/van-sales/orders', { params })
    return response.orders
  }

  async createOrder(order: Omit<VanSalesOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<VanSalesOrder> {
    return apiClient.post('/van-sales/orders', order)
  }

  async updateOrder(id: string, updates: Partial<VanSalesOrder>): Promise<VanSalesOrder> {
    return apiClient.put(`/van-sales/orders/${id}`, updates)
  }

  async processOrder(id: string, action: 'confirm' | 'ship' | 'deliver' | 'cancel'): Promise<VanSalesOrder> {
    return apiClient.post(`/van-sales/orders/${id}/process`, { action })
  }

  async generateInvoice(orderId: string): Promise<any> {
    return apiClient.post(`/van-sales/orders/${orderId}/invoice`)
  }

  // Mobile POS
  async processPOSTransaction(transaction: Omit<MobilePOSTransaction, 'id' | 'transactionNumber'>): Promise<MobilePOSTransaction> {
    return apiClient.post('/van-sales/pos/transaction', transaction)
  }

  async processPayment(transactionId: string, paymentData: any): Promise<any> {
    return apiClient.post(`/van-sales/pos/transactions/${transactionId}/payment`, paymentData)
  }

  async generateReceipt(transactionId: string, format: 'pdf' | 'thermal' | 'email'): Promise<any> {
    return apiClient.get(`/van-sales/pos/transactions/${transactionId}/receipt`, { params: { format } })
  }

  async processRefund(transactionId: string, refundData: any): Promise<TransactionRefund> {
    return apiClient.post(`/van-sales/pos/transactions/${transactionId}/refund`, refundData)
  }

  // Analytics & Reporting
  async getVanSalesAnalytics(params: {
    period: string
    vanId?: string
    driverId?: string
    routeId?: string
    metrics?: string[]
  }): Promise<VanSalesAnalytics> {
    return apiClient.get('/van-sales/analytics', { params })
  }

  async getPerformanceReport(params: {
    type: 'route' | 'driver' | 'product' | 'customer'
    period: string
    format: 'json' | 'pdf' | 'excel'
  }): Promise<any> {
    return apiClient.get('/van-sales/reports/performance', { params })
  }

  async getProfitabilityAnalysis(params: {
    period: string
    groupBy: 'route' | 'product' | 'customer' | 'driver'
  }): Promise<any> {
    return apiClient.get('/van-sales/analytics/profitability', { params })
  }

  async getForecast(params: {
    type: 'sales' | 'inventory' | 'demand'
    horizon: number
    granularity: 'daily' | 'weekly' | 'monthly'
  }): Promise<any> {
    return apiClient.get('/van-sales/analytics/forecast', { params })
  }

  // Real-time Tracking
  async trackVan(vanId: string): Promise<any> {
    return apiClient.get(`/van-sales/vans/${vanId}/location`)
  }

  async updateVanLocation(vanId: string, location: GeoLocation): Promise<void> {
    return apiClient.post(`/van-sales/vans/${vanId}/location`, location)
  }

  async getRouteProgress(routeId: string): Promise<any> {
    return apiClient.get(`/van-sales/routes/${routeId}/progress`)
  }

  async getDeliveryUpdates(routeId: string): Promise<any[]> {
    const response = await apiClient.get(`/van-sales/routes/${routeId}/deliveries`)
    return response.updates
  }

  // Offline Support
  async syncOfflineData(data: any): Promise<any> {
    return apiClient.post('/van-sales/sync', data)
  }

  async getOfflineData(vanId: string): Promise<any> {
    return apiClient.get(`/van-sales/vans/${vanId}/offline-data`)
  }

  async queueOfflineTransaction(transaction: any): Promise<void> {
    // Store in local storage for later sync
    const queue = JSON.parse(localStorage.getItem('offline_transactions') || '[]')
    queue.push(transaction)
    localStorage.setItem('offline_transactions', JSON.stringify(queue))
  }

  // Integration APIs
  async syncWithERP(data: any): Promise<any> {
    return apiClient.post('/van-sales/integrations/erp/sync', data)
  }

  async syncWithAccounting(data: any): Promise<any> {
    return apiClient.post('/van-sales/integrations/accounting/sync', data)
  }

  async exportData(params: {
    type: 'orders' | 'inventory' | 'customers' | 'routes'
    format: 'csv' | 'excel' | 'json'
    dateFrom: string
    dateTo: string
  }): Promise<Blob> {
    return apiClient.get('/van-sales/export', { params, responseType: 'blob' })
  }
}

const vanSalesCompleteService = new VanSalesCompleteService()
export default vanSalesCompleteService