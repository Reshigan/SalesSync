'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TruckIcon,
  MapPinIcon,
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

export default function VanSalesDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const kpiCards = [
    {
      title: 'Total Sales',
      value: '$124,580',
      change: '+12.5%',
      icon: CurrencyDollarIcon,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Active Vans',
      value: '24',
      change: '+2',
      icon: TruckIcon,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Orders Today',
      value: '156',
      change: '+8.3%',
      icon: ShoppingBagIcon,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Customers',
      value: '2,847',
      change: '+15.2%',
      icon: UsersIcon,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
  ]

  const vanStatus = [
    { id: 'VAN-001', driver: 'John Smith', location: 'Downtown', status: 'Active', orders: 12, revenue: '$2,450' },
    { id: 'VAN-002', driver: 'Sarah Johnson', location: 'Uptown', status: 'Active', orders: 8, revenue: '$1,890' },
    { id: 'VAN-003', driver: 'Mike Wilson', location: 'Suburbs', status: 'Break', orders: 15, revenue: '$3,200' },
    { id: 'VAN-004', driver: 'Lisa Brown', location: 'Industrial', status: 'Active', orders: 6, revenue: '$1,340' },
  ]

  const recentOrders = [
    { id: '#ORD-001', customer: 'ABC Store', amount: '$245', status: 'Completed', time: '10:30 AM' },
    { id: '#ORD-002', customer: 'XYZ Market', amount: '$189', status: 'Pending', time: '11:15 AM' },
    { id: '#ORD-003', customer: 'Quick Shop', amount: '$567', status: 'Completed', time: '12:00 PM' },
    { id: '#ORD-004', customer: 'Corner Store', amount: '$123', status: 'Processing', time: '12:30 PM' },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <TruckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Van Sales Management</h1>
                <p className="text-sm text-gray-500">Enterprise Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <BellIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role || 'User'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-gray-600">Here's what's happening with your van sales today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.textColor}`} />
                </div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
              <p className="text-sm text-gray-600">{kpi.title}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Van Status</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {vanStatus.map((van, index) => (
                    <motion.div
                      key={van.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TruckIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{van.id}</p>
                          <p className="text-sm text-gray-600">{van.driver}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{van.location}</p>
                          <p className="text-xs text-gray-500">Location</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{van.orders}</p>
                          <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{van.revenue}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          van.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {van.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{order.amount}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            order.status === 'Completed' 
                              ? 'bg-emerald-500' 
                              : order.status === 'Pending'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}></span>
                          <span className="text-xs text-gray-500">{order.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors">
                    <ShoppingBagIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-blue-700">New Order</span>
                  </button>
                  <button className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-center transition-colors">
                    <UsersIcon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-emerald-700">Add Customer</span>
                  </button>
                  <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors">
                    <ChartBarIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-purple-700">Reports</span>
                  </button>
                  <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl text-center transition-colors">
                    <MapPinIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-orange-700">Routes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
