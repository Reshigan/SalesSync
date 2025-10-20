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
import RouteManagementPage from './pages/van-sales/RouteManagementPage'
import InventoryTrackingPage from './pages/van-sales/InventoryTrackingPage'

// Trade Marketing Pages
import TradeMarketingPage from './pages/trade-marketing/TradeMarketingPage'

// Events Pages
import EventsPage from './pages/events/EventsPage'

// Campaign Pages
import CampaignsPage from './pages/campaigns/CampaignsPage'

// Field Operations Pages
import FieldAgentsPage from './pages/field-agents/FieldAgentsPage'
import FieldOperationsDashboard from './pages/field-operations/FieldOperationsDashboard'
import LiveMappingPage from './pages/field-agents/LiveMappingPage'
import BoardPlacementPage from './pages/field-agents/BoardPlacementPage'
import ProductDistributionPage from './pages/field-agents/ProductDistributionPage'
import CommissionTrackingPage from './pages/field-agents/CommissionTrackingPage'

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

// Admin Pages
import AdminPage from './pages/admin/AdminPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import SystemSettingsPage from './pages/admin/SystemSettingsPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'

// Components
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
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
            <Route path="van-sales/management" element={<VanSalesPage />} />
            <Route path="van-sales/routes" element={<RouteManagementPage />} />
            <Route path="van-sales/inventory" element={<InventoryTrackingPage />} />

            {/* Field Operations Routes */}
            <Route path="field-operations" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/dashboard" element={<FieldOperationsDashboard />} />
            <Route path="field-operations/agents" element={<FieldAgentsPage />} />
            <Route path="field-operations/mapping" element={<LiveMappingPage />} />
            <Route path="field-operations/boards" element={<BoardPlacementPage />} />
            <Route path="field-operations/products" element={<ProductDistributionPage />} />
            <Route path="field-operations/commission" element={<CommissionTrackingPage />} />

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
      </div>
    </ErrorBoundary>
  )
}

export default App