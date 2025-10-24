import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useEffect, useState, lazy, Suspense } from 'react'
import { tenantService } from './services/tenant.service'

// Layout Components (keep eager loaded)
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ToastContainer from './components/ui/Toast'

// Lazy Load All Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const MobileLoginPage = lazy(() => import('./pages/auth/MobileLoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'))
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'))
const VanSalesPage = lazy(() => import('./pages/van-sales/VanSalesPage'))
const VanSalesDashboard = lazy(() => import('./pages/van-sales/VanSalesDashboard'))
const RouteManagementPage = lazy(() => import('./pages/van-sales/RouteManagementPage'))
const InventoryTrackingPage = lazy(() => import('./pages/van-sales/InventoryTrackingPage'))
const TradeMarketingPage = lazy(() => import('./pages/trade-marketing/TradeMarketingPage'))
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
const FieldMarketingDashboard = lazy(() => import('./pages/field-marketing/FieldMarketingDashboard'))
const KYCDashboard = lazy(() => import('./pages/kyc/KYCDashboard'))
const KYCManagement = lazy(() => import('./pages/kyc/KYCManagement'))
const KYCReports = lazy(() => import('./pages/kyc/KYCReports'))
const SurveysDashboard = lazy(() => import('./pages/surveys/SurveysDashboard'))
const SurveysManagement = lazy(() => import('./pages/surveys/SurveysManagement'))
const InventoryDashboard = lazy(() => import('./pages/inventory/InventoryDashboard'))
const InventoryManagement = lazy(() => import('./pages/inventory/InventoryManagement'))
const InventoryReports = lazy(() => import('./pages/inventory/InventoryReports'))
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
const InvoiceManagementPage = lazy(() => import('./pages/finance/InvoiceManagementPage'))
const PaymentCollectionPage = lazy(() => import('./pages/finance/PaymentCollectionPage'))
const ExecutiveDashboard = lazy(() => import('./pages/analytics/ExecutiveDashboard'))
const AdvancedAnalyticsDashboard = lazy(() => import('./pages/analytics/AdvancedAnalyticsDashboard'))
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'))

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

            {/* Van Sales Routes */}
            <Route path="van-sales" element={<VanSalesDashboard />} />
            <Route path="van-sales/dashboard" element={<VanSalesDashboard />} />
            <Route path="van-sales/management" element={<VanSalesPage />} />
            <Route path="van-sales/routes" element={<RouteManagementPage />} />
            <Route path="van-sales/inventory" element={<InventoryTrackingPage />} />

            {/* Field Operations Routes */}
            <Route path="field-operations" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/dashboard" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/agents" element={<FieldAgentsPage />} />
            <Route path="field-operations/visits" element={<VisitManagement />} />
            <Route path="field-operations/mapping" element={<LiveMappingPage />} />
            <Route path="field-operations/boards" element={<BoardPlacementPage />} />
            <Route path="field-operations/products" element={<ProductDistributionPage />} />
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
            <Route path="inventory/reports" element={<InventoryReports />} />

            {/* Promotions Routes */}
            <Route path="promotions" element={<PromotionsDashboard />} />
            <Route path="promotions/dashboard" element={<PromotionsDashboard />} />
            <Route path="promotions/management" element={<PromotionsManagement />} />

            {/* Trade Marketing Routes */}
            <Route path="trade-marketing" element={<TradeMarketingPage />} />

            {/* Events Routes */}
            <Route path="events" element={<EventsPage />} />
            
            {/* Brand Activations Routes */}
            <Route path="brand-activations" element={<BrandActivationsPage />} />

            {/* Campaign Routes */}
            <Route path="campaigns" element={<CampaignsPage />} />

            {/* Legacy Field Agent Routes (for backward compatibility) */}
            <Route path="field-agents" element={<FieldAgentsPage />} />
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

            {/* Finance Routes */}
            <Route path="finance/invoices" element={<InvoiceManagementPage />} />
            <Route path="finance/payments" element={<PaymentCollectionPage />} />

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
    </ErrorBoundary>
  )
}

export default App