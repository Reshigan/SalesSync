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
  Truck
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
    name: 'Field Agents',
    href: '/field-agents',
    icon: UserCheck,
    permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
    children: [
      {
        name: 'Live Mapping',
        href: '/field-agents/mapping',
        permission: PERMISSIONS.VIEW_AGENT_LOCATIONS,
      },
      {
        name: 'Board Placement',
        href: '/field-agents/boards',
        permission: PERMISSIONS.MANAGE_BOARD_PLACEMENTS,
      },
      {
        name: 'Product Distribution',
        href: '/field-agents/products',
        permission: PERMISSIONS.MANAGE_PRODUCT_DISTRIBUTION,
      },
      {
        name: 'Commission Tracking',
        href: '/field-agents/commission',
        permission: PERMISSIONS.VIEW_COMMISSIONS,
      },
    ],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Building2,
    permission: PERMISSIONS.VIEW_CUSTOMERS,
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    permission: PERMISSIONS.VIEW_ORDERS,
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    permission: PERMISSIONS.VIEW_PRODUCTS,
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Settings,
    permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    children: [
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