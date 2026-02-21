import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'

import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingSpinner size="lg" />
  </div>
)

import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'))
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard'))
const OrdersAnalytics = lazy(() => import('./pages/analytics/OrdersAnalytics'))
const FieldOpsAnalytics = lazy(() => import('./pages/analytics/FieldOpsAnalytics'))
const CommissionsAnalytics = lazy(() => import('./pages/analytics/CommissionsAnalytics'))
const VanSalesPage = lazy(() => import('./pages/van-sales/VanSalesPage'))
const VanSalesDashboard = lazy(() => import('./pages/van-sales/VanSalesDashboard'))
const VanSalesWorkflowPage = lazy(() => import('./pages/van-sales/VanSalesWorkflowPage'))
const RouteManagementPage = lazy(() => import('./pages/van-sales/RouteManagementPage'))
const InventoryTrackingPage = lazy(() => import('./pages/van-sales/InventoryTrackingPage'))
const TradeMarketingPage = lazy(() => import('./pages/trade-marketing/TradeMarketingPage'))
const ActivationWorkflowPage = lazy(() => import('./pages/trade-marketing/ActivationWorkflowPage'))
const CampaignManagementPage = lazy(() => import('./pages/trade-marketing/CampaignManagementPage'))
const MerchandisingCompliancePage = lazy(() => import('./pages/trade-marketing/MerchandisingCompliancePage'))
const PromoterManagementPage = lazy(() => import('./pages/trade-marketing/PromoterManagementPage'))
const TradeMarketingAnalyticsPage = lazy(() => import('./pages/trade-marketing/TradeMarketingAnalyticsPage'))
const EventsPage = lazy(() => import('./pages/events/EventsPage'))
const CampaignsPage = lazy(() => import('./pages/campaigns/CampaignsPage'))
const FieldAgentsPage = lazy(() => import('./pages/field-agents/FieldAgentsPage'))
const AgentWorkflowPage = lazy(() => import('./pages/field-agents/AgentWorkflowPage'))
const FieldOperationsDashboard = lazy(() => import('./pages/field-operations/FieldOperationsDashboard'))
const LiveMappingPage = lazy(() => import('./pages/field-agents/LiveMappingPage'))
const BoardPlacementPage = lazy(() => import('./pages/field-agents/BoardPlacementPage'))
const ProductDistributionPage = lazy(() => import('./pages/field-agents/ProductDistributionPage'))
const CommissionTrackingPage = lazy(() => import('./pages/field-agents/CommissionTrackingPage'))
const AgentCommissionDashboard = lazy(() => import('./pages/field-agents/AgentCommissionDashboard'))
const FieldMarketingDashboard = lazy(() => import('./pages/field-marketing/FieldMarketingDashboard'))
const AgentWorkflowPageMobile = lazy(() => import('./pages/field-agents/AgentWorkflowPageMobile'))
const VanSalesWorkflowPageMobile = lazy(() => import('./pages/van-sales/VanSalesWorkflowPageMobile'))
const BoardPlacementFormPage = lazy(() => import('./pages/field-operations/BoardPlacementFormPage'))
const ProductDistributionFormPage = lazy(() => import('./pages/field-operations/ProductDistributionFormPage'))
const CustomerSelection = lazy(() => import('./pages/field-marketing/CustomerSelection'))
const GPSVerification = lazy(() => import('./pages/field-marketing/GPSVerification'))
const BrandSelection = lazy(() => import('./pages/field-marketing/BrandSelection'))
const VisitList = lazy(() => import('./pages/field-marketing/VisitList'))
const BoardPlacement = lazy(() => import('./pages/field-marketing/BoardPlacement'))
const ProductDistribution = lazy(() => import('./pages/field-marketing/ProductDistribution'))
const NewCustomerRegistration = lazy(() => import('./pages/field-marketing/NewCustomerRegistration'))
const VisitSummary = lazy(() => import('./pages/field-marketing/VisitSummary'))
const MyCommissions = lazy(() => import('./pages/field-marketing/MyCommissions'))
const MyTargets = lazy(() => import('./pages/field-marketing/MyTargets'))
const KYCDashboard = lazy(() => import('./pages/kyc/KYCDashboard'))
const KYCManagement = lazy(() => import('./pages/kyc/KYCManagement'))
const KYCReports = lazy(() => import('./pages/kyc/KYCReports'))
const SurveysDashboard = lazy(() => import('./pages/surveys/SurveysDashboard'))
const SurveysManagement = lazy(() => import('./pages/surveys/SurveysManagement'))
const SurveyCreate = lazy(() => import('./pages/surveys/SurveyCreate'))
const SurveyEdit = lazy(() => import('./pages/surveys/SurveyEdit'))
const InventoryDashboard = lazy(() => import('./pages/inventory/InventoryDashboard'))
const InventoryManagement = lazy(() => import('./pages/inventory/InventoryManagement'))
const InventoryReports = lazy(() => import('./pages/inventory/InventoryReports'))
const StockCountWorkflowPage = lazy(() => import('./pages/inventory/StockCountWorkflowPage'))
const PromotionsDashboard = lazy(() => import('./pages/promotions/PromotionsDashboard'))
const PromotionsManagement = lazy(() => import('./pages/promotions/PromotionsManagement'))
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'))
const CustomerDetailsPage = lazy(() => import('./pages/customers/CustomerDetailsPage'))
const CustomerEditPage = lazy(() => import('./pages/customers/CustomerEditPage'))
const CustomerCreatePage = lazy(() => import('./pages/customers/CustomerCreatePage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const OrderDetailsPage = lazy(() => import('./pages/orders/OrderDetailsPage'))
const OrderEditPage = lazy(() => import('./pages/orders/OrderEditPage'))
const OrderCreatePage = lazy(() => import('./pages/orders/OrderCreatePage'))
const OrderPipelinePage = lazy(() => import('./pages/orders/OrderPipelinePage'))
const WorkflowDashboardPage = lazy(() => import('./pages/orders/WorkflowDashboardPage'))
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'))
const ProductDetailsPage = lazy(() => import('./pages/products/ProductDetailsPage'))
const ProductEditPage = lazy(() => import('./pages/products/ProductEditPage'))
const ProductCreatePage = lazy(() => import('./pages/products/ProductCreatePage'))
const BrandsList = lazy(() => import('./pages/brands/BrandsList'))
const BrandDetail = lazy(() => import('./pages/brands/BrandDetail'))
const BrandEdit = lazy(() => import('./pages/brands/BrandEdit'))
const BrandCreate = lazy(() => import('./pages/brands/BrandCreate'))
const BrandSurveys = lazy(() => import('./pages/brands/BrandSurveys'))
const BrandActivations = lazy(() => import('./pages/brands/BrandActivations'))
const BrandBoards = lazy(() => import('./pages/brands/BrandBoards'))
const BrandProducts = lazy(() => import('./pages/brands/BrandProducts'))
const CustomerOrders = lazy(() => import('./pages/customers/tabs/CustomerOrders'))
const CustomerVisits = lazy(() => import('./pages/customers/tabs/CustomerVisits'))
const CustomerPayments = lazy(() => import('./pages/customers/tabs/CustomerPayments'))
const CustomerSurveys = lazy(() => import('./pages/customers/tabs/CustomerSurveys'))
const CustomerKYC = lazy(() => import('./pages/customers/tabs/CustomerKYC'))
const ProductInventory = lazy(() => import('./pages/products/tabs/ProductInventory'))
const ProductPricing = lazy(() => import('./pages/products/tabs/ProductPricing'))
const ProductPromotions = lazy(() => import('./pages/products/tabs/ProductPromotions'))
const ProductSales = lazy(() => import('./pages/products/tabs/ProductSales'))
const OrderItems = lazy(() => import('./pages/orders/tabs/OrderItems'))
const OrderPayments = lazy(() => import('./pages/orders/tabs/OrderPayments'))
const OrderDelivery = lazy(() => import('./pages/orders/tabs/OrderDelivery'))
const OrderReturns = lazy(() => import('./pages/orders/tabs/OrderReturns'))
const VanOrderCreatePage = lazy(() => import('./pages/van-sales/VanOrderCreatePage'))
const VanRouteDetailsPage = lazy(() => import('./pages/van-sales/VanRouteDetailsPage'))
const VanSalesOrderCreate = lazy(() => import('./pages/van-sales/orders/VanSalesOrderCreate'))
const VanSalesOrderDetail = lazy(() => import('./pages/van-sales/orders/VanSalesOrderDetail'))
const VanSalesOrderEdit = lazy(() => import('./pages/van-sales/orders/VanSalesOrderEdit'))
const VanSalesReturnCreate = lazy(() => import('./pages/van-sales/returns/VanSalesReturnCreate'))
const VanSalesReturnDetail = lazy(() => import('./pages/van-sales/returns/VanSalesReturnDetail'))
const VanLoadCreate = lazy(() => import('./pages/van-sales/van-loads/VanLoadCreate'))
const VanLoadDetail = lazy(() => import('./pages/van-sales/van-loads/VanLoadDetail'))
const VanCashReconciliationCreate = lazy(() => import('./pages/van-sales/cash-reconciliation/CashReconciliationCreate'))
const VanCashReconciliationDetail = lazy(() => import('./pages/van-sales/cash-reconciliation/CashReconciliationDetail'))
const RouteDetail = lazy(() => import('./pages/van-sales-depth/RouteDetail'))
const RouteEdit = lazy(() => import('./pages/van-sales-depth/RouteEdit'))
const RouteCreate = lazy(() => import('./pages/van-sales-depth/RouteCreate'))
const RouteCustomers = lazy(() => import('./pages/van-sales-depth/RouteCustomers'))
const RouteOrders = lazy(() => import('./pages/van-sales-depth/RouteOrders'))
const RoutePerformance = lazy(() => import('./pages/van-sales-depth/RoutePerformance'))
const CommissionDetail = lazy(() => import('./pages/commissions/CommissionDetail'))
const CommissionEdit = lazy(() => import('./pages/commissions/CommissionEdit'))
const CommissionCreate = lazy(() => import('./pages/commissions/CommissionCreate'))
const RuleDetail = lazy(() => import('./pages/commissions/RuleDetail'))
const RuleEdit = lazy(() => import('./pages/commissions/RuleEdit'))
const RuleCreate = lazy(() => import('./pages/commissions/RuleCreate'))
const CommissionCalculationDetail = lazy(() => import('./pages/commissions/calculation-details/CalculationDetail'))
const SessionDetail = lazy(() => import('./pages/cash-reconciliation/SessionDetail'))
const SessionEdit = lazy(() => import('./pages/cash-reconciliation/SessionEdit'))
const DepositDetail = lazy(() => import('./pages/cash-reconciliation/DepositDetail'))
const DepositEdit = lazy(() => import('./pages/cash-reconciliation/DepositEdit'))
const SessionCollections = lazy(() => import('./pages/cash-reconciliation/SessionCollections'))
const SessionDeposits = lazy(() => import('./pages/cash-reconciliation/SessionDeposits'))
const KYCDetail = lazy(() => import('./pages/kyc/KYCDetail'))
const KYCEdit = lazy(() => import('./pages/kyc/KYCEdit'))
const KYCCreate = lazy(() => import('./pages/kyc/KYCCreate'))
const SurveyResponses = lazy(() => import('./pages/surveys/SurveyResponses'))
const SurveyAnalytics = lazy(() => import('./pages/surveys/SurveyAnalytics'))
const ReportDetail = lazy(() => import('./pages/reports/ReportDetail'))
const ReportEdit = lazy(() => import('./pages/reports/ReportEdit'))
const ReportCreate = lazy(() => import('./pages/reports/ReportCreate'))
const FinanceInvoiceDetail = lazy(() => import('./pages/finance/InvoiceDetail'))
const FinanceInvoiceEdit = lazy(() => import('./pages/finance/InvoiceEdit'))
const FinanceInvoiceCreate = lazy(() => import('./pages/finance/InvoiceCreate'))
const FinancePaymentDetail = lazy(() => import('./pages/finance/PaymentDetail'))
const FinancePaymentEdit = lazy(() => import('./pages/finance/PaymentEdit'))
const FinancePaymentCreate = lazy(() => import('./pages/finance/PaymentCreate'))
const InvoicePayments = lazy(() => import('./pages/finance/InvoicePayments'))
const InvoiceItems = lazy(() => import('./pages/finance/InvoiceItems'))
const StockCountDetailsPage = lazy(() => import('./pages/inventory-management/StockCountDetailsPage'))
const AdjustmentCreate = lazy(() => import('./pages/inventory/adjustments/AdjustmentCreate'))
const AdjustmentDetail = lazy(() => import('./pages/inventory/adjustments/AdjustmentDetail'))
const IssueCreate = lazy(() => import('./pages/inventory/issues/IssueCreate'))
const IssueDetail = lazy(() => import('./pages/inventory/issues/IssueDetail'))
const ReceiptCreate = lazy(() => import('./pages/inventory/receipts/ReceiptCreate'))
const ReceiptDetail = lazy(() => import('./pages/inventory/receipts/ReceiptDetail'))
const StockCountCreate = lazy(() => import('./pages/inventory/stock-counts/StockCountCreate'))
const StockCountDetail = lazy(() => import('./pages/inventory/stock-counts/StockCountDetail'))
const TransferCreate = lazy(() => import('./pages/inventory/transfers/TransferCreate'))
const TransferDetail = lazy(() => import('./pages/inventory/transfers/TransferDetail'))
const CreditNoteCreate = lazy(() => import('./pages/sales/credit-notes/CreditNoteCreate'))
const CreditNoteDetail = lazy(() => import('./pages/sales/credit-notes/CreditNoteDetail'))
const InvoiceCreate = lazy(() => import('./pages/sales/invoices/InvoiceCreate'))
const InvoiceDetail = lazy(() => import('./pages/sales/invoices/InvoiceDetail'))
const SalesOrderCreate = lazy(() => import('./pages/sales/orders/SalesOrderCreate'))
const SalesOrderDetail = lazy(() => import('./pages/sales/orders/SalesOrderDetail'))
const SalesOrderEdit = lazy(() => import('./pages/sales/orders/SalesOrderEdit'))
const PaymentCreate = lazy(() => import('./pages/sales/payments/PaymentCreate'))
const PaymentDetail = lazy(() => import('./pages/sales/payments/PaymentDetail'))
const SalesReturnCreate = lazy(() => import('./pages/sales/returns/SalesReturnCreate'))
const SalesReturnDetail = lazy(() => import('./pages/sales/returns/SalesReturnDetail'))
const ActivationCreate = lazy(() => import('./pages/marketing/activations/ActivationCreate'))
const ActivationDetail = lazy(() => import('./pages/marketing/activations/ActivationDetail'))
const CampaignCreate = lazy(() => import('./pages/marketing/campaigns/CampaignCreate'))
const CampaignDetail = lazy(() => import('./pages/marketing/campaigns/CampaignDetail'))
const CampaignEdit = lazy(() => import('./pages/marketing/campaigns/CampaignEdit'))
const EventCreate = lazy(() => import('./pages/marketing/events/EventCreate'))
const EventDetail = lazy(() => import('./pages/marketing/events/EventDetail'))
const EventEdit = lazy(() => import('./pages/marketing/events/EventEdit'))
const PromotionCreate = lazy(() => import('./pages/marketing/promotions/PromotionCreate'))
const PromotionDetail = lazy(() => import('./pages/marketing/promotions/PromotionDetail'))
const BoardPlacementCreate = lazy(() => import('./pages/field-operations/board-placements/BoardPlacementCreate'))
const BoardPlacementDetail = lazy(() => import('./pages/field-operations/board-placements/BoardPlacementDetail'))
const CommissionLedgerDetail = lazy(() => import('./pages/field-operations/commission-ledger/CommissionLedgerDetail'))
const ProductDistributionCreate = lazy(() => import('./pages/field-operations/product-distributions/ProductDistributionCreate'))
const ProductDistributionDetail = lazy(() => import('./pages/field-operations/product-distributions/ProductDistributionDetail'))
const VisitCreate = lazy(() => import('./pages/field-operations/visits/VisitCreate'))
const VisitDetail = lazy(() => import('./pages/field-operations/visits/VisitDetail'))
const VisitEdit = lazy(() => import('./pages/field-operations/visits/VisitEdit'))
const VisitManagementPage = lazy(() => import('./pages/field-operations/VisitManagementPage'))
const VisitConfigurationPage = lazy(() => import('./pages/field-operations/VisitConfigurationPage'))
const CRMCustomerCreate = lazy(() => import('./pages/crm/customers/CustomerCreate'))
const CRMCustomerDetail = lazy(() => import('./pages/crm/customers/CustomerDetail'))
const CRMCustomerEdit = lazy(() => import('./pages/crm/customers/CustomerEdit'))
const KYCCaseCreate = lazy(() => import('./pages/crm/kyc-cases/KYCCaseCreate'))
const KYCCaseDetail = lazy(() => import('./pages/crm/kyc-cases/KYCCaseDetail'))
const CRMSurveyCreate = lazy(() => import('./pages/crm/surveys/SurveyCreate'))
const SurveyDetail = lazy(() => import('./pages/crm/surveys/SurveyDetail'))
const CashReconciliationCreate = lazy(() => import('./pages/finance/cash-reconciliation/CashReconciliationCreate'))
const CashReconciliationDetail = lazy(() => import('./pages/finance/cash-reconciliation/CashReconciliationDetail'))
const CommissionPayoutDetail = lazy(() => import('./pages/finance/commission-payouts/CommissionPayoutDetail'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const RolePermissionsPage = lazy(() => import('./pages/admin/RolePermissionsPage'))
const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage'))
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'))
const SmokeTestPage = lazy(() => import('./pages/admin/SmokeTestPage'))
const RouteAuditPage = lazy(() => import('./pages/admin/RouteAuditPage'))
const BrandManagementPage = lazy(() => import('./pages/admin/BrandManagementPage'))
const AdminCampaignManagementPage = lazy(() => import('./pages/admin/CampaignManagementPage'))
const CommissionRuleBuilderPage = lazy(() => import('./pages/admin/CommissionRuleBuilderPage'))
const DataImportExportPage = lazy(() => import('./pages/admin/DataImportExportPage'))
const POSLibraryPage = lazy(() => import('./pages/admin/POSLibraryPage'))
const ProductTypeBuilderPage = lazy(() => import('./pages/admin/ProductTypeBuilderPage'))
const SurveyBuilderPage = lazy(() => import('./pages/admin/SurveyBuilderPage'))
const TerritoryManagementPage = lazy(() => import('./pages/admin/TerritoryManagementPage'))
const BoardManagementPage = lazy(() => import('./pages/admin/BoardManagementPage'))
const PriceListManagementPage = lazy(() => import('./pages/admin/PriceListManagementPage'))
const PriceListEditPage = lazy(() => import('./pages/admin/PriceListEditPage'))
const TargetManagementPage = lazy(() => import('./pages/admin/TargetManagementPage'))
const TargetReportingPage = lazy(() => import('./pages/admin/TargetReportingPage'))
const BackupManagementPage = lazy(() => import('./pages/admin-settings/BackupManagementPage').then(m => ({ default: m.BackupManagementPage })))
const IntegrationsPage = lazy(() => import('./pages/admin-settings/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })))
const SystemHealthPage = lazy(() => import('./pages/admin-settings/SystemHealthPage').then(m => ({ default: m.SystemHealthPage })))
const InvoicesList = lazy(() => import('./pages/sales/invoices/InvoicesList'))
const PaymentsList = lazy(() => import('./pages/sales/payments/PaymentsList'))
const CreditNotesList = lazy(() => import('./pages/sales/credit-notes/CreditNotesList'))
const SalesReturnsList = lazy(() => import('./pages/sales/returns/SalesReturnsList'))
const SalesOrdersList = lazy(() => import('./pages/sales/orders/SalesOrdersList'))
const VanSalesOrdersList = lazy(() => import('./pages/van-sales/orders/VanSalesOrdersList'))
const VanSalesReturnsList = lazy(() => import('./pages/van-sales/returns/VanSalesReturnsList'))
const VanLoadsList = lazy(() => import('./pages/van-sales/van-loads/VanLoadsList'))
const VanCashReconciliationList = lazy(() => import('./pages/van-sales/cash-reconciliation/CashReconciliationList'))
const AdjustmentsList = lazy(() => import('./pages/inventory/adjustments/AdjustmentsList'))
const IssuesList = lazy(() => import('./pages/inventory/issues/IssuesList'))
const ReceiptsList = lazy(() => import('./pages/inventory/receipts/ReceiptsList'))
const StockCountsList = lazy(() => import('./pages/inventory/stock-counts/StockCountsList'))
const TransfersList = lazy(() => import('./pages/inventory/transfers/TransfersList'))
const CashReconciliationList = lazy(() => import('./pages/finance/cash-reconciliation/CashReconciliationList'))
const CommissionPayoutsList = lazy(() => import('./pages/finance/commission-payouts/CommissionPayoutsList'))
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'))
const InvoiceManagementPage = lazy(() => import('./pages/finance/InvoiceManagementPage'))
const PaymentCollectionPage = lazy(() => import('./pages/finance/PaymentCollectionPage'))
const BankDepositPage = lazy(() => import('./pages/cash-reconciliation/BankDepositPage').then(m => ({ default: m.BankDepositPage })))
const CashCollectionPage = lazy(() => import('./pages/cash-reconciliation/CashCollectionPage').then(m => ({ default: m.CashCollectionPage })))
const CashReportsPage = lazy(() => import('./pages/cash-reconciliation/CashReportsPage').then(m => ({ default: m.CashReportsPage })))
const CashSessionDashboardPage = lazy(() => import('./pages/cash-reconciliation/CashSessionDashboardPage').then(m => ({ default: m.CashSessionDashboardPage })))
const CloseCashSessionPage = lazy(() => import('./pages/cash-reconciliation/CloseCashSessionPage').then(m => ({ default: m.CloseCashSessionPage })))
const StartCashSessionPage = lazy(() => import('./pages/cash-reconciliation/StartCashSessionPage').then(m => ({ default: m.StartCashSessionPage })))
const VarianceApprovalPage = lazy(() => import('./pages/cash-reconciliation/VarianceApprovalPage').then(m => ({ default: m.VarianceApprovalPage })))
const CommissionApprovalPage = lazy(() => import('./pages/commissions/CommissionApprovalPage').then(m => ({ default: m.CommissionApprovalPage })))
const CommissionCalculationPage = lazy(() => import('./pages/commissions/CommissionCalculationPage').then(m => ({ default: m.CommissionCalculationPage })))
const CommissionDashboardPage = lazy(() => import('./pages/commissions/CommissionDashboardPage').then(m => ({ default: m.CommissionDashboardPage })))
const CommissionPaymentPage = lazy(() => import('./pages/commissions/CommissionPaymentPage').then(m => ({ default: m.CommissionPaymentPage })))
const CommissionReportsPage = lazy(() => import('./pages/commissions/CommissionReportsPage').then(m => ({ default: m.CommissionReportsPage })))
const CommissionSettingsPage = lazy(() => import('./pages/commissions/CommissionSettingsPage').then(m => ({ default: m.CommissionSettingsPage })))
const ActivationsList = lazy(() => import('./pages/marketing/activations/ActivationsList'))
const CampaignsList = lazy(() => import('./pages/marketing/campaigns/CampaignsList'))
const EventsList = lazy(() => import('./pages/marketing/events/EventsList'))
const PromotionsList = lazy(() => import('./pages/marketing/promotions/PromotionsList'))
const CustomersList = lazy(() => import('./pages/crm/customers/CustomersList'))
const KYCCasesList = lazy(() => import('./pages/crm/kyc-cases/KYCCasesList'))
const SurveysList = lazy(() => import('./pages/crm/surveys/SurveysList'))
const BoardPlacementsList = lazy(() => import('./pages/field-operations/board-placements/BoardPlacementsList'))
const CommissionLedgerList = lazy(() => import('./pages/field-operations/commission-ledger/CommissionLedgerList'))
const ProductDistributionsList = lazy(() => import('./pages/field-operations/product-distributions/ProductDistributionsList'))
const CustomerAnalyticsPage = lazy(() => import('./pages/customer-management/CustomerAnalyticsPage').then(m => ({ default: m.CustomerAnalyticsPage })))
const CustomerCreditManagementPage = lazy(() => import('./pages/customer-management/CustomerCreditManagementPage').then(m => ({ default: m.CustomerCreditManagementPage })))
const CustomerHierarchyPage = lazy(() => import('./pages/customer-management/CustomerHierarchyPage').then(m => ({ default: m.CustomerHierarchyPage })))
const CustomerImportExportPage = lazy(() => import('./pages/customer-management/CustomerImportExportPage').then(m => ({ default: m.CustomerImportExportPage })))
const CustomerListPage = lazy(() => import('./pages/customer-management/CustomerListPage').then(m => ({ default: m.CustomerListPage })))
const CustomerSegmentationPage = lazy(() => import('./pages/customer-management/CustomerSegmentationPage').then(m => ({ default: m.CustomerSegmentationPage })))
const CustomerVisitHistoryPage = lazy(() => import('./pages/customer-management/CustomerVisitHistoryPage').then(m => ({ default: m.CustomerVisitHistoryPage })))
const ProductAnalyticsPage = lazy(() => import('./pages/product-management/ProductAnalyticsPage').then(m => ({ default: m.ProductAnalyticsPage })))
const ProductHierarchyPage = lazy(() => import('./pages/product-management/ProductHierarchyPage').then(m => ({ default: m.ProductHierarchyPage })))
const ProductImportExportPage = lazy(() => import('./pages/product-management/ProductImportExportPage').then(m => ({ default: m.ProductImportExportPage })))
const ProductInventoryPage = lazy(() => import('./pages/product-management/ProductInventoryPage').then(m => ({ default: m.ProductInventoryPage })))
const ProductListPage = lazy(() => import('./pages/product-management/ProductListPage').then(m => ({ default: m.ProductListPage })))
const ProductPricingPage = lazy(() => import('./pages/product-management/ProductPricingPage').then(m => ({ default: m.ProductPricingPage })))
const CreditNotesPage = lazy(() => import('./pages/order-lifecycle/CreditNotesPage').then(m => ({ default: m.CreditNotesPage })))
const DeliveryTrackingPage = lazy(() => import('./pages/order-lifecycle/DeliveryTrackingPage').then(m => ({ default: m.DeliveryTrackingPage })))
const OrderFulfillmentPage = lazy(() => import('./pages/order-lifecycle/OrderFulfillmentPage').then(m => ({ default: m.OrderFulfillmentPage })))
const QuotationApprovalPage = lazy(() => import('./pages/order-lifecycle/QuotationApprovalPage').then(m => ({ default: m.QuotationApprovalPage })))
const QuotationManagementPage = lazy(() => import('./pages/order-lifecycle/QuotationManagementPage').then(m => ({ default: m.QuotationManagementPage })))
const RefundProcessingPage = lazy(() => import('./pages/order-lifecycle/RefundProcessingPage').then(m => ({ default: m.RefundProcessingPage })))
const ReturnManagementPage = lazy(() => import('./pages/order-lifecycle/ReturnManagementPage').then(m => ({ default: m.ReturnManagementPage })))
const InventoryAnalyticsPage = lazy(() => import('./pages/inventory-management/InventoryAnalyticsPage'))
const StockCountListPage = lazy(() => import('./pages/inventory-management/StockCountListPage'))
const StockMovementsPage = lazy(() => import('./pages/inventory-management/StockMovementsPage'))
const StockOverviewPage = lazy(() => import('./pages/inventory-management/StockOverviewPage'))
const StockTransferPage = lazy(() => import('./pages/inventory-management/StockTransferPage'))
const WarehouseManagementPage = lazy(() => import('./pages/inventory-management/WarehouseManagementPage'))
const AnalyticsDashboardPage = lazy(() => import('./pages/reports/AnalyticsDashboardPage'))
const ReportBuilderPage = lazy(() => import('./pages/reports/ReportBuilderPage'))
const ReportsHub = lazy(() => import('./pages/reports/ReportsHub'))
const ReportTemplatesPage = lazy(() => import('./pages/reports/ReportTemplatesPage'))
const CommissionSummaryReport = lazy(() => import('./pages/reports/finance/CommissionSummaryReport'))
const InventorySnapshotReport = lazy(() => import('./pages/reports/inventory/InventorySnapshotReport'))
const VarianceAnalysisReport = lazy(() => import('./pages/reports/inventory/VarianceAnalysisReport'))
const FieldOperationsProductivityReport = lazy(() => import('./pages/reports/operations/FieldOperationsProductivityReport'))
const SalesExceptionsReport = lazy(() => import('./pages/reports/sales/SalesExceptionsReport'))
const SalesSummaryReport = lazy(() => import('./pages/reports/sales/SalesSummaryReport'))
const CustomerAnalyticsReportPage = lazy(() => import('./pages/reports-analytics/CustomerAnalyticsPage').then(m => ({ default: m.CustomerAnalyticsPage })))
const ExecutiveDashboardPage = lazy(() => import('./pages/reports-analytics/ExecutiveDashboardPage').then(m => ({ default: m.ExecutiveDashboardPage })))
const FinancialReportsPage = lazy(() => import('./pages/reports-analytics/FinancialReportsPage').then(m => ({ default: m.FinancialReportsPage })))
const InventoryReportsPage = lazy(() => import('./pages/reports-analytics/InventoryReportsPage').then(m => ({ default: m.InventoryReportsPage })))
const PerformanceAnalyticsPage = lazy(() => import('./pages/reports-analytics/PerformanceAnalyticsPage').then(m => ({ default: m.PerformanceAnalyticsPage })))
const SalesReportsPage = lazy(() => import('./pages/reports-analytics/SalesReportsPage').then(m => ({ default: m.SalesReportsPage })))
const AuditTrailPage = lazy(() => import('./pages/kyc-surveys/AuditTrailPage').then(m => ({ default: m.AuditTrailPage })))
const KYCAnalyticsPage = lazy(() => import('./pages/kyc-surveys/KYCAnalyticsPage').then(m => ({ default: m.KYCAnalyticsPage })))
const KYCListPage = lazy(() => import('./pages/kyc-surveys/KYCListPage').then(m => ({ default: m.KYCListPage })))
const SurveyListPage = lazy(() => import('./pages/kyc-surveys/SurveyListPage').then(m => ({ default: m.SurveyListPage })))
const SurveyResponsesPage = lazy(() => import('./pages/kyc-surveys/SurveyResponsesPage').then(m => ({ default: m.SurveyResponsesPage })))
const CustomerDashboard = lazy(() => import('./pages/customers/CustomerDashboard'))
const OrderDashboard = lazy(() => import('./pages/orders/OrderDashboard'))
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'))
const AdvancedAnalyticsDashboard = lazy(() => import('./pages/analytics/AdvancedAnalyticsDashboard'))
const ExecutiveDashboard = lazy(() => import('./pages/analytics/ExecutiveDashboard'))
const SalesDashboard = lazy(() => import('./pages/sales/SalesDashboard'))
const BrandActivationsPage = lazy(() => import('./pages/brand-activations/BrandActivationsPage'))
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'))
const FieldAgentDashboardPage = lazy(() => import('./pages/field-operations/FieldAgentDashboardPage'))
const LiveGPSTrackingPage = lazy(() => import('./pages/field-operations/LiveGPSTrackingPage'))
const VisitHistoryPage = lazy(() => import('./pages/field-operations/VisitHistoryPage'))
const VanCashCollectionPage= lazy(() => import('./pages/van-sales/VanCashCollectionPage'))
const VanInventoryPage = lazy(() => import('./pages/van-sales/VanInventoryPage'))
const VanOrdersListPage = lazy(() => import('./pages/van-sales/VanOrdersListPage'))
const VanPerformancePage = lazy(() => import('./pages/van-sales/VanPerformancePage'))
const VanRoutesListPage = lazy(() => import('./pages/van-sales/VanRoutesListPage'))
const SurveyPage = lazy(() => import('./pages/field-agents/SurveyPage'))
const TaskPage = lazy(() => import('./pages/field-agents/TaskPage'))
import LandingPage from './pages/marketing/LandingPage'

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
    <>
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Marketing Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes */}
          <Route path="/auth/*" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthLayout />
          }>
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route index element={<Navigate to="login" replace />} />
          </Route>

          {/* Protected Routes - using pathless parent to avoid catch-all matching "/" */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Dashboard Routes */}
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
            
            {/* Analytics Routes */}
            <Route path="analytics-dashboard" element={<Suspense fallback={<PageLoader />}><AnalyticsDashboard /></Suspense>} />
            <Route path="analytics-dashboard/orders" element={<Suspense fallback={<PageLoader />}><OrdersAnalytics /></Suspense>} />
            <Route path="analytics-dashboard/field-ops" element={<Suspense fallback={<PageLoader />}><FieldOpsAnalytics /></Suspense>} />
            <Route path="analytics-dashboard/commissions" element={<Suspense fallback={<PageLoader />}><CommissionsAnalytics /></Suspense>} />
            <Route path="analytics-dashboard/advanced" element={<Suspense fallback={<PageLoader />}><AdvancedAnalyticsDashboard /></Suspense>} />
            <Route path="analytics-dashboard/executive" element={<Suspense fallback={<PageLoader />}><ExecutiveDashboard /></Suspense>} />
            
                        {/* Reports Routes */}
                        <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsHub /></Suspense>} />
                        <Route path="reports/hub" element={<Suspense fallback={<PageLoader />}><ReportsHub /></Suspense>} />
                        <Route path="reports/builder" element={<Suspense fallback={<PageLoader />}><ReportBuilderPage /></Suspense>} />
            <Route path="reports/templates" element={<Suspense fallback={<PageLoader />}><ReportTemplatesPage /></Suspense>} />
            <Route path="reports/create" element={<Suspense fallback={<PageLoader />}><ReportCreate /></Suspense>} />
            <Route path="reports/:id" element={<Suspense fallback={<PageLoader />}><ReportDetail /></Suspense>} />
            <Route path="reports/:id/edit" element={<Suspense fallback={<PageLoader />}><ReportEdit /></Suspense>} />
            <Route path="reports/sales/summary" element={<Suspense fallback={<PageLoader />}><SalesSummaryReport /></Suspense>} />
            <Route path="reports/sales/exceptions" element={<Suspense fallback={<PageLoader />}><SalesExceptionsReport /></Suspense>} />
            <Route path="reports/finance/commission-summary" element={<Suspense fallback={<PageLoader />}><CommissionSummaryReport /></Suspense>} />
            <Route path="reports/inventory/snapshot" element={<Suspense fallback={<PageLoader />}><InventorySnapshotReport /></Suspense>} />
            <Route path="reports/inventory/variance" element={<Suspense fallback={<PageLoader />}><VarianceAnalysisReport /></Suspense>} />
            <Route path="reports/operations/field-ops-productivity" element={<Suspense fallback={<PageLoader />}><FieldOperationsProductivityReport /></Suspense>} />
            
            {/* Reports Analytics Routes */}
            <Route path="reports-analytics/customer" element={<Suspense fallback={<PageLoader />}><CustomerAnalyticsReportPage /></Suspense>} />
            <Route path="reports-analytics/executive" element={<Suspense fallback={<PageLoader />}><ExecutiveDashboardPage /></Suspense>} />
            <Route path="reports-analytics/financial" element={<Suspense fallback={<PageLoader />}><FinancialReportsPage /></Suspense>} />
            <Route path="reports-analytics/inventory" element={<Suspense fallback={<PageLoader />}><InventoryReportsPage /></Suspense>} />
            <Route path="reports-analytics/performance" element={<Suspense fallback={<PageLoader />}><PerformanceAnalyticsPage /></Suspense>} />
            <Route path="reports-analytics/sales" element={<Suspense fallback={<PageLoader />}><SalesReportsPage /></Suspense>} />

            {/* Van Sales Routes */}
            <Route path="van-sales" element={<Suspense fallback={<PageLoader />}><VanSalesDashboard /></Suspense>} />
            <Route path="van-sales/dashboard" element={<Suspense fallback={<PageLoader />}><VanSalesDashboard /></Suspense>} />
            <Route path="van-sales/workflow" element={<Suspense fallback={<PageLoader />}><VanSalesWorkflowPageMobile /></Suspense>} />
            <Route path="van-sales/management" element={<Suspense fallback={<PageLoader />}><VanSalesPage /></Suspense>} />
            <Route path="van-sales/performance" element={<Suspense fallback={<PageLoader />}><VanPerformancePage /></Suspense>} />
            <Route path="van-sales/cash-collection" element={<Suspense fallback={<PageLoader />}><VanCashCollectionPage /></Suspense>} />
            <Route path="van-sales/van-inventory" element={<Suspense fallback={<PageLoader />}><VanInventoryPage /></Suspense>} />
            <Route path="van-sales/routes" element={<Suspense fallback={<PageLoader />}><VanRoutesListPage /></Suspense>} />
            <Route path="van-sales/routes/create" element={<Suspense fallback={<PageLoader />}><RouteCreate /></Suspense>} />
            <Route path="van-sales/routes/:id" element={<Suspense fallback={<PageLoader />}><RouteDetail /></Suspense>} />
            <Route path="van-sales/routes/:id/edit" element={<Suspense fallback={<PageLoader />}><RouteEdit /></Suspense>} />
            <Route path="van-sales/routes/:id/customers" element={<Suspense fallback={<PageLoader />}><RouteCustomers /></Suspense>} />
            <Route path="van-sales/routes/:id/orders" element={<Suspense fallback={<PageLoader />}><RouteOrders /></Suspense>} />
            <Route path="van-sales/routes/:id/performance" element={<Suspense fallback={<PageLoader />}><RoutePerformance /></Suspense>} />
            <Route path="van-sales/inventory" element={<Suspense fallback={<PageLoader />}><InventoryTrackingPage /></Suspense>} />
            <Route path="van-sales/orders" element={<Suspense fallback={<PageLoader />}><VanSalesOrdersList /></Suspense>} />
            <Route path="van-sales/orders/create" element={<Suspense fallback={<PageLoader />}><VanOrderCreatePage /></Suspense>} />
            <Route path="van-sales/orders/new" element={<Suspense fallback={<PageLoader />}><VanSalesOrderCreate /></Suspense>} />
            <Route path="van-sales/orders/:id" element={<Suspense fallback={<PageLoader />}><VanSalesOrderDetail /></Suspense>} />
            <Route path="van-sales/orders/:id/edit" element={<Suspense fallback={<PageLoader />}><VanSalesOrderEdit /></Suspense>} />
            <Route path="van-sales/returns" element={<Suspense fallback={<PageLoader />}><VanSalesReturnsList /></Suspense>} />
            <Route path="van-sales/returns/create" element={<Suspense fallback={<PageLoader />}><VanSalesReturnCreate /></Suspense>} />
            <Route path="van-sales/returns/:id" element={<Suspense fallback={<PageLoader />}><VanSalesReturnDetail /></Suspense>} />
            <Route path="van-sales/van-loads" element={<Suspense fallback={<PageLoader />}><VanLoadsList /></Suspense>} />
            <Route path="van-sales/van-loads/create" element={<Suspense fallback={<PageLoader />}><VanLoadCreate /></Suspense>} />
            <Route path="van-sales/van-loads/:id" element={<Suspense fallback={<PageLoader />}><VanLoadDetail /></Suspense>} />
            <Route path="van-sales/cash-reconciliation" element={<Suspense fallback={<PageLoader />}><VanCashReconciliationList /></Suspense>} />
            <Route path="van-sales/cash-reconciliation/create" element={<Suspense fallback={<PageLoader />}><VanCashReconciliationCreate /></Suspense>} />
            <Route path="van-sales/cash-reconciliation/:id" element={<Suspense fallback={<PageLoader />}><VanCashReconciliationDetail /></Suspense>} />

            {/* Field Operations Routes */}
            <Route path="field-operations" element={<Suspense fallback={<PageLoader />}><FieldOperationsDashboard /></Suspense>} />
            <Route path="field-operations/dashboard" element={<Suspense fallback={<PageLoader />}><FieldOperationsDashboard /></Suspense>} />
            <Route path="field-operations/agent-dashboard" element={<Suspense fallback={<PageLoader />}><FieldAgentDashboardPage /></Suspense>} />
            <Route path="field-operations/agents" element={<Suspense fallback={<PageLoader />}><FieldAgentsPage /></Suspense>} />
            <Route path="field-operations/mapping" element={<Suspense fallback={<PageLoader />}><LiveMappingPage /></Suspense>} />
            <Route path="field-operations/gps-tracking" element={<Suspense fallback={<PageLoader />}><LiveGPSTrackingPage /></Suspense>} />
            <Route path="field-operations/boards" element={<Suspense fallback={<PageLoader />}><BoardPlacementsList /></Suspense>} />
            <Route path="field-operations/boards/create" element={<Suspense fallback={<PageLoader />}><BoardPlacementFormPage /></Suspense>} />
            <Route path="field-operations/boards/:id" element={<Suspense fallback={<PageLoader />}><BoardPlacementDetail /></Suspense>} />
            <Route path="field-operations/products" element={<Suspense fallback={<PageLoader />}><ProductDistributionsList /></Suspense>} />
            <Route path="field-operations/products/create" element={<Suspense fallback={<PageLoader />}><ProductDistributionFormPage /></Suspense>} />
            <Route path="field-operations/products/:id" element={<Suspense fallback={<PageLoader />}><ProductDistributionDetail /></Suspense>} />
            <Route path="field-operations/commission" element={<Suspense fallback={<PageLoader />}><CommissionLedgerList /></Suspense>} />
            <Route path="field-operations/commission/:id" element={<Suspense fallback={<PageLoader />}><CommissionLedgerDetail /></Suspense>} />
            <Route path="field-operations/visits" element={<Suspense fallback={<PageLoader />}><VisitManagementPage /></Suspense>} />
            <Route path="field-operations/visits/create" element={<Suspense fallback={<PageLoader />}><VisitCreate /></Suspense>} />
            <Route path="field-operations/visits/:id" element={<Suspense fallback={<PageLoader />}><VisitDetail /></Suspense>} />
            <Route path="field-operations/visits/:id/edit" element={<Suspense fallback={<PageLoader />}><VisitEdit /></Suspense>} />
            <Route path="field-operations/visit-configurations" element={<Suspense fallback={<PageLoader />}><VisitConfigurationPage /></Suspense>} />
            <Route path="field-operations/visit-history" element={<Suspense fallback={<PageLoader />}><VisitHistoryPage /></Suspense>} />
            <Route path="field-operations/visit-management" element={<Suspense fallback={<PageLoader />}><VisitManagementPage /></Suspense>} />

            {/* Field Marketing Routes */}
            <Route path="field-marketing" element={<Suspense fallback={<PageLoader />}><FieldMarketingDashboard /></Suspense>} />
            <Route path="field-marketing/dashboard" element={<Suspense fallback={<PageLoader />}><FieldMarketingDashboard /></Suspense>} />
            <Route path="field-marketing/customer-selection" element={<Suspense fallback={<PageLoader />}><CustomerSelection /></Suspense>} />
            <Route path="field-marketing/gps-verification" element={<Suspense fallback={<PageLoader />}><GPSVerification /></Suspense>} />
            <Route path="field-marketing/brand-selection" element={<Suspense fallback={<PageLoader />}><BrandSelection /></Suspense>} />
            <Route path="field-marketing/visit-list" element={<Suspense fallback={<PageLoader />}><VisitList /></Suspense>} />
            <Route path="field-marketing/board-placement" element={<Suspense fallback={<PageLoader />}><BoardPlacement /></Suspense>} />
            <Route path="field-marketing/product-distribution" element={<Suspense fallback={<PageLoader />}><ProductDistribution /></Suspense>} />
            <Route path="field-marketing/new-customer" element={<Suspense fallback={<PageLoader />}><NewCustomerRegistration /></Suspense>} />
            <Route path="field-marketing/visit-summary" element={<Suspense fallback={<PageLoader />}><VisitSummary /></Suspense>} />
            <Route path="field-marketing/my-commissions" element={<Suspense fallback={<PageLoader />}><MyCommissions /></Suspense>} />
            <Route path="field-marketing/my-targets" element={<Suspense fallback={<PageLoader />}><MyTargets /></Suspense>} />

            {/* KYC Routes */}
            <Route path="kyc" element={<Suspense fallback={<PageLoader />}><KYCDashboard /></Suspense>} />
            <Route path="kyc/dashboard" element={<Suspense fallback={<PageLoader />}><KYCDashboard /></Suspense>} />
            <Route path="kyc/management" element={<Suspense fallback={<PageLoader />}><KYCManagement /></Suspense>} />
            <Route path="kyc/create" element={<Suspense fallback={<PageLoader />}><KYCCreate /></Suspense>} />
            <Route path="kyc/:id" element={<Suspense fallback={<PageLoader />}><KYCDetail /></Suspense>} />
            <Route path="kyc/:id/edit" element={<Suspense fallback={<PageLoader />}><KYCEdit /></Suspense>} />
            <Route path="kyc/reports" element={<Suspense fallback={<PageLoader />}><KYCReports /></Suspense>} />
            
            {/* KYC Surveys Routes */}
            <Route path="kyc-surveys/list" element={<Suspense fallback={<PageLoader />}><KYCListPage /></Suspense>} />
            <Route path="kyc-surveys/analytics" element={<Suspense fallback={<PageLoader />}><KYCAnalyticsPage /></Suspense>} />
            <Route path="kyc-surveys/surveys" element={<Suspense fallback={<PageLoader />}><SurveyListPage /></Suspense>} />
            <Route path="kyc-surveys/responses" element={<Suspense fallback={<PageLoader />}><SurveyResponsesPage /></Suspense>} />
            <Route path="kyc-surveys/audit-trail" element={<Suspense fallback={<PageLoader />}><AuditTrailPage /></Suspense>} />

            {/* Surveys Routes */}
            <Route path="surveys" element={<Suspense fallback={<PageLoader />}><SurveysDashboard /></Suspense>} />
            <Route path="surveys/dashboard" element={<Suspense fallback={<PageLoader />}><SurveysDashboard /></Suspense>} />
            <Route path="surveys/management" element={<Suspense fallback={<PageLoader />}><SurveysManagement /></Suspense>} />
            <Route path="surveys/create" element={<Suspense fallback={<PageLoader />}><SurveyCreate /></Suspense>} />
            <Route path="surveys/:id/edit" element={<Suspense fallback={<PageLoader />}><SurveyEdit /></Suspense>} />
            <Route path="surveys/:id/responses" element={<Suspense fallback={<PageLoader />}><SurveyResponses /></Suspense>} />
            <Route path="surveys/:id/analytics" element={<Suspense fallback={<PageLoader />}><SurveyAnalytics /></Suspense>} />

            {/* Inventory Routes */}
            <Route path="inventory" element={<Suspense fallback={<PageLoader />}><InventoryDashboard /></Suspense>} />
            <Route path="inventory/dashboard" element={<Suspense fallback={<PageLoader />}><InventoryDashboard /></Suspense>} />
            <Route path="inventory/stock-count" element={<Suspense fallback={<PageLoader />}><StockCountWorkflowPage /></Suspense>} />
            <Route path="inventory/stock-count/:id" element={<Suspense fallback={<PageLoader />}><StockCountDetailsPage /></Suspense>} />
            <Route path="inventory/management" element={<Suspense fallback={<PageLoader />}><InventoryManagement /></Suspense>} />
            <Route path="inventory/reports" element={<Suspense fallback={<PageLoader />}><InventoryReports /></Suspense>} />
            <Route path="inventory/adjustments" element={<Suspense fallback={<PageLoader />}><AdjustmentsList /></Suspense>} />
            <Route path="inventory/adjustments/create" element={<Suspense fallback={<PageLoader />}><AdjustmentCreate /></Suspense>} />
            <Route path="inventory/adjustments/:id" element={<Suspense fallback={<PageLoader />}><AdjustmentDetail /></Suspense>} />
            <Route path="inventory/issues" element={<Suspense fallback={<PageLoader />}><IssuesList /></Suspense>} />
            <Route path="inventory/issues/create" element={<Suspense fallback={<PageLoader />}><IssueCreate /></Suspense>} />
            <Route path="inventory/issues/:id" element={<Suspense fallback={<PageLoader />}><IssueDetail /></Suspense>} />
            <Route path="inventory/receipts" element={<Suspense fallback={<PageLoader />}><ReceiptsList /></Suspense>} />
            <Route path="inventory/receipts/create" element={<Suspense fallback={<PageLoader />}><ReceiptCreate /></Suspense>} />
            <Route path="inventory/receipts/:id" element={<Suspense fallback={<PageLoader />}><ReceiptDetail /></Suspense>} />
            <Route path="inventory/stock-counts" element={<Suspense fallback={<PageLoader />}><StockCountsList /></Suspense>} />
            <Route path="inventory/stock-counts/create" element={<Suspense fallback={<PageLoader />}><StockCountCreate /></Suspense>} />
            <Route path="inventory/stock-counts/:id" element={<Suspense fallback={<PageLoader />}><StockCountDetail /></Suspense>} />
            <Route path="inventory/transfers" element={<Suspense fallback={<PageLoader />}><TransfersList /></Suspense>} />
            <Route path="inventory/transfers/create" element={<Suspense fallback={<PageLoader />}><TransferCreate /></Suspense>} />
            <Route path="inventory/transfers/:id" element={<Suspense fallback={<PageLoader />}><TransferDetail /></Suspense>} />
            
            {/* Inventory Management Routes */}
            <Route path="inventory-management/overview" element={<Suspense fallback={<PageLoader />}><StockOverviewPage /></Suspense>} />
            <Route path="inventory-management/analytics" element={<Suspense fallback={<PageLoader />}><InventoryAnalyticsPage /></Suspense>} />
            <Route path="inventory-management/movements" element={<Suspense fallback={<PageLoader />}><StockMovementsPage /></Suspense>} />
            <Route path="inventory-management/stock-counts" element={<Suspense fallback={<PageLoader />}><StockCountListPage /></Suspense>} />
            <Route path="inventory-management/transfers" element={<Suspense fallback={<PageLoader />}><StockTransferPage /></Suspense>} />
            <Route path="inventory-management/warehouses" element={<Suspense fallback={<PageLoader />}><WarehouseManagementPage /></Suspense>} />

            {/* Promotions Routes */}
            <Route path="promotions" element={<Suspense fallback={<PageLoader />}><PromotionsDashboard /></Suspense>} />
            <Route path="promotions/dashboard" element={<Suspense fallback={<PageLoader />}><PromotionsDashboard /></Suspense>} />
            <Route path="promotions/management" element={<Suspense fallback={<PageLoader />}><PromotionsManagement /></Suspense>} />

            {/* Trade Marketing Routes */}
            <Route path="trade-marketing" element={<Suspense fallback={<PageLoader />}><TradeMarketingPage /></Suspense>} />
            <Route path="trade-marketing/activation" element={<Suspense fallback={<PageLoader />}><ActivationWorkflowPage /></Suspense>} />
            <Route path="trade-marketing/campaigns" element={<Suspense fallback={<PageLoader />}><CampaignManagementPage /></Suspense>} />
            <Route path="trade-marketing/merchandising" element={<Suspense fallback={<PageLoader />}><MerchandisingCompliancePage /></Suspense>} />
            <Route path="trade-marketing/promoters" element={<Suspense fallback={<PageLoader />}><PromoterManagementPage /></Suspense>} />
            <Route path="trade-marketing/analytics" element={<Suspense fallback={<PageLoader />}><TradeMarketingAnalyticsPage /></Suspense>} />

            {/* Events Routes */}
            <Route path="events" element={<Suspense fallback={<PageLoader />}><EventsPage /></Suspense>} />

            {/* Campaign Routes */}
            <Route path="campaigns" element={<Suspense fallback={<PageLoader />}><CampaignsPage /></Suspense>} />
            
            {/* Brand Activations Routes */}
            <Route path="brand-activations" element={<Suspense fallback={<PageLoader />}><BrandActivationsPage /></Suspense>} />
            
            {/* Superadmin Routes */}
            <Route path="superadmin/tenants" element={<Suspense fallback={<PageLoader />}><TenantManagement /></Suspense>} />

            {/* Legacy Field Agent Routes (for backward compatibility) */}
            <Route path="field-agents" element={<Suspense fallback={<PageLoader />}><FieldAgentsPage /></Suspense>} />
            <Route path="field-agents/dashboard" element={<Suspense fallback={<PageLoader />}><AgentDashboard /></Suspense>} />
            <Route path="field-agents/workflow" element={<Suspense fallback={<PageLoader />}><AgentWorkflowPageMobile /></Suspense>} />
            <Route path="field-agents/mapping" element={<Suspense fallback={<PageLoader />}><LiveMappingPage /></Suspense>} />
            <Route path="field-agents/boards" element={<Suspense fallback={<PageLoader />}><BoardPlacementPage /></Suspense>} />
            <Route path="field-agents/products" element={<Suspense fallback={<PageLoader />}><ProductDistributionPage /></Suspense>} />
            <Route path="field-agents/commission" element={<Suspense fallback={<PageLoader />}><AgentCommissionDashboard /></Suspense>} />
            <Route path="field-agents/surveys" element={<Suspense fallback={<PageLoader />}><SurveyPage /></Suspense>} />
            <Route path="field-agents/tasks" element={<Suspense fallback={<PageLoader />}><TaskPage /></Suspense>} />

            {/* Business Routes */}
            <Route path="customers" element={<Suspense fallback={<PageLoader />}><CustomersPage /></Suspense>} />
            <Route path="customers/dashboard" element={<Suspense fallback={<PageLoader />}><CustomerDashboard /></Suspense>} />
            <Route path="customers/create" element={<Suspense fallback={<PageLoader />}><CustomerCreatePage /></Suspense>} />
            <Route path="customers/:id" element={<Suspense fallback={<PageLoader />}><CustomerDetailsPage /></Suspense>} />
            <Route path="customers/:id/edit" element={<Suspense fallback={<PageLoader />}><CustomerEditPage /></Suspense>} />
            <Route path="customers/:id/orders" element={<Suspense fallback={<PageLoader />}><CustomerOrders /></Suspense>} />
            <Route path="customers/:id/visits" element={<Suspense fallback={<PageLoader />}><CustomerVisits /></Suspense>} />
            <Route path="customers/:id/payments" element={<Suspense fallback={<PageLoader />}><CustomerPayments /></Suspense>} />
            <Route path="customers/:id/surveys" element={<Suspense fallback={<PageLoader />}><CustomerSurveys /></Suspense>} />
            <Route path="customers/:id/kyc" element={<Suspense fallback={<PageLoader />}><CustomerKYC /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>} />
            <Route path="orders/dashboard" element={<Suspense fallback={<PageLoader />}><OrderDashboard /></Suspense>} />
            <Route path="orders/pipeline" element={<Suspense fallback={<PageLoader />}><OrderPipelinePage /></Suspense>} />
            <Route path="orders/workflow" element={<Suspense fallback={<PageLoader />}><WorkflowDashboardPage /></Suspense>} />
            <Route path="orders/create" element={<Suspense fallback={<PageLoader />}><OrderCreatePage /></Suspense>} />
            <Route path="orders/:id" element={<Suspense fallback={<PageLoader />}><OrderDetailsPage /></Suspense>} />
            <Route path="orders/:id/edit" element={<Suspense fallback={<PageLoader />}><OrderEditPage /></Suspense>} />
            <Route path="orders/:id/items" element={<Suspense fallback={<PageLoader />}><OrderItems /></Suspense>} />
            <Route path="orders/:id/payments" element={<Suspense fallback={<PageLoader />}><OrderPayments /></Suspense>} />
            <Route path="orders/:id/delivery" element={<Suspense fallback={<PageLoader />}><OrderDelivery /></Suspense>} />
            <Route path="orders/:id/returns" element={<Suspense fallback={<PageLoader />}><OrderReturns /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
            <Route path="products/create" element={<Suspense fallback={<PageLoader />}><ProductCreatePage /></Suspense>} />
            <Route path="products/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailsPage /></Suspense>} />
            <Route path="products/:id/edit" element={<Suspense fallback={<PageLoader />}><ProductEditPage /></Suspense>} />
            <Route path="products/:id/inventory" element={<Suspense fallback={<PageLoader />}><ProductInventory /></Suspense>} />
            <Route path="products/:id/pricing" element={<Suspense fallback={<PageLoader />}><ProductPricing /></Suspense>} />
            <Route path="products/:id/promotions" element={<Suspense fallback={<PageLoader />}><ProductPromotions /></Suspense>} />
            <Route path="products/:id/sales" element={<Suspense fallback={<PageLoader />}><ProductSales /></Suspense>} />
            <Route path="brands" element={<Suspense fallback={<PageLoader />}><BrandsList /></Suspense>} />
            <Route path="brands/create" element={<Suspense fallback={<PageLoader />}><BrandCreate /></Suspense>} />
            <Route path="brands/:id" element={<Suspense fallback={<PageLoader />}><BrandDetail /></Suspense>} />
            <Route path="brands/:id/edit" element={<Suspense fallback={<PageLoader />}><BrandEdit /></Suspense>} />
            <Route path="brands/:id/surveys" element={<Suspense fallback={<PageLoader />}><BrandSurveys /></Suspense>} />
            <Route path="brands/:id/activations" element={<Suspense fallback={<PageLoader />}><BrandActivations /></Suspense>} />
            <Route path="brands/:id/boards" element={<Suspense fallback={<PageLoader />}><BrandBoards /></Suspense>} />
            <Route path="brands/:id/products" element={<Suspense fallback={<PageLoader />}><BrandProducts /></Suspense>} />
            
            {/* Customer Management Routes */}
            <Route path="customer-management/list" element={<Suspense fallback={<PageLoader />}><CustomerListPage /></Suspense>} />
            <Route path="customer-management/analytics" element={<Suspense fallback={<PageLoader />}><CustomerAnalyticsPage /></Suspense>} />
            <Route path="customer-management/credit" element={<Suspense fallback={<PageLoader />}><CustomerCreditManagementPage /></Suspense>} />
            <Route path="customer-management/hierarchy" element={<Suspense fallback={<PageLoader />}><CustomerHierarchyPage /></Suspense>} />
            <Route path="customer-management/import-export" element={<Suspense fallback={<PageLoader />}><CustomerImportExportPage /></Suspense>} />
            <Route path="customer-management/segmentation" element={<Suspense fallback={<PageLoader />}><CustomerSegmentationPage /></Suspense>} />
            <Route path="customer-management/visit-history" element={<Suspense fallback={<PageLoader />}><CustomerVisitHistoryPage /></Suspense>} />
            
            {/* Product Management Routes */}
            <Route path="product-management/list" element={<Suspense fallback={<PageLoader />}><ProductListPage /></Suspense>} />
            <Route path="product-management/analytics" element={<Suspense fallback={<PageLoader />}><ProductAnalyticsPage /></Suspense>} />
            <Route path="product-management/hierarchy" element={<Suspense fallback={<PageLoader />}><ProductHierarchyPage /></Suspense>} />
            <Route path="product-management/import-export" element={<Suspense fallback={<PageLoader />}><ProductImportExportPage /></Suspense>} />
            <Route path="product-management/inventory" element={<Suspense fallback={<PageLoader />}><ProductInventoryPage /></Suspense>} />
            <Route path="product-management/pricing" element={<Suspense fallback={<PageLoader />}><ProductPricingPage /></Suspense>} />
            
            {/* Order Lifecycle Routes */}
            <Route path="order-lifecycle/quotations" element={<Suspense fallback={<PageLoader />}><QuotationManagementPage /></Suspense>} />
            <Route path="order-lifecycle/quotation-approval" element={<Suspense fallback={<PageLoader />}><QuotationApprovalPage /></Suspense>} />
            <Route path="order-lifecycle/fulfillment" element={<Suspense fallback={<PageLoader />}><OrderFulfillmentPage /></Suspense>} />
            <Route path="order-lifecycle/delivery-tracking" element={<Suspense fallback={<PageLoader />}><DeliveryTrackingPage /></Suspense>} />
            <Route path="order-lifecycle/returns" element={<Suspense fallback={<PageLoader />}><ReturnManagementPage /></Suspense>} />
            <Route path="order-lifecycle/credit-notes" element={<Suspense fallback={<PageLoader />}><CreditNotesPage /></Suspense>} />
            <Route path="order-lifecycle/refunds" element={<Suspense fallback={<PageLoader />}><RefundProcessingPage /></Suspense>} />

            {/* Sales Routes */}
            <Route path="sales" element={<Suspense fallback={<PageLoader />}><SalesDashboard /></Suspense>} />
            <Route path="sales/orders" element={<Suspense fallback={<PageLoader />}><SalesOrdersList /></Suspense>} />
            <Route path="sales/orders/create" element={<Suspense fallback={<PageLoader />}><SalesOrderCreate /></Suspense>} />
            <Route path="sales/orders/:id" element={<Suspense fallback={<PageLoader />}><SalesOrderDetail /></Suspense>} />
            <Route path="sales/orders/:id/edit" element={<Suspense fallback={<PageLoader />}><SalesOrderEdit /></Suspense>} />
            <Route path="sales/invoices" element={<Suspense fallback={<PageLoader />}><InvoicesList /></Suspense>} />
            <Route path="sales/invoices/create" element={<Suspense fallback={<PageLoader />}><InvoiceCreate /></Suspense>} />
            <Route path="sales/invoices/:id" element={<Suspense fallback={<PageLoader />}><InvoiceDetail /></Suspense>} />
            <Route path="sales/payments" element={<Suspense fallback={<PageLoader />}><PaymentsList /></Suspense>} />
            <Route path="sales/payments/create" element={<Suspense fallback={<PageLoader />}><PaymentCreate /></Suspense>} />
            <Route path="sales/payments/:id" element={<Suspense fallback={<PageLoader />}><PaymentDetail /></Suspense>} />
            <Route path="sales/credit-notes" element={<Suspense fallback={<PageLoader />}><CreditNotesList /></Suspense>} />
            <Route path="sales/credit-notes/create" element={<Suspense fallback={<PageLoader />}><CreditNoteCreate /></Suspense>} />
            <Route path="sales/credit-notes/:id" element={<Suspense fallback={<PageLoader />}><CreditNoteDetail /></Suspense>} />
            <Route path="sales/returns" element={<Suspense fallback={<PageLoader />}><SalesReturnsList /></Suspense>} />
            <Route path="sales/returns/create" element={<Suspense fallback={<PageLoader />}><SalesReturnCreate /></Suspense>} />
            <Route path="sales/returns/:id" element={<Suspense fallback={<PageLoader />}><SalesReturnDetail /></Suspense>} />

            {/* Marketing Routes */}
            <Route path="marketing/campaigns" element={<Suspense fallback={<PageLoader />}><CampaignsList /></Suspense>} />
            <Route path="marketing/campaigns/create" element={<Suspense fallback={<PageLoader />}><CampaignCreate /></Suspense>} />
            <Route path="marketing/campaigns/:id" element={<Suspense fallback={<PageLoader />}><CampaignDetail /></Suspense>} />
            <Route path="marketing/campaigns/:id/edit" element={<Suspense fallback={<PageLoader />}><CampaignEdit /></Suspense>} />
            <Route path="marketing/events" element={<Suspense fallback={<PageLoader />}><EventsList /></Suspense>} />
            <Route path="marketing/events/create" element={<Suspense fallback={<PageLoader />}><EventCreate /></Suspense>} />
            <Route path="marketing/events/:id" element={<Suspense fallback={<PageLoader />}><EventDetail /></Suspense>} />
            <Route path="marketing/events/:id/edit" element={<Suspense fallback={<PageLoader />}><EventEdit /></Suspense>} />
            <Route path="marketing/activations" element={<Suspense fallback={<PageLoader />}><ActivationsList /></Suspense>} />
            <Route path="marketing/activations/create" element={<Suspense fallback={<PageLoader />}><ActivationCreate /></Suspense>} />
            <Route path="marketing/activations/:id" element={<Suspense fallback={<PageLoader />}><ActivationDetail /></Suspense>} />
            <Route path="marketing/promotions" element={<Suspense fallback={<PageLoader />}><PromotionsList /></Suspense>} />
            <Route path="marketing/promotions/create" element={<Suspense fallback={<PageLoader />}><PromotionCreate /></Suspense>} />
            <Route path="marketing/promotions/:id" element={<Suspense fallback={<PageLoader />}><PromotionDetail /></Suspense>} />

            {/* CRM Routes */}
            <Route path="crm/customers" element={<Suspense fallback={<PageLoader />}><CustomersList /></Suspense>} />
            <Route path="crm/customers/create" element={<Suspense fallback={<PageLoader />}><CRMCustomerCreate /></Suspense>} />
            <Route path="crm/customers/:id" element={<Suspense fallback={<PageLoader />}><CRMCustomerDetail /></Suspense>} />
            <Route path="crm/customers/:id/edit" element={<Suspense fallback={<PageLoader />}><CRMCustomerEdit /></Suspense>} />
            <Route path="crm/kyc-cases" element={<Suspense fallback={<PageLoader />}><KYCCasesList /></Suspense>} />
            <Route path="crm/kyc-cases/create" element={<Suspense fallback={<PageLoader />}><KYCCaseCreate /></Suspense>} />
            <Route path="crm/kyc-cases/:id" element={<Suspense fallback={<PageLoader />}><KYCCaseDetail /></Suspense>} />
            <Route path="crm/surveys" element={<Suspense fallback={<PageLoader />}><SurveysList /></Suspense>} />
            <Route path="crm/surveys/create" element={<Suspense fallback={<PageLoader />}><CRMSurveyCreate /></Suspense>} />
            <Route path="crm/surveys/:id" element={<Suspense fallback={<PageLoader />}><SurveyDetail /></Suspense>} />

            {/* Finance Routes */}
            <Route path="finance" element={<Suspense fallback={<PageLoader />}><FinanceDashboard /></Suspense>} />
            <Route path="finance/invoices" element={<Suspense fallback={<PageLoader />}><InvoiceManagementPage /></Suspense>} />
            <Route path="finance/invoices/create" element={<Suspense fallback={<PageLoader />}><FinanceInvoiceCreate /></Suspense>} />
            <Route path="finance/invoices/:id" element={<Suspense fallback={<PageLoader />}><FinanceInvoiceDetail /></Suspense>} />
            <Route path="finance/invoices/:id/edit" element={<Suspense fallback={<PageLoader />}><FinanceInvoiceEdit /></Suspense>} />
            <Route path="finance/invoices/:id/payments" element={<Suspense fallback={<PageLoader />}><InvoicePayments /></Suspense>} />
            <Route path="finance/invoices/:id/items" element={<Suspense fallback={<PageLoader />}><InvoiceItems /></Suspense>} />
            <Route path="finance/payments" element={<Suspense fallback={<PageLoader />}><PaymentCollectionPage /></Suspense>} />
            <Route path="finance/payments/create" element={<Suspense fallback={<PageLoader />}><FinancePaymentCreate /></Suspense>} />
            <Route path="finance/payments/:id" element={<Suspense fallback={<PageLoader />}><FinancePaymentDetail /></Suspense>} />
            <Route path="finance/payments/:id/edit" element={<Suspense fallback={<PageLoader />}><FinancePaymentEdit /></Suspense>} />
            <Route path="finance/cash-reconciliation" element={<Suspense fallback={<PageLoader />}><CashReconciliationList /></Suspense>} />
            <Route path="finance/cash-reconciliation/create" element={<Suspense fallback={<PageLoader />}><CashReconciliationCreate /></Suspense>} />
            <Route path="finance/cash-reconciliation/:id" element={<Suspense fallback={<PageLoader />}><CashReconciliationDetail /></Suspense>} />
            <Route path="finance/commission-payouts" element={<Suspense fallback={<PageLoader />}><CommissionPayoutsList /></Suspense>} />
            <Route path="finance/commission-payouts/:id" element={<Suspense fallback={<PageLoader />}><CommissionPayoutDetail /></Suspense>} />
            
            {/* Cash Reconciliation Routes */}
            <Route path="cash-reconciliation" element={<Suspense fallback={<PageLoader />}><CashSessionDashboardPage /></Suspense>} />
            <Route path="cash-reconciliation/start" element={<Suspense fallback={<PageLoader />}><StartCashSessionPage /></Suspense>} />
            <Route path="cash-reconciliation/close" element={<Suspense fallback={<PageLoader />}><CloseCashSessionPage /></Suspense>} />
            <Route path="cash-reconciliation/collection" element={<Suspense fallback={<PageLoader />}><CashCollectionPage /></Suspense>} />
            <Route path="cash-reconciliation/deposit" element={<Suspense fallback={<PageLoader />}><BankDepositPage /></Suspense>} />
            <Route path="cash-reconciliation/variance" element={<Suspense fallback={<PageLoader />}><VarianceApprovalPage /></Suspense>} />
            <Route path="cash-reconciliation/reports" element={<Suspense fallback={<PageLoader />}><CashReportsPage /></Suspense>} />
            <Route path="cash-reconciliation/sessions/:id" element={<Suspense fallback={<PageLoader />}><SessionDetail /></Suspense>} />
            <Route path="cash-reconciliation/sessions/:id/edit" element={<Suspense fallback={<PageLoader />}><SessionEdit /></Suspense>} />
            <Route path="cash-reconciliation/sessions/:id/collections" element={<Suspense fallback={<PageLoader />}><SessionCollections /></Suspense>} />
            <Route path="cash-reconciliation/sessions/:id/deposits" element={<Suspense fallback={<PageLoader />}><SessionDeposits /></Suspense>} />
            <Route path="cash-reconciliation/deposits/:id" element={<Suspense fallback={<PageLoader />}><DepositDetail /></Suspense>} />
            <Route path="cash-reconciliation/deposits/:id/edit" element={<Suspense fallback={<PageLoader />}><DepositEdit /></Suspense>} />
            
            {/* Commission Routes */}
            <Route path="commissions" element={<Suspense fallback={<PageLoader />}><CommissionDashboardPage /></Suspense>} />
            <Route path="commissions/create" element={<Suspense fallback={<PageLoader />}><CommissionCreate /></Suspense>} />
            <Route path="commissions/:id" element={<Suspense fallback={<PageLoader />}><CommissionDetail /></Suspense>} />
            <Route path="commissions/:id/edit" element={<Suspense fallback={<PageLoader />}><CommissionEdit /></Suspense>} />
            <Route path="commissions/calculation" element={<Suspense fallback={<PageLoader />}><CommissionCalculationPage /></Suspense>} />
            <Route path="commissions/approval" element={<Suspense fallback={<PageLoader />}><CommissionApprovalPage /></Suspense>} />
            <Route path="commissions/payment" element={<Suspense fallback={<PageLoader />}><CommissionPaymentPage /></Suspense>} />
            <Route path="commissions/reports" element={<Suspense fallback={<PageLoader />}><CommissionReportsPage /></Suspense>} />
            <Route path="commissions/settings" element={<Suspense fallback={<PageLoader />}><CommissionSettingsPage /></Suspense>} />
            <Route path="commissions/rules/create" element={<Suspense fallback={<PageLoader />}><RuleCreate /></Suspense>} />
            <Route path="commissions/rules/:id" element={<Suspense fallback={<PageLoader />}><RuleDetail /></Suspense>} />
            <Route path="commissions/rules/:id/edit" element={<Suspense fallback={<PageLoader />}><RuleEdit /></Suspense>} />
            <Route path="commissions/calculations/:id" element={<Suspense fallback={<PageLoader />}><CommissionCalculationDetail /></Suspense>} />

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
                            <AdminCampaignManagementPage />
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
            <Route path="admin/route-audit" element={
              <ProtectedRoute requiredRole="admin">
                <RouteAuditPage />
              </ProtectedRoute>
            } />
            <Route path="admin/price-lists" element={
              <ProtectedRoute requiredRole="admin">
                <PriceListManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/price-lists/:id" element={
              <ProtectedRoute requiredRole="admin">
                <PriceListEditPage />
              </ProtectedRoute>
            } />
            <Route path="admin/targets" element={
              <ProtectedRoute requiredRole="admin">
                <TargetManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/target-reporting" element={
              <ProtectedRoute requiredRole="admin">
                <TargetReportingPage />
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
    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#fff', color: '#1f2937', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontSize: '14px' } }} />
    </>
  )
}

export default App
