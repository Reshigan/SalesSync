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

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_ANALYTICS,
  },
  {
    name: 'Van Sales',
    href: '/van-sales',
    icon: Truck,
    permission: PERMISSIONS.VIEW_VAN_SALES,
    children: [
      {
        name: 'Sales Workflow',
        href: '/van-sales/workflow',
        permission: PERMISSIONS.VIEW_VAN_SALES,
      },
      {
        name: 'Dashboard',
        href: '/van-sales/dashboard',
        permission: PERMISSIONS.VIEW_VAN_SALES,
      },
      {
        name: 'Management',
        href: '/van-sales/management',
        permission: PERMISSIONS.MANAGE_VAN_SALES,
      },
      {
        name: 'Route Management',
        href: '/van-sales/routes',
        permission: PERMISSIONS.MANAGE_ROUTES,
      },
      {
        name: 'Inventory Tracking',
        href: '/van-sales/inventory',
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
    ],
  },
  {
    name: 'Field Operations',
    href: '/field-operations',
    icon: Route,
    permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
    children: [
      {
        name: 'Agent Workflow',
        href: '/field-agents/workflow',
        permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
      },
      {
        name: 'Dashboard',
        href: '/field-operations/dashboard',
        permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
      },
      {
        name: 'Agent Management',
        href: '/field-operations/agents',
        permission: PERMISSIONS.MANAGE_FIELD_AGENTS,
      },
      {
        name: 'Visit Management',
        href: '/field-operations/visits',
        permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
      },
      {
        name: 'Live Mapping',
        href: '/field-operations/mapping',
        permission: PERMISSIONS.VIEW_AGENT_LOCATIONS,
      },
      {
        name: 'Board Placement',
        href: '/field-operations/boards',
        permission: PERMISSIONS.MANAGE_BOARD_PLACEMENTS,
      },
      {
        name: 'Product Distribution',
        href: '/field-operations/products',
        permission: PERMISSIONS.MANAGE_PRODUCT_DISTRIBUTION,
      },
      {
        name: 'Commission Tracking',
        href: '/field-operations/commission',
        permission: PERMISSIONS.VIEW_COMMISSIONS,
      },
    ],
  },
  {
    name: 'KYC Management',
    href: '/kyc',
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_KYC,
    children: [
      {
        name: 'Dashboard',
        href: '/kyc/dashboard',
        permission: PERMISSIONS.VIEW_KYC,
      },
      {
        name: 'Management',
        href: '/kyc/management',
        permission: PERMISSIONS.MANAGE_KYC,
      },
      {
        name: 'Reports',
        href: '/kyc/reports',
        permission: PERMISSIONS.VIEW_KYC_REPORTS,
      },
    ],
  },
  {
    name: 'Surveys',
    href: '/surveys',
    icon: MessageSquare,
    permission: PERMISSIONS.VIEW_SURVEYS,
    children: [
      {
        name: 'Dashboard',
        href: '/surveys/dashboard',
        permission: PERMISSIONS.VIEW_SURVEYS,
      },
      {
        name: 'Management',
        href: '/surveys/management',
        permission: PERMISSIONS.MANAGE_SURVEYS,
      },
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    permission: PERMISSIONS.VIEW_INVENTORY,
    children: [
      {
        name: 'Stock Count Workflow',
        href: '/inventory/stock-count',
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        name: 'Dashboard',
        href: '/inventory/dashboard',
        permission: PERMISSIONS.VIEW_INVENTORY,
      },
      {
        name: 'Management',
        href: '/inventory/management',
        permission: PERMISSIONS.MANAGE_INVENTORY,
      },
      {
        name: 'Reports',
        href: '/inventory/reports',
        permission: PERMISSIONS.VIEW_INVENTORY_REPORTS,
      },
    ],
  },
  {
    name: 'Promotions',
    href: '/promotions',
    icon: Gift,
    permission: PERMISSIONS.VIEW_PROMOTIONS,
    children: [
      {
        name: 'Dashboard',
        href: '/promotions/dashboard',
        permission: PERMISSIONS.VIEW_PROMOTIONS,
      },
      {
        name: 'Management',
        href: '/promotions/management',
        permission: PERMISSIONS.MANAGE_PROMOTIONS,
      },
    ],
  },
  {
    name: 'Trade Marketing',
    href: '/trade-marketing',
    icon: TrendingUp,
    permission: PERMISSIONS.VIEW_TRADE_MARKETING,
    children: [
      {
        name: 'Activation Workflow',
        href: '/trade-marketing/activation',
        permission: PERMISSIONS.VIEW_TRADE_MARKETING,
      },
      {
        name: 'Promotions',
        href: '/trade-marketing/promotions',
        permission: PERMISSIONS.MANAGE_PROMOTIONS,
      },
      {
        name: 'Retailer Incentives',
        href: '/trade-marketing/incentives',
        permission: PERMISSIONS.MANAGE_INCENTIVES,
      },
      {
        name: 'Market Analysis',
        href: '/trade-marketing/analysis',
        permission: PERMISSIONS.VIEW_MARKET_ANALYSIS,
      },
      {
        name: 'Trade Spend',
        href: '/trade-marketing/spend',
        permission: PERMISSIONS.MANAGE_TRADE_SPEND,
      },
    ],
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Megaphone,
    permission: PERMISSIONS.VIEW_CAMPAIGNS,
    children: [
      {
        name: 'Campaign Management',
        href: '/campaigns/management',
        permission: PERMISSIONS.MANAGE_CAMPAIGNS,
      },
      {
        name: 'Target Audiences',
        href: '/campaigns/audiences',
        permission: PERMISSIONS.MANAGE_AUDIENCES,
      },
      {
        name: 'Performance Tracking',
        href: '/campaigns/performance',
        permission: PERMISSIONS.VIEW_CAMPAIGN_PERFORMANCE,
      },
      {
        name: 'A/B Testing',
        href: '/campaigns/testing',
        permission: PERMISSIONS.MANAGE_AB_TESTING,
      },
    ],
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_ANALYTICS,
    children: [
      {
        name: 'Dashboard',
        href: '/finance/dashboard',
        permission: PERMISSIONS.VIEW_ANALYTICS,
      },
      {
        name: 'Invoices',
        href: '/finance/invoices',
        permission: PERMISSIONS.VIEW_ORDERS,
      },
      {
        name: 'Payments',
        href: '/finance/payments',
        permission: PERMISSIONS.VIEW_ORDERS,
      },
    ],
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: TrendingUp,
    permission: PERMISSIONS.VIEW_ORDERS,
    children: [
      {
        name: 'Dashboard',
        href: '/sales/dashboard',
        permission: PERMISSIONS.VIEW_ORDERS,
      },
      {
        name: 'Orders',
        href: '/orders',
        permission: PERMISSIONS.VIEW_ORDERS,
      },
      {
        name: 'Order Analytics',
        href: '/orders/dashboard',
        permission: PERMISSIONS.VIEW_ORDERS,
      },
    ],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Building2,
    permission: PERMISSIONS.VIEW_CUSTOMERS,
    children: [
      {
        name: 'Dashboard',
        href: '/customers/dashboard',
        permission: PERMISSIONS.VIEW_CUSTOMERS,
      },
      {
        name: 'All Customers',
        href: '/customers',
        permission: PERMISSIONS.VIEW_CUSTOMERS,
      },
    ],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    permission: PERMISSIONS.VIEW_PRODUCTS,
  },
  {
    name: 'SuperAdmin',
    href: '/superadmin/tenants',
    icon: Shield,
    permission: null, // We'll check role directly in the component
    requiresRole: 'superadmin',
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Settings,
    permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    children: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
      },
      {
        name: 'User Management',
        href: '/admin/users',
        permission: PERMISSIONS.VIEW_USERS,
      },
      {
        name: 'System Settings',
        href: '/admin/settings',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit',
        permission: PERMISSIONS.VIEW_AUDIT_LOGS,
      },
    ],
  },
]

export default function Sidebar() {
  const { user } = useAuthStore()

  const isNavItemVisible = (item: any) => {
    // Check if item requires specific role
    if (item.requiresRole && user?.role !== item.requiresRole) {
      return false
    }
    // Check permission
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

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

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            if (!isNavItemVisible(item)) return null

            return (
              <div key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>

                {/* Sub-navigation */}
                {item.children && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      if (!isNavItemVisible(child)) return null

                      return (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) =>
                            `nav-link text-sm ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                          }
                        >
                          {child.name}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
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
