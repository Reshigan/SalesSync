import { NavLink } from 'react-router-dom'
import { useAuthStore, hasPermission } from '../../store/auth.store'
import { navigation } from '../../config/navigation'
import type { NavigationItem } from '../../config/navigation'

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { user } = useAuthStore()

  const isNavItemVisible = (item: NavigationItem) => {
    if (item.requiresRole && user?.role !== item.requiresRole) {
      return false
    }
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <img src="/salessync-logo.svg" alt="SalesSync" className="h-10 brightness-0 invert" />
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
                  onClick={onNavigate}
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
                      if (child.permission && !hasPermission(child.permission)) return null

                      return (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          onClick={onNavigate}
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
