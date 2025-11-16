import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import OfflineIndicator from '../ui/OfflineIndicator'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col max-w-xs w-full bg-white h-screen overflow-y-auto">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar onNavigate={() => {}} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>

        {/* Footer with GONXT branding */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>A Product of</span>
                <a href="https://www.gonxt.tech" target="_blank" rel="noopener noreferrer">
                  <img src="/gonxt-logo.svg" alt="GONXT" className="h-5" />
                </a>
              </div>
              <div className="text-sm text-gray-500">
                &copy; 2025 SalesSync by GONXT. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  )
}
