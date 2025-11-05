import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  UserCheck,
  DollarSign,
  Building2,
  Truck,
  Target,
  TrendingUp,
  Megaphone,
  FileText,
  Gift,
  CreditCard,
  MessageSquare,
  Route,
  Shield
} from 'lucide-react'
import { useAuthStore, hasPermission } from '../../store/auth.store'
import { PERMISSIONS } from '../../types/auth.types'
import { useModule } from '../../contexts/ModuleContext'
import ModuleSwitcher from './ModuleSwitcher'
import CollapsibleSection from './CollapsibleSection'
import type { ModuleType } from '../../contexts/ModuleContext'

const moduleNavigation: Record<ModuleType, any> = {
  operations: {
    workflows: [
      { name: 'Van Sales Workflow', href: '/van-sales/workflow', permission: PERMISSIONS.VIEW_VAN_SALES },
      { name: 'Agent Workflow', href: '/field-agents/workflow', permission: PERMISSIONS.VIEW_FIELD_OPERATIONS },
      { name: 'Stock Count Workflow', href: '/inventory/stock-count', permission: PERMISSIONS.VIEW_INVENTORY },
    ],
    transactions: [
      { name: 'Van Sales Orders', href: '/van-sales/management', permission: PERMISSIONS.MANAGE_VAN_SALES },
      { name: 'Field Visits', href: '/field-operations/visits', permission: PERMISSIONS.VIEW_FIELD_OPERATIONS },
      { name: 'Board Placements', href: '/field-operations/boards', permission: PERMISSIONS.MANAGE_BOARD_PLACEMENTS },
      { name: 'Product Distributions', href: '/field-operations/products', permission: PERMISSIONS.MANAGE_PRODUCT_DISTRIBUTION },
      { name: 'Inventory Management', href: '/inventory/management', permission: PERMISSIONS.MANAGE_INVENTORY },
    ],
    masters: [
      { name: 'Routes', href: '/van-sales/routes', permission: PERMISSIONS.MANAGE_ROUTES },
      { name: 'Field Agents', href: '/field-operations/agents', permission: PERMISSIONS.MANAGE_FIELD_AGENTS },
      { name: 'Products', href: '/products', permission: PERMISSIONS.VIEW_PRODUCTS },
    ],
    reports: [
      { name: 'Van Sales Dashboard', href: '/van-sales/dashboard', permission: PERMISSIONS.VIEW_VAN_SALES },
      { name: 'Field Operations Dashboard', href: '/field-operations/dashboard', permission: PERMISSIONS.VIEW_FIELD_OPERATIONS },
      { name: 'Live Mapping', href: '/field-operations/mapping', permission: PERMISSIONS.VIEW_AGENT_LOCATIONS },
      { name: 'Commission Tracking', href: '/field-operations/commission', permission: PERMISSIONS.VIEW_COMMISSIONS },
      { name: 'Inventory Reports', href: '/inventory/reports', permission: PERMISSIONS.VIEW_INVENTORY_REPORTS },
    ],
  },
  sales: {
    workflows: [],
    transactions: [
      { name: 'Orders', href: '/orders', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Invoices', href: '/finance/invoices', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Payments', href: '/finance/payments', permission: PERMISSIONS.VIEW_ORDERS },
    ],
    masters: [],
    reports: [
      { name: 'Sales Dashboard', href: '/sales/dashboard', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Order Analytics', href: '/orders/dashboard', permission: PERMISSIONS.VIEW_ORDERS },
    ],
  },
  marketing: {
    workflows: [
      { name: 'Activation Workflow', href: '/trade-marketing/activation', permission: PERMISSIONS.VIEW_TRADE_MARKETING },
    ],
    transactions: [
      { name: 'Trade Marketing', href: '/trade-marketing/promotions', permission: PERMISSIONS.MANAGE_PROMOTIONS },
      { name: 'Retailer Incentives', href: '/trade-marketing/incentives', permission: PERMISSIONS.MANAGE_INCENTIVES },
      { name: 'Promotions', href: '/promotions/management', permission: PERMISSIONS.MANAGE_PROMOTIONS },
      { name: 'Campaigns', href: '/campaigns/management', permission: PERMISSIONS.MANAGE_CAMPAIGNS },
    ],
    masters: [
      { name: 'Target Audiences', href: '/campaigns/audiences', permission: PERMISSIONS.MANAGE_AUDIENCES },
    ],
    reports: [
      { name: 'Market Analysis', href: '/trade-marketing/analysis', permission: PERMISSIONS.VIEW_MARKET_ANALYSIS },
      { name: 'Trade Spend', href: '/trade-marketing/spend', permission: PERMISSIONS.MANAGE_TRADE_SPEND },
      { name: 'Promotions Dashboard', href: '/promotions/dashboard', permission: PERMISSIONS.VIEW_PROMOTIONS },
      { name: 'Campaign Performance', href: '/campaigns/performance', permission: PERMISSIONS.VIEW_CAMPAIGN_PERFORMANCE },
      { name: 'A/B Testing', href: '/campaigns/testing', permission: PERMISSIONS.MANAGE_AB_TESTING },
    ],
  },
  crm: {
    workflows: [],
    transactions: [
      { name: 'Customers', href: '/customers', permission: PERMISSIONS.VIEW_CUSTOMERS },
      { name: 'KYC Cases', href: '/kyc/management', permission: PERMISSIONS.MANAGE_KYC },
      { name: 'Surveys', href: '/surveys/management', permission: PERMISSIONS.MANAGE_SURVEYS },
    ],
    masters: [],
    reports: [
      { name: 'Customer Dashboard', href: '/customers/dashboard', permission: PERMISSIONS.VIEW_CUSTOMERS },
      { name: 'KYC Dashboard', href: '/kyc/dashboard', permission: PERMISSIONS.VIEW_KYC },
      { name: 'KYC Reports', href: '/kyc/reports', permission: PERMISSIONS.VIEW_KYC_REPORTS },
      { name: 'Survey Dashboard', href: '/surveys/dashboard', permission: PERMISSIONS.VIEW_SURVEYS },
    ],
  },
  finance: {
    workflows: [],
    transactions: [
      { name: 'Commission Payouts', href: '/field-operations/commission', permission: PERMISSIONS.VIEW_COMMISSIONS },
    ],
    masters: [],
    reports: [
      { name: 'Finance Dashboard', href: '/finance/dashboard', permission: PERMISSIONS.VIEW_ANALYTICS },
    ],
  },
  admin: {
    workflows: [],
    transactions: [
      { name: 'User Management', href: '/admin/users', permission: PERMISSIONS.VIEW_USERS },
      { name: 'System Settings', href: '/admin/settings', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS },
    ],
    masters: [],
    reports: [
      { name: 'Admin Dashboard', href: '/admin/dashboard', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS },
      { name: 'Audit Logs', href: '/admin/audit', permission: PERMISSIONS.VIEW_AUDIT_LOGS },
      { name: 'SuperAdmin', href: '/superadmin/tenants', permission: null, requiresRole: 'superadmin' },
    ],
  },
}

const globalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const { currentModule, setCurrentModule } = useModule()

  const isNavItemVisible = (item: any) => {
    if (item.requiresRole && user?.role !== item.requiresRole) {
      return false
    }
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

  const renderNavLink = (item: any) => (
    <NavLink
      key={item.name}
      to={item.href}
      className={({ isActive }) =>
        `nav-link text-sm ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
      }
    >
      {item.name}
    </NavLink>
  )

  const currentModuleNav = moduleNavigation[currentModule]

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-primary-600">SS</span>
          </div>
          <span className="ml-2 text-xl font-bold text-white">SalesSync</span>
        </div>
      </div>

      {/* Module Switcher */}
      <div className="px-4 py-3 border-b border-gray-200">
        <ModuleSwitcher 
          currentModule={currentModule} 
          onModuleChange={setCurrentModule} 
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-2">
          {/* Global Navigation */}
          {globalNavigation.map((item) => {
            if (!isNavItemVisible(item)) return null

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            )
          })}

          {/* Module-specific Navigation */}
          {currentModuleNav && (
            <>
              {/* Workflows Section */}
              {currentModuleNav.workflows.length > 0 && (
                <CollapsibleSection title="Workflows" defaultExpanded={true}>
                  {currentModuleNav.workflows
                    .filter(isNavItemVisible)
                    .map(renderNavLink)}
                </CollapsibleSection>
              )}

              {/* Transactions Section */}
              {currentModuleNav.transactions.length > 0 && (
                <CollapsibleSection title="Transactions" defaultExpanded={false}>
                  {currentModuleNav.transactions
                    .filter(isNavItemVisible)
                    .map(renderNavLink)}
                </CollapsibleSection>
              )}

              {/* Masters/Setup Section */}
              {currentModuleNav.masters.length > 0 && (
                <CollapsibleSection title="Masters/Setup" defaultExpanded={false}>
                  {currentModuleNav.masters
                    .filter(isNavItemVisible)
                    .map(renderNavLink)}
                </CollapsibleSection>
              )}

              {/* Reports Section */}
              {currentModuleNav.reports.length > 0 && (
                <CollapsibleSection title="Reports" defaultExpanded={false}>
                  {currentModuleNav.reports
                    .filter(isNavItemVisible)
                    .map(renderNavLink)}
                </CollapsibleSection>
              )}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
