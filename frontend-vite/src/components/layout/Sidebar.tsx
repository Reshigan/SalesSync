import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore, hasPermission } from '../../store/auth.store'
import { navigationByCategory } from '../../config/navigation'
import type { NavigationItem, NavigationChild } from '../../config/navigation'
import { ChevronDown } from 'lucide-react'

interface SidebarProps {
  onNavigate?: () => void
}

const categoryOrder = ['Core', 'Sales', 'Operations', 'Finance', 'Marketing', 'Compliance', 'System'] as const

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { user } = useAuthStore()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const isNavItemVisible = (item: NavigationItem) => {
    if (item.requiresRole && user?.role !== item.requiresRole) return false
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const isItemActive = (item: NavigationItem) => {
    if (location.pathname === item.href || location.pathname.startsWith(item.href + '/')) return true
    if (item.children?.some((c: NavigationChild) => location.pathname === c.href || location.pathname.startsWith(c.href + '/'))) return true
    return false
  }

  const isExpanded = (item: NavigationItem) => {
    return expandedItems.has(item.name) || isItemActive(item)
  }

  const renderGroupedChildren = (children: NavigationChild[]) => {
    const groups: Record<string, NavigationChild[]> = {}
    const ungrouped: NavigationChild[] = []
    children.forEach(child => {
      if (child.permission && !hasPermission(child.permission)) return
      if (child.group) {
        if (!groups[child.group]) groups[child.group] = []
        groups[child.group].push(child)
      } else {
        ungrouped.push(child)
      }
    })

    const hasGroups = Object.keys(groups).length > 0

    return (
      <>
        {ungrouped.map(child => (
          <NavLink key={child.href} to={child.href} onClick={onNavigate}
            className={({ isActive }) => `block px-3 py-1.5 text-xs rounded-md transition-colors ${isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            {child.name}
          </NavLink>
        ))}
        {hasGroups && Object.entries(groups).map(([groupName, groupChildren]) => (
          <div key={groupName}>
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{groupName}</div>
            {groupChildren.map(child => (
              <NavLink key={child.href} to={child.href} onClick={onNavigate}
                className={({ isActive }) => `block px-3 py-1.5 text-xs rounded-md transition-colors ${isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                {child.name}
              </NavLink>
            ))}
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-100">
      <div className="flex items-center h-14 flex-shrink-0 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <img src="/salessync-logo.svg" alt="SalesSync" className="h-8 brightness-0 invert" />
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
        <nav className="flex-1 px-2 py-3">
          {categoryOrder.map(category => {
            const items = (navigationByCategory as Record<string, NavigationItem[]>)[category]
            if (!items || items.length === 0) return null
            const visibleItems = items.filter(isNavItemVisible)
            if (visibleItems.length === 0) return null

            return (
              <div key={category} className="mb-1">
                {category !== 'Core' && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{category}</div>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <div key={item.name}>
                      {item.children ? (
                        <button onClick={() => toggleExpand(item.name)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${isItemActive(item) ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <item.icon className="mr-2.5 h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{item.name}</span>
                          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded(item) ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <NavLink to={item.href} onClick={onNavigate}
                          className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <item.icon className="mr-2.5 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </NavLink>
                      )}
                      {item.children && isExpanded(item) && (
                        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                          {renderGroupedChildren(item.children)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="flex-shrink-0 flex border-t border-gray-100 p-3">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-700">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="ml-2.5">
              <p className="text-sm font-medium text-gray-700 leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
