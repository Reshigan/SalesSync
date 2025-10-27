/**
 * Services Index
 * Central export point for all services
 */

// API Client
export { default as api, apiClient, apiService, ApiService } from './api'
export * from './api.service'

// Core Services
export { productsService } from './products.service'
export { customersService } from './customers.service'
export { ordersService } from './orders.service'
export { authService } from './auth.service'
export { tenantService } from './tenant.service'
export { dashboardService } from './dashboard.service'

// Field Operations
export { visitsService } from './visits.service'
export { fieldOperationsService } from './field-operations.service'
export { gpsService } from './gps.service'
export { gpsTrackingService } from './gps-tracking.service'
export { beatRoutesService } from './beat-routes.service'

// Marketing
export { campaignsService } from './campaigns.service'
export { promotionsService } from './promotions.service'
export { fieldMarketingService } from './field-marketing.service'
export { tradeMarketingService } from './tradeMarketing.service'

// Inventory & Warehouses
export { inventoryService } from './inventory.service'
export { vanSalesService } from './van-sales.service'
export { warehousesService } from './warehouses.service'

// Finance & Commissions
export { financeService } from './finance.service'
export { commissionsService } from './commissions.service'

// Reports & Analytics
export { reportsService } from './reports.service'
export { analyticsService } from './analytics.service'

// Other Modules
export { kycService } from './kyc.service'
export { surveysService } from './surveys.service'
export { transactionService } from './transaction.service'
export { comprehensiveTransactionsService } from './comprehensive-transactions.service'
export { currencySystemService } from './currency-system.service'
export { aiService } from './ai.service'
