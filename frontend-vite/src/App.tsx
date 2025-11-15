import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useEffect } from 'react'

// Layout Components
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'

// Van Sales Pages
import VanSalesPage from './pages/van-sales/VanSalesPage'
import VanSalesDashboard from './pages/van-sales/VanSalesDashboard'
import VanSalesWorkflowPage from './pages/van-sales/VanSalesWorkflowPage'
import RouteManagementPage from './pages/van-sales/RouteManagementPage'
import InventoryTrackingPage from './pages/van-sales/InventoryTrackingPage'

// Trade Marketing Pages
import TradeMarketingPage from './pages/trade-marketing/TradeMarketingPage'
import ActivationWorkflowPage from './pages/trade-marketing/ActivationWorkflowPage'
import CampaignManagementPage from './pages/trade-marketing/CampaignManagementPage'
import MerchandisingCompliancePage from './pages/trade-marketing/MerchandisingCompliancePage'
import PromoterManagementPage from './pages/trade-marketing/PromoterManagementPage'
import TradeMarketingAnalyticsPage from './pages/trade-marketing/TradeMarketingAnalyticsPage'

// Events Pages
import EventsPage from './pages/events/EventsPage'

// Campaign Pages
import CampaignsPage from './pages/campaigns/CampaignsPage'

// Field Operations Pages
import FieldAgentsPage from './pages/field-agents/FieldAgentsPage'
import AgentWorkflowPage from './pages/field-agents/AgentWorkflowPage'
import FieldOperationsDashboard from './pages/field-operations/FieldOperationsDashboard'
import LiveMappingPage from './pages/field-agents/LiveMappingPage'
import BoardPlacementPage from './pages/field-agents/BoardPlacementPage'
import ProductDistributionPage from './pages/field-agents/ProductDistributionPage'
import CommissionTrackingPage from './pages/field-agents/CommissionTrackingPage'

// Field Marketing Pages
import FieldMarketingDashboard from './pages/field-marketing/FieldMarketingDashboard'

import AgentWorkflowPageMobile from './pages/field-agents/AgentWorkflowPageMobile'
import VanSalesWorkflowPageMobile from './pages/van-sales/VanSalesWorkflowPageMobile'
import BoardPlacementFormPage from './pages/field-operations/BoardPlacementFormPage'
import ProductDistributionFormPage from './pages/field-operations/ProductDistributionFormPage'
import CustomerSelection from './pages/field-marketing/CustomerSelection'
import GPSVerification from './pages/field-marketing/GPSVerification'
import BrandSelection from './pages/field-marketing/BrandSelection'
import VisitList from './pages/field-marketing/VisitList'
import BoardPlacement from './pages/field-marketing/BoardPlacement'
import ProductDistribution from './pages/field-marketing/ProductDistribution'
import NewCustomerRegistration from './pages/field-marketing/NewCustomerRegistration'
import VisitSummary from './pages/field-marketing/VisitSummary'
import MyCommissions from './pages/field-marketing/MyCommissions'

// KYC Pages
import KYCDashboard from './pages/kyc/KYCDashboard'
import KYCManagement from './pages/kyc/KYCManagement'
import KYCReports from './pages/kyc/KYCReports'

// Surveys Pages
import SurveysDashboard from './pages/surveys/SurveysDashboard'
import SurveysManagement from './pages/surveys/SurveysManagement'

// Inventory Pages
import InventoryDashboard from './pages/inventory/InventoryDashboard'
import InventoryManagement from './pages/inventory/InventoryManagement'
import InventoryReports from './pages/inventory/InventoryReports'
import StockCountWorkflowPage from './pages/inventory/StockCountWorkflowPage'

// Promotions Pages
import PromotionsDashboard from './pages/promotions/PromotionsDashboard'
import PromotionsManagement from './pages/promotions/PromotionsManagement'

// Business Pages
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage'
import OrdersPage from './pages/orders/OrdersPage'
import OrderDetailsPage from './pages/orders/OrderDetailsPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductDetailsPage from './pages/products/ProductDetailsPage'

// Van Sales Detail Pages
import VanOrderCreatePage from './pages/van-sales/VanOrderCreatePage'
import VanRouteDetailsPage from './pages/van-sales/VanRouteDetailsPage'
import VanSalesOrderCreate from './pages/van-sales/orders/VanSalesOrderCreate'
import VanSalesOrderDetail from './pages/van-sales/orders/VanSalesOrderDetail'
import VanSalesOrderEdit from './pages/van-sales/orders/VanSalesOrderEdit'
import VanSalesReturnCreate from './pages/van-sales/returns/VanSalesReturnCreate'
import VanSalesReturnDetail from './pages/van-sales/returns/VanSalesReturnDetail'
import VanLoadCreate from './pages/van-sales/van-loads/VanLoadCreate'
import VanLoadDetail from './pages/van-sales/van-loads/VanLoadDetail'
import VanCashReconciliationCreate from './pages/van-sales/cash-reconciliation/CashReconciliationCreate'
import VanCashReconciliationDetail from './pages/van-sales/cash-reconciliation/CashReconciliationDetail'

// Inventory Detail Pages
import StockCountDetailsPage from './pages/inventory-management/StockCountDetailsPage'
import AdjustmentCreate from './pages/inventory/adjustments/AdjustmentCreate'
import AdjustmentDetail from './pages/inventory/adjustments/AdjustmentDetail'
import IssueCreate from './pages/inventory/issues/IssueCreate'
import IssueDetail from './pages/inventory/issues/IssueDetail'
import ReceiptCreate from './pages/inventory/receipts/ReceiptCreate'
import ReceiptDetail from './pages/inventory/receipts/ReceiptDetail'
import StockCountCreate from './pages/inventory/stock-counts/StockCountCreate'
import StockCountDetail from './pages/inventory/stock-counts/StockCountDetail'
import TransferCreate from './pages/inventory/transfers/TransferCreate'
import TransferDetail from './pages/inventory/transfers/TransferDetail'

import CreditNoteCreate from './pages/sales/credit-notes/CreditNoteCreate'
import CreditNoteDetail from './pages/sales/credit-notes/CreditNoteDetail'
import InvoiceCreate from './pages/sales/invoices/InvoiceCreate'
import InvoiceDetail from './pages/sales/invoices/InvoiceDetail'
import SalesOrderCreate from './pages/sales/orders/SalesOrderCreate'
import SalesOrderDetail from './pages/sales/orders/SalesOrderDetail'
import SalesOrderEdit from './pages/sales/orders/SalesOrderEdit'
import PaymentCreate from './pages/sales/payments/PaymentCreate'
import PaymentDetail from './pages/sales/payments/PaymentDetail'
import SalesReturnCreate from './pages/sales/returns/SalesReturnCreate'
import SalesReturnDetail from './pages/sales/returns/SalesReturnDetail'

import ActivationCreate from './pages/marketing/activations/ActivationCreate'
import ActivationDetail from './pages/marketing/activations/ActivationDetail'
import CampaignCreate from './pages/marketing/campaigns/CampaignCreate'
import CampaignDetail from './pages/marketing/campaigns/CampaignDetail'
import CampaignEdit from './pages/marketing/campaigns/CampaignEdit'
import EventCreate from './pages/marketing/events/EventCreate'
import EventDetail from './pages/marketing/events/EventDetail'
import EventEdit from './pages/marketing/events/EventEdit'
import PromotionCreate from './pages/marketing/promotions/PromotionCreate'
import PromotionDetail from './pages/marketing/promotions/PromotionDetail'

// Field Operations Detail Pages
import BoardPlacementCreate from './pages/field-operations/board-placements/BoardPlacementCreate'
import BoardPlacementDetail from './pages/field-operations/board-placements/BoardPlacementDetail'
import CommissionLedgerDetail from './pages/field-operations/commission-ledger/CommissionLedgerDetail'
import ProductDistributionCreate from './pages/field-operations/product-distributions/ProductDistributionCreate'
import ProductDistributionDetail from './pages/field-operations/product-distributions/ProductDistributionDetail'
import VisitCreate from './pages/field-operations/visits/VisitCreate'
import VisitDetail from './pages/field-operations/visits/VisitDetail'
import VisitEdit from './pages/field-operations/visits/VisitEdit'

import CRMCustomerCreate from './pages/crm/customers/CustomerCreate'
import CRMCustomerDetail from './pages/crm/customers/CustomerDetail'
import CRMCustomerEdit from './pages/crm/customers/CustomerEdit'
import KYCCaseCreate from './pages/crm/kyc-cases/KYCCaseCreate'
import KYCCaseDetail from './pages/crm/kyc-cases/KYCCaseDetail'
import SurveyCreate from './pages/crm/surveys/SurveyCreate'
import SurveyDetail from './pages/crm/surveys/SurveyDetail'

import CashReconciliationCreate from './pages/finance/cash-reconciliation/CashReconciliationCreate'
import CashReconciliationDetail from './pages/finance/cash-reconciliation/CashReconciliationDetail'
import CommissionPayoutDetail from './pages/finance/commission-payouts/CommissionPayoutDetail'

// Admin Pages
import AdminPage from './pages/admin/AdminPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagementPage from './pages/admin/UserManagementPage'
import RolePermissionsPage from './pages/admin/RolePermissionsPage'
import SystemSettingsPage from './pages/admin/SystemSettingsPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import SmokeTestPage from './pages/admin/SmokeTestPage'
import BrandManagementPage from './pages/admin/BrandManagementPage'
import CampaignManagementPage from './pages/admin/CampaignManagementPage'
import CommissionRuleBuilderPage from './pages/admin/CommissionRuleBuilderPage'
import DataImportExportPage from './pages/admin/DataImportExportPage'
import POSLibraryPage from './pages/admin/POSLibraryPage'
import ProductTypeBuilderPage from './pages/admin/ProductTypeBuilderPage'
import SurveyBuilderPage from './pages/admin/SurveyBuilderPage'
import TerritoryManagementPage from './pages/admin/TerritoryManagementPage'
import BoardManagementPage from './pages/admin/BoardManagementPage'

import { BackupManagementPage } from './pages/admin-settings/BackupManagementPage'
import { IntegrationsPage } from './pages/admin-settings/IntegrationsPage'
import { SystemHealthPage } from './pages/admin-settings/SystemHealthPage'

// Components
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { isAuthenticated, isLoading, initialize, hydrated } = useAuthStore()

  useEffect(() => {
    if (hydrated) {
      initialize()
    }
  }, [hydrated, initialize])

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/*" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthLayout />
          }>
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route index element={<Navigate to="login" replace />} />
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

            {/* Van Sales Routes */}
            <Route path="van-sales" element={<VanSalesDashboard />} />
            <Route path="van-sales/dashboard" element={<VanSalesDashboard />} />
            <Route path="van-sales/workflow" element={<VanSalesWorkflowPageMobile />} />
            <Route path="van-sales/management" element={<VanSalesPage />} />
            <Route path="van-sales/routes" element={<RouteManagementPage />} />
            <Route path="van-sales/routes/:id" element={<VanRouteDetailsPage />} />
            <Route path="van-sales/inventory" element={<InventoryTrackingPage />} />
            <Route path="van-sales/orders/create" element={<VanOrderCreatePage />} />
            <Route path="van-sales/orders/new" element={<VanSalesOrderCreate />} />
            <Route path="van-sales/orders/:id" element={<VanSalesOrderDetail />} />
            <Route path="van-sales/orders/:id/edit" element={<VanSalesOrderEdit />} />
            <Route path="van-sales/returns/create" element={<VanSalesReturnCreate />} />
            <Route path="van-sales/returns/:id" element={<VanSalesReturnDetail />} />
            <Route path="van-sales/van-loads/create" element={<VanLoadCreate />} />
            <Route path="van-sales/van-loads/:id" element={<VanLoadDetail />} />
            <Route path="van-sales/cash-reconciliation/create" element={<VanCashReconciliationCreate />} />
            <Route path="van-sales/cash-reconciliation/:id" element={<VanCashReconciliationDetail />} />

            {/* Field Operations Routes */}
            <Route path="field-operations" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/dashboard" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/agents" element={<FieldAgentsPage />} />
            <Route path="field-operations/mapping" element={<LiveMappingPage />} />
            <Route path="field-operations/boards" element={<BoardPlacementPage />} />
            <Route path="field-operations/boards/create" element={<BoardPlacementFormPage />} />
            <Route path="field-operations/boards/:id" element={<BoardPlacementDetail />} />
            <Route path="field-operations/products" element={<ProductDistributionPage />} />
            <Route path="field-operations/products/create" element={<ProductDistributionFormPage />} />
            <Route path="field-operations/products/:id" element={<ProductDistributionDetail />} />
            <Route path="field-operations/commission" element={<CommissionTrackingPage />} />
            <Route path="field-operations/commission/:id" element={<CommissionLedgerDetail />} />
            <Route path="field-operations/visits/create" element={<VisitCreate />} />
            <Route path="field-operations/visits/:id" element={<VisitDetail />} />
            <Route path="field-operations/visits/:id/edit" element={<VisitEdit />} />

            {/* Field Marketing Routes */}
            <Route path="field-marketing" element={<FieldMarketingDashboard />} />
            <Route path="field-marketing/dashboard" element={<FieldMarketingDashboard />} />
            <Route path="field-marketing/customer-selection" element={<CustomerSelection />} />
            <Route path="field-marketing/gps-verification" element={<GPSVerification />} />
            <Route path="field-marketing/brand-selection" element={<BrandSelection />} />
            <Route path="field-marketing/visit-list" element={<VisitList />} />
            <Route path="field-marketing/board-placement" element={<BoardPlacement />} />
            <Route path="field-marketing/product-distribution" element={<ProductDistribution />} />
            <Route path="field-marketing/new-customer" element={<NewCustomerRegistration />} />
            <Route path="field-marketing/visit-summary" element={<VisitSummary />} />
            <Route path="field-marketing/my-commissions" element={<MyCommissions />} />

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
            <Route path="inventory/stock-count" element={<StockCountWorkflowPage />} />
            <Route path="inventory/stock-count/:id" element={<StockCountDetailsPage />} />
            <Route path="inventory/management" element={<InventoryManagement />} />
            <Route path="inventory/reports" element={<InventoryReports />} />
            <Route path="inventory/adjustments/create" element={<AdjustmentCreate />} />
            <Route path="inventory/adjustments/:id" element={<AdjustmentDetail />} />
            <Route path="inventory/issues/create" element={<IssueCreate />} />
            <Route path="inventory/issues/:id" element={<IssueDetail />} />
            <Route path="inventory/receipts/create" element={<ReceiptCreate />} />
            <Route path="inventory/receipts/:id" element={<ReceiptDetail />} />
            <Route path="inventory/stock-counts/create" element={<StockCountCreate />} />
            <Route path="inventory/stock-counts/:id" element={<StockCountDetail />} />
            <Route path="inventory/transfers/create" element={<TransferCreate />} />
            <Route path="inventory/transfers/:id" element={<TransferDetail />} />

            {/* Promotions Routes */}
            <Route path="promotions" element={<PromotionsDashboard />} />
            <Route path="promotions/dashboard" element={<PromotionsDashboard />} />
            <Route path="promotions/management" element={<PromotionsManagement />} />

            {/* Trade Marketing Routes */}
            <Route path="trade-marketing" element={<TradeMarketingPage />} />
            <Route path="trade-marketing/activation" element={<ActivationWorkflowPage />} />
            <Route path="trade-marketing/campaigns" element={<CampaignManagementPage />} />
            <Route path="trade-marketing/merchandising" element={<MerchandisingCompliancePage />} />
            <Route path="trade-marketing/promoters" element={<PromoterManagementPage />} />
            <Route path="trade-marketing/analytics" element={<TradeMarketingAnalyticsPage />} />

            {/* Events Routes */}
            <Route path="events" element={<EventsPage />} />

            {/* Campaign Routes */}
            <Route path="campaigns" element={<CampaignsPage />} />

            {/* Legacy Field Agent Routes (for backward compatibility) */}
            <Route path="field-agents" element={<FieldAgentsPage />} />
            <Route path="field-agents/workflow" element={<AgentWorkflowPageMobile />} />
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

            {/* Sales Routes */}
            <Route path="sales/orders/create" element={<SalesOrderCreate />} />
            <Route path="sales/orders/:id" element={<SalesOrderDetail />} />
            <Route path="sales/orders/:id/edit" element={<SalesOrderEdit />} />
            <Route path="sales/invoices/create" element={<InvoiceCreate />} />
            <Route path="sales/invoices/:id" element={<InvoiceDetail />} />
            <Route path="sales/payments/create" element={<PaymentCreate />} />
            <Route path="sales/payments/:id" element={<PaymentDetail />} />
            <Route path="sales/credit-notes/create" element={<CreditNoteCreate />} />
            <Route path="sales/credit-notes/:id" element={<CreditNoteDetail />} />
            <Route path="sales/returns/create" element={<SalesReturnCreate />} />
            <Route path="sales/returns/:id" element={<SalesReturnDetail />} />

            {/* Marketing Routes */}
            <Route path="marketing/campaigns/create" element={<CampaignCreate />} />
            <Route path="marketing/campaigns/:id" element={<CampaignDetail />} />
            <Route path="marketing/campaigns/:id/edit" element={<CampaignEdit />} />
            <Route path="marketing/events/create" element={<EventCreate />} />
            <Route path="marketing/events/:id" element={<EventDetail />} />
            <Route path="marketing/events/:id/edit" element={<EventEdit />} />
            <Route path="marketing/activations/create" element={<ActivationCreate />} />
            <Route path="marketing/activations/:id" element={<ActivationDetail />} />
            <Route path="marketing/promotions/create" element={<PromotionCreate />} />
            <Route path="marketing/promotions/:id" element={<PromotionDetail />} />

            {/* CRM Routes */}
            <Route path="crm/customers/create" element={<CRMCustomerCreate />} />
            <Route path="crm/customers/:id" element={<CRMCustomerDetail />} />
            <Route path="crm/customers/:id/edit" element={<CRMCustomerEdit />} />
            <Route path="crm/kyc-cases/create" element={<KYCCaseCreate />} />
            <Route path="crm/kyc-cases/:id" element={<KYCCaseDetail />} />
            <Route path="crm/surveys/create" element={<SurveyCreate />} />
            <Route path="crm/surveys/:id" element={<SurveyDetail />} />

            {/* Finance Routes */}
            <Route path="finance/cash-reconciliation/create" element={<CashReconciliationCreate />} />
            <Route path="finance/cash-reconciliation/:id" element={<CashReconciliationDetail />} />
            <Route path="finance/commission-payouts/:id" element={<CommissionPayoutDetail />} />

            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/roles" element={
              <ProtectedRoute requiredRole="admin">
                <RolePermissionsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <SystemSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/audit" element={
              <ProtectedRoute requiredRole="admin">
                <AuditLogsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/brands" element={
              <ProtectedRoute requiredRole="admin">
                <BrandManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/campaigns" element={
              <ProtectedRoute requiredRole="admin">
                <CampaignManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/commissions" element={
              <ProtectedRoute requiredRole="admin">
                <CommissionRuleBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="admin/data-import-export" element={
              <ProtectedRoute requiredRole="admin">
                <DataImportExportPage />
              </ProtectedRoute>
            } />
            <Route path="admin/pos-library" element={
              <ProtectedRoute requiredRole="admin">
                <POSLibraryPage />
              </ProtectedRoute>
            } />
            <Route path="admin/product-types" element={
              <ProtectedRoute requiredRole="admin">
                <ProductTypeBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="admin/surveys" element={
              <ProtectedRoute requiredRole="admin">
                <SurveyBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="admin/territories" element={
              <ProtectedRoute requiredRole="admin">
                <TerritoryManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/boards" element={
              <ProtectedRoute requiredRole="admin">
                <BoardManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/backup" element={
              <ProtectedRoute requiredRole="admin">
                <BackupManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/integrations" element={
              <ProtectedRoute requiredRole="admin">
                <IntegrationsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/system-health" element={
              <ProtectedRoute requiredRole="admin">
                <SystemHealthPage />
              </ProtectedRoute>
            } />
            <Route path="admin/smoke-test" element={
              <ProtectedRoute requiredRole="admin">
                <SmokeTestPage />
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
      </div>
    </ErrorBoundary>
  )
}

export default App
