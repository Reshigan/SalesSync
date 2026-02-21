import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, Settings, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useDarkMode } from '../../hooks/useDarkMode'
import { apiClient } from '../../services/api.service'
import MegaMenu from './MegaMenu'

interface HeaderProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications?limit=5')
      const data = res.data?.data || res.data || []
      const items = Array.isArray(data) ? data : data.notifications || []
      setNotifications(items)
      setUnreadCount(items.filter((n: Notification) => !n.read).length)
    } catch {
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="sticky top-0 z-[1000] flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700" role="banner">
      {/* Mobile menu button */}
      <button
        type="button"
        className="px-4 border-r border-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden transition-colors"
        onClick={onMenuClick}
        data-tour="sidebar-toggle"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Logo on desktop */}
      <div className="hidden lg:flex items-center px-6 border-r border-gray-100 dark:border-gray-700">
        <img src="/salessync-logo.svg" alt="SalesSync" className="h-8" />
      </div>

      {/* Mega Menu - Desktop only */}
      <div data-tour="mega-menu">
        <MegaMenu />
      </div>

      <div className="flex-1 px-4 flex justify-end">
        {/* Search */}
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-600" data-tour="search">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <Search className="h-5 w-5" />
              </div>
              <form onSubmit={handleSearch} className="w-full">
                <input
                  id="search-field"
                  className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                  placeholder="Search customers, orders, products... (Ctrl+K)"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search across all modules"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <div className="relative" ref={notifRef} data-tour="notifications">
            <button
              type="button"
              className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                  <span className="text-[10px] font-medium text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-dropdown bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:outline-none overflow-hidden" role="menu" aria-label="Notifications">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:text-primary-500">Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`} role="menuitem">
                        <div className="font-medium">{notif.title}</div>
                        <div className="text-gray-500 dark:text-gray-400">{notif.message}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.created_at)}</div>
                      </div>
                    ))
                  )}
                  <div className="px-4 py-2 text-center border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => { setShowNotifications(false); navigate('/admin/audit-logs') }} className="text-sm text-primary-600 hover:text-primary-500">
                      View all notifications
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            type="button"
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            onClick={toggleDarkMode}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Profile dropdown */}
          <div className="ml-3 relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="h-9 w-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.first_name} {user?.last_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'User'}</div>
              </div>
            </button>

            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-dropdown bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:outline-none overflow-hidden" role="menu">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                    <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                    <div className="text-gray-500 dark:text-gray-400">{user?.email}</div>
                  </div>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                    <User className="mr-3 h-4 w-4" />
                    Profile Settings
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                    <Settings className="mr-3 h-4 w-4" />
                    Preferences
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
