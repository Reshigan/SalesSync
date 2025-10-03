'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePermissions } from '@/hooks/usePermissions'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GlobalSearch } from '@/components/GlobalSearch'
import { 
  LayoutDashboard,
  Truck,
  Users,
  Package,
  ShoppingBag,
  Megaphone,
  Eye,
  Briefcase,
  Warehouse,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  MapPin,
  Route,
  Building,
  User
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string | number
  children?: NavigationItem[]
}

interface Notification {
  id: string
  type: string
  message: string
  timestamp: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { 
    hasPermission, 
    userRole, 
    user,
    canAccessVanSales,
    canAccessPromotions,
    canAccessMerchandising,
    canAccessFieldAgents,
    canAccessWarehouse,
    canAccessBackOffice,
    canAccessAnalytics,
    canAccessAdmin
  } = usePermissions()
  
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Role-based navigation
  const getNavigationItems = (): NavigationItem[] => {
    const items: NavigationItem[] = []

    // Dashboard - always visible
    items.push({
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    })

    // Van Sales module
    if (canAccessVanSales()) {
      items.push({
        name: 'Van Sales',
        href: '/van-sales',
        icon: Truck,
        badge: '12 active',
        children: [
          { name: 'Load Management', href: '/van-sales/loading', icon: Package },
          { name: 'Route Planning', href: '/van-sales/routes', icon: LayoutDashboard },
          { name: 'Reconciliation', href: '/van-sales/reconciliation', icon: FileText },
          { name: 'Cash Management', href: '/van-sales/cash', icon: ShoppingBag },
        ],
      })
    }

    // Promoter module
    if (canAccessPromotions()) {
      items.push({
        name: 'Promotions',
        href: '/promotions',
        icon: Megaphone,
        badge: '3 active',
        children: [
          { name: 'Campaigns', href: '/promotions/campaigns', icon: Megaphone },
          { name: 'Activities', href: '/promotions/activities', icon: Users },
          { name: 'Surveys', href: '/promotions/surveys', icon: FileText },
          { name: 'Materials', href: '/promotions/materials', icon: Package },
        ],
      })
    }

    // Merchandiser module
    if (canAccessMerchandising()) {
      items.push({
        name: 'Merchandising',
        href: '/merchandising',
        icon: Eye,
        children: [
          { name: 'Store Visits', href: '/merchandising/visits', icon: Eye },
          { name: 'Shelf Analysis', href: '/merchandising/shelf', icon: BarChart3 },
          { name: 'Planograms', href: '/merchandising/planograms', icon: LayoutDashboard },
          { name: 'Competitor Intel', href: '/merchandising/competitors', icon: Users },
        ],
      })
    }

    // Field Agent module
    if (canAccessFieldAgents()) {
      items.push({
        name: 'Field Agents',
        href: '/field-agents',
        icon: Briefcase,
        children: [
          { name: 'Board Placement', href: '/field-agents/boards', icon: Package },
          { name: 'SIM Distribution', href: '/field-agents/sims', icon: ShoppingBag },
          { name: 'Digital Vouchers', href: '/field-agents/vouchers', icon: FileText },
          { name: 'Area Mapping', href: '/field-agents/mapping', icon: LayoutDashboard },
        ],
      })
    }

    // Warehouse module
    if (canAccessWarehouse()) {
      items.push({
        name: 'Warehouse',
        href: '/warehouse',
        icon: Warehouse,
        badge: notifications.filter(n => n.type === 'stock').length || undefined,
        children: [
          { name: 'Inventory', href: '/warehouse/inventory', icon: Package },
          { name: 'Purchases', href: '/warehouse/purchases', icon: ShoppingBag },
          { name: 'Stock Movements', href: '/warehouse/movements', icon: Truck },
          { name: 'Stock Counts', href: '/warehouse/counts', icon: FileText },
        ],
      })
    }

    // Back Office
    if (canAccessBackOffice()) {
      items.push({
        name: 'Back Office',
        href: '/back-office',
        icon: FileText,
        children: [
          { name: 'Orders', href: '/back-office/orders', icon: ShoppingBag },
          { name: 'Invoicing', href: '/back-office/invoices', icon: FileText },
          { name: 'Payments', href: '/back-office/payments', icon: ShoppingBag },
          { name: 'Returns', href: '/back-office/returns', icon: Package },
        ],
      })
    }

    // Analytics
    if (canAccessAnalytics()) {
      items.push({
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        children: [
          { name: 'Sales Dashboard', href: '/analytics/sales', icon: BarChart3 },
          { name: 'AI Insights', href: '/analytics/ai-insights', icon: BarChart3 },
          { name: 'Predictions', href: '/analytics/predictions', icon: BarChart3 },
          { name: 'Custom Reports', href: '/analytics/custom', icon: FileText },
        ],
      })
    }

    // Admin sections
    if (canAccessAdmin()) {
      items.push({
        name: 'Administration',
        href: '/admin',
        icon: Shield,
        children: [
          { name: 'Users', href: '/admin/users', icon: Users },
          { name: 'Roles', href: '/admin/roles', icon: Shield },
          { name: 'Permissions', href: '/admin/permissions', icon: Shield },
          { name: 'Areas', href: '/admin/areas', icon: MapPin },
          { name: 'Routes', href: '/admin/routes', icon: Route },
          { name: 'Agents', href: '/admin/agents', icon: Users },
          { name: 'Warehouses', href: '/admin/warehouses', icon: Warehouse },
          { name: 'Suppliers', href: '/admin/suppliers', icon: Building },
          { name: 'Commissions', href: '/admin/commissions', icon: ShoppingBag },
        ],
      })
    }

    // Settings - always visible
    items.push({
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    })

    return items
  }

  const navigation = getNavigationItems()

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const hasActiveChild = (item: NavigationItem) => {
    if (!item.children) return false
    return item.children.some(child => isActiveRoute(child.href))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-200 shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">SalesSync</h1>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group ${
                  isActiveRoute(item.href) || hasActiveChild(item)
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full ml-2">
                        {item.badge}
                      </span>
                    )}
                    {item.children && (
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${
                        hasActiveChild(item) ? 'rotate-180' : ''
                      }`} />
                    )}
                  </>
                )}
              </Link>
              
              {/* Children */}
              {!collapsed && item.children && (hasActiveChild(item) || isActiveRoute(item.href)) && (
                <div className="mt-1 ml-8 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActiveRoute(child.href)
                          ? 'text-primary-700 bg-primary-50 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <child.icon className="w-4 h-4 mr-2" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className={`${collapsed ? 'pl-16' : 'pl-64'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <GlobalSearch />
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationCenter />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ')}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        // Handle logout
                        console.log('Logout clicked')
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  )
}