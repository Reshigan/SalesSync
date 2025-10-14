'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    // Get user data from localStorage or make API call
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SalesSync Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.firstName} {user.lastName}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken')
                  localStorage.removeItem('refreshToken')
                  localStorage.removeItem('user')
                  router.push('/login')
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">$12,345</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Agents</dt>
                      <dd className="text-lg font-medium text-gray-900">24</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📦</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Orders Today</dt>
                      <dd className="text-lg font-medium text-gray-900">156</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Welcome to SalesSync!</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Your enterprise field force management platform is ready. Explore the features:</p>
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-left transition-colors">
                    <h4 className="font-medium text-blue-900">Van Sales</h4>
                    <p className="text-sm text-blue-700 mt-1">Manage mobile sales operations</p>
                  </button>
                  <button className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-left transition-colors">
                    <h4 className="font-medium text-green-900">Field Agents</h4>
                    <p className="text-sm text-green-700 mt-1">Track and manage field teams</p>
                  </button>
                  <button className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-left transition-colors">
                    <h4 className="font-medium text-purple-900">Analytics</h4>
                    <p className="text-sm text-purple-700 mt-1">View performance insights</p>
                  </button>
                  <button className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg text-left transition-colors">
                    <h4 className="font-medium text-orange-900">Settings</h4>
                    <p className="text-sm text-orange-700 mt-1">Configure your platform</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}