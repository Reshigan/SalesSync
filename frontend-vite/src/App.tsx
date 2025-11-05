import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useEffect, useState, lazy, Suspense } from 'react'
import { tenantService } from './services/tenant.service'
import { ModuleProvider } from './contexts/ModuleContext'

// Layout Components (keep eager loaded)
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ToastContainer from './components/ui/Toast'

// Lazy Load All Pages
const LoginPage = lazy(() => import('./pages/LoginSimple'))
const MobileLoginPage = lazy(() => import('./pages/auth/MobileLoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'))
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'))
const VanSalesPage = lazy(() => import('./pages/van-sales/VanSalesPage'))
const VanSalesDashboard = lazy(() => import('./pages/van-sales/VanSalesDashboard'))
const VanSalesWorkflowPage = lazy(() => import('./pages/van-sales/VanSalesWorkflowPage'))
const RouteManagementPage = lazy(() => import('./pages/van-sales/RouteManagementPage'))
const InventoryTrackingPage = lazy(() => import('./pages/van-sales/InventoryTrackingPage'))
const TradeMarketingPage = lazy(() => import('./pages/trade-marketing/TradeMarketingPage'))
const ActivationWorkflowPage = lazy(() => import('./pages/trade-marketing/ActivationWorkflowPage'))
const EventsPage = lazy(() => import('./pages/events/EventsPage'))
const BrandActivationsPage = lazy(() => import('./pages/brand-activations/BrandActivationsPage'))
const CampaignsPage = lazy(() => import('./pages/campaigns/CampaignsPage'))
const FieldAgentsPage = lazy(() => import('./pages/field-agents/FieldAgentsPage'))
const FieldOperationsDashboard = lazy(() => import('./pages/field-operations/FieldOperationsDashboard'))
const VisitManagement = lazy(() => import('./pages/field-operations/VisitManagement'))
const LiveMappingPage = lazy(() => import('./pages/field-agents/LiveMappingPage'))
const BoardPlacementPage = lazy(() => import('./pages/field-agents/BoardPlacementPage'))
const ProductDistributionPage = lazy(() => import('./pages/field-agents/ProductDistributionPage'))
const CommissionTrackingPage = lazy(() => import('./pages/field-agents/CommissionTrackingPage'))
const AgentWorkflowPage = lazy(() => import('./pages/field-agents/AgentWorkflowPage'))
const SurveyPage = lazy(() => import('./pages/field-agents/SurveyPage'))
const TaskPage = lazy(() => import('./pages/field-agents/TaskPage'))
const SurveyBuilderPage = lazy(() => import('./pages/admin/SurveyBuilderPage'))
const ProductTypeBuilderPage = lazy(() => import('./pages/admin/ProductTypeBuilderPage'))
const FieldMarketingDashboard = lazy(() => import('./pages/field-marketing/FieldMarketingDashboard'))
const KYCDashboard = lazy(() => import('./pages/kyc/KYCDashboard'))
const KYCManagement = lazy(() => import('./pages/kyc/KYCManagement'))
const KYCReports = lazy(() => import('./pages/kyc/KYCReports'))
const SurveysDashboard = lazy(() => import('./pages/surveys/SurveysDashboard'))
const SurveysManagement = lazy(() => import('./pages/surveys/SurveysManagement'))
const InventoryDashboard = lazy(() => import('./pages/inventory/InventoryDashboard'))
const InventoryManagement = lazy(() => import('./pages/inventory/InventoryManagement'))
const InventoryReports = lazy(() => import('./pages/inventory/InventoryReports'))
const StockCountWorkflowPage = lazy(() => import('./pages/inventory/StockCountWorkflowPage'))
const PromotionsDashboard = lazy(() => import('./pages/promotions/PromotionsDashboard'))
const PromotionsManagement = lazy(() => import('./pages/promotions/PromotionsManagement'))
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'))
const CustomerDetailsPage = lazy(() => import('./pages/customers/CustomerDetailsPage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const OrderDetailsPage = lazy(() => import('./pages/orders/OrderDetailsPage'))
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'))
const ProductDetailsPage = lazy(() => import('./pages/products/ProductDetailsPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage'))
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'))
const RolePermissionsPage = lazy(() => import('./pages/admin/RolePermissionsPage'))
const DataImportExportPage = lazy(() => import('./pages/admin/DataImportExportPage'))
const BoardManagementPage = lazy(() => import('./pages/admin/BoardManagementPage'))
const InvoiceManagementPage = lazy(() => import('./pages/finance/InvoiceManagementPage'))
const PaymentCollectionPage = lazy(() => import('./pages/finance/PaymentCollectionPage'))
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'))
const SalesDashboard = lazy(() => import('./pages/sales/SalesDashboard'))
const CustomerDashboard = lazy(() => import('./pages/customers/CustomerDashboard'))
const OrderDashboard = lazy(() => import('./pages/orders/OrderDashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ExecutiveDashboard = lazy(() => import('./pages/analytics/ExecutiveDashboard'))
const AdvancedAnalyticsDashboard = lazy(() => import('./pages/analytics/AdvancedAnalyticsDashboard'))
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'))

const VanSalesOrdersList = lazy(() => import('./pages/van-sales/orders/VanSalesOrdersList'))
const VanSalesOrderCreate = lazy(() => import('./pages/van-sales/orders/VanSalesOrderCreate'))
const VanSalesOrderEdit = lazy(() => import('./pages/van-sales/orders/VanSalesOrderEdit'))
const VanSalesOrderDetail = lazy(() => import('./pages/van-sales/orders/VanSalesOrderDetail'))
const VanSalesReturnsList = lazy(() => import('./pages/van-sales/returns/VanSalesReturnsList'))
const VanSalesReturnCreate = lazy(() => import('./pages/van-sales/returns/VanSalesReturnCreate'))
const VanSalesReturnDetail = lazy(() => import('./pages/van-sales/returns/VanSalesReturnDetail'))
const VanLoadsList = lazy(() => import('./pages/van-sales/van-loads/VanLoadsList'))
const VanLoadCreate = lazy(() => import('./pages/van-sales/van-loads/VanLoadCreate'))
const VanLoadDetail = lazy(() => import('./pages/van-sales/van-loads/VanLoadDetail'))
const VanCashReconciliationList = lazy(() => import('./pages/van-sales/cash-reconciliation/CashReconciliationList'))
const VanCashReconciliationCreate = lazy(() => import('./pages/van-sales/cash-reconciliation/CashReconciliationCreate'))
const VanCashReconciliationDetail = lazy(() => import('./pages/van-sales/cash-reconciliation/CashReconciliationDetail'))

const VisitsList = lazy(() => import('./pages/field-operations/visits/VisitsList'))
const VisitCreate = lazy(() => import('./pages/field-operations/visits/VisitCreate'))
const VisitEdit = lazy(() => import('./pages/field-operations/visits/VisitEdit'))
const VisitDetail = lazy(() => import('./pages/field-operations/visits/VisitDetail'))
const BoardPlacementsList = lazy(() => import('./pages/field-operations/board-placements/BoardPlacementsList'))
const BoardPlacementCreate = lazy(() => import('./pages/field-operations/board-placements/BoardPlacementCreate'))
const BoardPlacementDetail = lazy(() => import('./pages/field-operations/board-placements/BoardPlacementDetail'))
const ProductDistributionsList = lazy(() => import('./pages/field-operations/product-distributions/ProductDistributionsList'))
const ProductDistributionCreate = lazy(() => import('./pages/field-operations/product-distributions/ProductDistributionCreate'))
const ProductDistributionDetail = lazy(() => import('./pages/field-operations/product-distributions/ProductDistributionDetail'))
const CommissionLedgerList = lazy(() => import('./pages/field-operations/commission-ledger/CommissionLedgerList'))
const CommissionLedgerDetail = lazy(() => import('./pages/field-operations/commission-ledger/CommissionLedgerDetail'))

const ReceiptsList = lazy(() => import('./pages/inventory/receipts/ReceiptsList'))
const ReceiptCreate = lazy(() => import('./pages/inventory/receipts/ReceiptCreate'))
const ReceiptDetail = lazy(() => import('./pages/inventory/receipts/ReceiptDetail'))
const IssuesList = lazy(() => import('./pages/inventory/issues/IssuesList'))
const IssueCreate = lazy(() => import('./pages/inventory/issues/IssueCreate'))
const IssueDetail = lazy(() => import('./pages/inventory/issues/IssueDetail'))
const TransfersList = lazy(() => import('./pages/inventory/transfers/TransfersList'))
const TransferCreate = lazy(() => import('./pages/inventory/transfers/TransferCreate'))
const TransferDetail = lazy(() => import('./pages/inventory/transfers/TransferDetail'))
const AdjustmentsList = lazy(() => import('./pages/inventory/adjustments/AdjustmentsList'))
const AdjustmentCreate = lazy(() => import('./pages/inventory/adjustments/AdjustmentCreate'))
const AdjustmentDetail = lazy(() => import('./pages/inventory/adjustments/AdjustmentDetail'))
const StockCountsList = lazy(() => import('./pages/inventory/stock-counts/StockCountsList'))
const StockCountCreate = lazy(() => import('./pages/inventory/stock-counts/StockCountCreate'))
const StockCountDetail = lazy(() => import('./pages/inventory/stock-counts/StockCountDetail'))

const SalesOrdersList = lazy(() => import('./pages/sales/orders/SalesOrdersList'))
const SalesOrderCreate = lazy(() => import('./pages/sales/orders/SalesOrderCreate'))
const SalesOrderEdit = lazy(() => import('./pages/sales/orders/SalesOrderEdit'))
const SalesOrderDetail = lazy(() => import('./pages/sales/orders/SalesOrderDetail'))
const InvoicesList = lazy(() => import('./pages/sales/invoices/InvoicesList'))
const InvoiceCreate = lazy(() => import('./pages/sales/invoices/InvoiceCreate'))
const InvoiceDetail = lazy(() => import('./pages/sales/invoices/InvoiceDetail'))
const PaymentsList = lazy(() => import('./pages/sales/payments/PaymentsList'))
const PaymentCreate = lazy(() => import('./pages/sales/payments/PaymentCreate'))
const PaymentDetail = lazy(() => import('./pages/sales/payments/PaymentDetail'))
const CreditNotesList = lazy(() => import('./pages/sales/credit-notes/CreditNotesList'))
const CreditNoteCreate = lazy(() => import('./pages/sales/credit-notes/CreditNoteCreate'))
const CreditNoteDetail = lazy(() => import('./pages/sales/credit-notes/CreditNoteDetail'))
const SalesReturnsList = lazy(() => import('./pages/sales/returns/SalesReturnsList'))
const SalesReturnCreate = lazy(() => import('./pages/sales/returns/SalesReturnCreate'))
const SalesReturnDetail = lazy(() => import('./pages/sales/returns/SalesReturnDetail'))

const CampaignsList = lazy(() => import('./pages/marketing/campaigns/CampaignsList'))
const CampaignCreate = lazy(() => import('./pages/marketing/campaigns/CampaignCreate'))
const CampaignEdit = lazy(() => import('./pages/marketing/campaigns/CampaignEdit'))
const CampaignDetail = lazy(() => import('./pages/marketing/campaigns/CampaignDetail'))
const EventsList = lazy(() => import('./pages/marketing/events/EventsList'))
const EventCreate = lazy(() => import('./pages/marketing/events/EventCreate'))
const EventEdit = lazy(() => import('./pages/marketing/events/EventEdit'))
const EventDetail = lazy(() => import('./pages/marketing/events/EventDetail'))
const PromotionsList = lazy(() => import('./pages/marketing/promotions/PromotionsList'))
const PromotionCreate = lazy(() => import('./pages/marketing/promotions/PromotionCreate'))
const PromotionDetail = lazy(() => import('./pages/marketing/promotions/PromotionDetail'))
const ActivationsList = lazy(() => import('./pages/marketing/activations/ActivationsList'))
const ActivationCreate = lazy(() => import('./pages/marketing/activations/ActivationCreate'))
const ActivationDetail = lazy(() => import('./pages/marketing/activations/ActivationDetail'))

const CustomersList = lazy(() => import('./pages/crm/customers/CustomersList'))
const CustomerCreate = lazy(() => import('./pages/crm/customers/CustomerCreate'))
const CustomerEdit = lazy(() => import('./pages/crm/customers/CustomerEdit'))
const CustomerDetail = lazy(() => import('./pages/crm/customers/CustomerDetail'))
const KYCCasesList = lazy(() => import('./pages/crm/kyc-cases/KYCCasesList'))
const KYCCaseCreate = lazy(() => import('./pages/crm/kyc-cases/KYCCaseCreate'))
const KYCCaseDetail = lazy(() => import('./pages/crm/kyc-cases/KYCCaseDetail'))
const SurveysList = lazy(() => import('./pages/crm/surveys/SurveysList'))
const SurveyCreate = lazy(() => import('./pages/crm/surveys/SurveyCreate'))
const SurveyDetail = lazy(() => import('./pages/crm/surveys/SurveyDetail'))

const CommissionPayoutsList = lazy(() => import('./pages/finance/commission-payouts/CommissionPayoutsList'))
const CommissionPayoutDetail = lazy(() => import('./pages/finance/commission-payouts/CommissionPayoutDetail'))
const CashReconciliationList = lazy(() => import('./pages/finance/cash-reconciliation/CashReconciliationList'))
const CashReconciliationCreate = lazy(() => import('./pages/finance/cash-reconciliation/CashReconciliationCreate'))
const CashReconciliationDetail = lazy(() => import('./pages/finance/cash-reconciliation/CashReconciliationDetail'))

const SalesSummaryReport = lazy(() => import('./pages/reports/sales/SalesSummaryReport'))
const SalesExceptionsReport = lazy(() => import('./pages/reports/sales/SalesExceptionsReport'))
const FieldOperationsProductivityReport = lazy(() => import('./pages/reports/operations/FieldOperationsProductivityReport'))
const InventorySnapshotReport = lazy(() => import('./pages/reports/inventory/InventorySnapshotReport'))
const CommissionSummaryReport = lazy(() => import('./pages/reports/finance/CommissionSummaryReport'))

// Enterprise Modules 2-15
const OrderManagement = lazy(() => import('./pages/OrderManagement'))
const InventoryManagementEnhanced = lazy(() => import('./pages/InventoryManagement'))
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'))
const WarehouseManagement = lazy(() => import('./pages/WarehouseManagement'))
const VanSalesManagement = lazy(() => import('./pages/VanSalesManagement'))
const FieldOperationsDashboardEnhanced = lazy(() => import('./pages/FieldOperationsDashboard'))
const CRMDashboard = lazy(() => import('./pages/CRMDashboard'))
const MarketingCampaigns = lazy(() => import('./pages/MarketingCampaigns'))
const MerchandisingDashboard = lazy(() => import('./pages/MerchandisingDashboard'))
const DataCollectionDashboard = lazy(() => import('./pages/DataCollectionDashboard'))
const ProcurementDashboard = lazy(() => import('./pages/ProcurementDashboard'))
const HRDashboard = lazy(() => import('./pages/HRDashboard'))
const CommissionsDashboard = lazy(() => import('./pages/CommissionsDashboard'))
const TerritoryManagement = lazy(() => import('./pages/TerritoryManagement'))
const WorkflowsDashboard = lazy(() => import('./pages/WorkflowsDashboard'))
const UserProfile = lazy(() => import('./pages/UserProfile'))

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const [tenantLoading, setTenantLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize tenant service first
        await tenantService.initialize()
        setTenantLoading(false)
        
        // Then initialize auth
        await initialize()
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setTenantLoading(false)
      }
    }

    initializeApp()
  }, [initialize])

  if (isLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ModuleProvider>
        <div className="min-h-screen bg-gray-50">
          <ToastContainer />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Routes>
          {/* Public Routes */}
          <Route path="/auth/*" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthLayout />
          }>
            <Route path="login" element={<LoginPage />} />
            <Route path="mobile-login" element={<MobileLoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route index element={<Navigate to="login" replace />} />
          </Route>

          {/* Agent Routes (No Layout) */}
          <Route path="/agent/*" element={<Routes />}>
            <Route path="dashboard" element={<AgentDashboard />} />
          </Route>

          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Dashboard Routes */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Van Sales Routes - Flat structure */}
            <Route path="van-sales" element={<VanSalesDashboard />} />
            <Route path="van-sales/dashboard" element={<VanSalesDashboard />} />
            <Route path="van-sales/management" element={<VanSalesPage />} />
            <Route path="van-sales/workflow" element={<VanSalesWorkflowPage />} />
            <Route path="van-sales/routes" element={<RouteManagementPage />} />
            <Route path="van-sales/inventory" element={<InventoryTrackingPage />} />
            <Route path="van-sales/orders" element={<VanSalesOrdersList />} />
            <Route path="van-sales/orders/create" element={<VanSalesOrderCreate />} />
            <Route path="van-sales/orders/:id/edit" element={<VanSalesOrderEdit />} />
            <Route path="van-sales/orders/:id" element={<VanSalesOrderDetail />} />
            <Route path="van-sales/returns" element={<VanSalesReturnsList />} />
            <Route path="van-sales/returns/create" element={<VanSalesReturnCreate />} />
            <Route path="van-sales/returns/:id" element={<VanSalesReturnDetail />} />
            <Route path="van-sales/van-loads" element={<VanLoadsList />} />
            <Route path="van-sales/van-loads/create" element={<VanLoadCreate />} />
            <Route path="van-sales/van-loads/:id" element={<VanLoadDetail />} />
            <Route path="van-sales/cash-reconciliation" element={<VanCashReconciliationList />} />
            <Route path="van-sales/cash-reconciliation/create" element={<VanCashReconciliationCreate />} />
            <Route path="van-sales/cash-reconciliation/:id" element={<VanCashReconciliationDetail />} />

            {/* Field Operations Routes */}
            <Route path="field-operations" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/dashboard" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/agents" element={<FieldAgentsPage />} />
            <Route path="field-operations/visits" element={<VisitsList />} />
            <Route path="field-operations/visits/create" element={<VisitCreate />} />
            <Route path="field-operations/visits/:id/edit" element={<VisitEdit />} />
            <Route path="field-operations/visits/:id" element={<VisitDetail />} />
            <Route path="field-operations/mapping" element={<LiveMappingPage />} />
            <Route path="field-operations/board-placements" element={<BoardPlacementsList />} />
            <Route path="field-operations/board-placements/create" element={<BoardPlacementCreate />} />
            <Route path="field-operations/board-placements/:id" element={<BoardPlacementDetail />} />
            <Route path="field-operations/boards" element={<BoardPlacementPage />} />
            <Route path="field-operations/product-distributions" element={<ProductDistributionsList />} />
            <Route path="field-operations/product-distributions/create" element={<ProductDistributionCreate />} />
            <Route path="field-operations/product-distributions/:id" element={<ProductDistributionDetail />} />
            <Route path="field-operations/products" element={<ProductDistributionPage />} />
            <Route path="field-operations/commission-ledger" element={<CommissionLedgerList />} />
            <Route path="field-operations/commission-ledger/:id" element={<CommissionLedgerDetail />} />
            <Route path="field-operations/commission" element={<CommissionTrackingPage />} />

            {/* Field Marketing Routes */}
            <Route path="field-marketing" element={<FieldMarketingDashboard />} />
            <Route path="field-marketing/dashboard" element={<FieldMarketingDashboard />} />

            {/* KYC Routes */}
            <Route path="kyc" element={<KYCDashboard />} />
            <Route path="kyc/dashboard" element={<KYCDashboard />} />
            <Route path="kyc/management" element={<KYCManagement />} />
            <Route path="kyc/reports" element={<KYCReports />} />

            {/* Surveys Routes */}
            <Route path="surveys" element={<SurveysDashboard />} />
            <Route path="surveys/dashboard" element={<SurveysDashboard />} />
            <Route path="surveys/management" element={<SurveysManagement />} />

            {/* Inventory Routes */}
            <Route path="inventory" element={<InventoryDashboard />} />
            <Route path="inventory/dashboard" element={<InventoryDashboard />} />
            <Route path="inventory/management" element={<InventoryManagement />} />
            <Route path="inventory/receipts" element={<ReceiptsList />} />
            <Route path="inventory/receipts/create" element={<ReceiptCreate />} />
            <Route path="inventory/receipts/:id" element={<ReceiptDetail />} />
            <Route path="inventory/issues" element={<IssuesList />} />
            <Route path="inventory/issues/create" element={<IssueCreate />} />
            <Route path="inventory/issues/:id" element={<IssueDetail />} />
            <Route path="inventory/transfers" element={<TransfersList />} />
            <Route path="inventory/transfers/create" element={<TransferCreate />} />
            <Route path="inventory/transfers/:id" element={<TransferDetail />} />
            <Route path="inventory/adjustments" element={<AdjustmentsList />} />
            <Route path="inventory/adjustments/create" element={<AdjustmentCreate />} />
            <Route path="inventory/adjustments/:id" element={<AdjustmentDetail />} />
            <Route path="inventory/stock-counts" element={<StockCountsList />} />
            <Route path="inventory/stock-counts/create" element={<StockCountCreate />} />
            <Route path="inventory/stock-counts/:id" element={<StockCountDetail />} />
            <Route path="inventory/stock-count" element={<StockCountWorkflowPage />} />
            <Route path="inventory/reports" element={<InventoryReports />} />

            {/* Promotions Routes */}
            <Route path="promotions" element={<PromotionsDashboard />} />
            <Route path="promotions/dashboard" element={<PromotionsDashboard />} />
            <Route path="promotions/management" element={<PromotionsManagement />} />

            {/* Trade Marketing Routes */}
            <Route path="trade-marketing" element={<TradeMarketingPage />} />
            <Route path="trade-marketing/activation" element={<ActivationWorkflowPage />} />

            {/* Events Routes */}
            <Route path="events" element={<EventsPage />} />
            
            {/* Brand Activations Routes */}
            <Route path="brand-activations" element={<BrandActivationsPage />} />

            {/* Marketing Routes */}
            <Route path="marketing/campaigns" element={<CampaignsList />} />
            <Route path="marketing/campaigns/create" element={<CampaignCreate />} />
            <Route path="marketing/campaigns/:id/edit" element={<CampaignEdit />} />
            <Route path="marketing/campaigns/:id" element={<CampaignDetail />} />
            <Route path="marketing/events" element={<EventsList />} />
            <Route path="marketing/events/create" element={<EventCreate />} />
            <Route path="marketing/events/:id/edit" element={<EventEdit />} />
            <Route path="marketing/events/:id" element={<EventDetail />} />
            <Route path="marketing/promotions" element={<PromotionsList />} />
            <Route path="marketing/promotions/create" element={<PromotionCreate />} />
            <Route path="marketing/promotions/:id" element={<PromotionDetail />} />
            <Route path="marketing/activations" element={<ActivationsList />} />
            <Route path="marketing/activations/create" element={<ActivationCreate />} />
            <Route path="marketing/activations/:id" element={<ActivationDetail />} />
            
            {/* Campaign Routes */}
            <Route path="campaigns" element={<CampaignsPage />} />

            {/* Legacy Field Agent Routes (for backward compatibility) */}
            <Route path="field-agents" element={<FieldAgentsPage />} />
            <Route path="field-agents/workflow" element={<AgentWorkflowPage />} />
            <Route path="field-agents/task/:taskId" element={<TaskPage />} />
            <Route path="field-agents/survey/:instanceId" element={<SurveyPage />} />
            <Route path="field-agents/mapping" element={<LiveMappingPage />} />
            <Route path="field-agents/boards" element={<BoardPlacementPage />} />
            <Route path="field-agents/products" element={<ProductDistributionPage />} />
            <Route path="field-agents/commission" element={<CommissionTrackingPage />} />

            {/* Business Routes */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailsPage />} />

            {/* CRM Routes */}
            <Route path="crm/customers" element={<CustomersList />} />
            <Route path="crm/customers/create" element={<CustomerCreate />} />
            <Route path="crm/customers/:id/edit" element={<CustomerEdit />} />
            <Route path="crm/customers/:id" element={<CustomerDetail />} />
            <Route path="crm/kyc-cases" element={<KYCCasesList />} />
            <Route path="crm/kyc-cases/create" element={<KYCCaseCreate />} />
            <Route path="crm/kyc-cases/:id" element={<KYCCaseDetail />} />
            <Route path="crm/surveys" element={<SurveysList />} />
            <Route path="crm/surveys/create" element={<SurveyCreate />} />
            <Route path="crm/surveys/:id" element={<SurveyDetail />} />

            {/* Finance Routes */}
            <Route path="finance/dashboard" element={<FinanceDashboard />} />
            <Route path="finance/invoices" element={<InvoiceManagementPage />} />
            <Route path="finance/payments" element={<PaymentCollectionPage />} />
            <Route path="finance/commission-payouts" element={<CommissionPayoutsList />} />
            <Route path="finance/commission-payouts/:id" element={<CommissionPayoutDetail />} />
            <Route path="finance/cash-reconciliation" element={<CashReconciliationList />} />
            <Route path="finance/cash-reconciliation/create" element={<CashReconciliationCreate />} />
            <Route path="finance/cash-reconciliation/:id" element={<CashReconciliationDetail />} />
            
            {/* Report Routes */}
            <Route path="reports/sales/summary" element={<SalesSummaryReport />} />
            <Route path="reports/sales/exceptions" element={<SalesExceptionsReport />} />
            <Route path="reports/operations/productivity" element={<FieldOperationsProductivityReport />} />
            <Route path="reports/inventory/snapshot" element={<InventorySnapshotReport />} />
            <Route path="reports/finance/commission-summary" element={<CommissionSummaryReport />} />

            {/* Enterprise Module Routes */}
            <Route path="orders-management" element={<OrderManagement />} />
            <Route path="inventory-enhanced" element={<InventoryManagementEnhanced />} />
            <Route path="finance-enhanced" element={<FinancialDashboard />} />
            <Route path="warehouse" element={<WarehouseManagement />} />
            <Route path="van-sales-enhanced" element={<VanSalesManagement />} />
            <Route path="field-ops-enhanced" element={<FieldOperationsDashboardEnhanced />} />
            <Route path="crm" element={<CRMDashboard />} />
            <Route path="marketing" element={<MarketingCampaigns />} />
            <Route path="merchandising" element={<MerchandisingDashboard />} />
            <Route path="data-collection" element={<DataCollectionDashboard />} />
            <Route path="procurement" element={<ProcurementDashboard />} />
            <Route path="hr" element={<HRDashboard />} />
            <Route path="commissions" element={<CommissionsDashboard />} />
            <Route path="territories" element={<TerritoryManagement />} />
            <Route path="workflows" element={<WorkflowsDashboard />} />
            <Route path="profile" element={<UserProfile />} />

            {/* Sales Routes */}
            <Route path="sales/dashboard" element={<SalesDashboard />} />
            <Route path="sales/orders" element={<SalesOrdersList />} />
            <Route path="sales/orders/create" element={<SalesOrderCreate />} />
            <Route path="sales/orders/:id/edit" element={<SalesOrderEdit />} />
            <Route path="sales/orders/:id" element={<SalesOrderDetail />} />
            <Route path="sales/invoices" element={<InvoicesList />} />
            <Route path="sales/invoices/create" element={<InvoiceCreate />} />
            <Route path="sales/invoices/:id" element={<InvoiceDetail />} />
            <Route path="sales/payments" element={<PaymentsList />} />
            <Route path="sales/payments/create" element={<PaymentCreate />} />
            <Route path="sales/payments/:id" element={<PaymentDetail />} />
            <Route path="sales/credit-notes" element={<CreditNotesList />} />
            <Route path="sales/credit-notes/create" element={<CreditNoteCreate />} />
            <Route path="sales/credit-notes/:id" element={<CreditNoteDetail />} />
            <Route path="sales/returns" element={<SalesReturnsList />} />
            <Route path="sales/returns/create" element={<SalesReturnCreate />} />
            <Route path="sales/returns/:id" element={<SalesReturnDetail />} />
            
            {/* Customer Dashboard */}
            <Route path="customers/dashboard" element={<CustomerDashboard />} />
            
            {/* Order Dashboard */}
            <Route path="orders/dashboard" element={<OrderDashboard />} />
            
            {/* Admin Dashboard */}
            <Route path="admin/dashboard" element={<AdminDashboard />} />

            {/* Analytics Routes */}
            <Route path="analytics/executive" element={<ExecutiveDashboard />} />
            <Route path="analytics/advanced" element={<AdvancedAnalyticsDashboard />} />

            {/* SuperAdmin Routes */}
            <Route path="superadmin/tenants" element={
              <ProtectedRoute requiredRole="superadmin">
                <TenantManagement />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <SystemSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/roles" element={
              <ProtectedRoute requiredRole="admin">
                <RolePermissionsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/import-export" element={
              <ProtectedRoute requiredRole="admin">
                <DataImportExportPage />
              </ProtectedRoute>
            } />
            <Route path="admin/audit" element={
              <ProtectedRoute requiredRole="admin">
                <AuditLogsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/boards" element={
              <ProtectedRoute requiredRole="admin">
                <BoardManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/surveys" element={
              <ProtectedRoute requiredRole="admin">
                <SurveyBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="admin/surveys/:id" element={
              <ProtectedRoute requiredRole="admin">
                <SurveyBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="admin/product-types" element={
              <ProtectedRoute requiredRole="admin">
                <ProductTypeBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="admin/product-types/:id" element={
              <ProtectedRoute requiredRole="admin">
                <ProductTypeBuilderPage />
              </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/auth/login" replace />
          } />
          </Routes>
          </Suspense>
        </div>
      </ModuleProvider>
    </ErrorBoundary>
  )
}

export default App
