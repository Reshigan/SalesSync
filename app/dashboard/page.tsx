'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { 
  TrendingUp, 
  Users, 
  Package, 
  MapPin, 
  DollarSign, 
  ShoppingCart,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { usePWA } from '@/components/providers/PWAProvider'
import { useNotifications } from '@/components/providers/NotificationProvider'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  activeAgents: number
  totalCustomers: number
  totalProducts: number
  pendingOrders: number
  completedOrders: number
  todaysSales: number
  monthlyGrowth: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  recentOrders: Array<{
    id: string
    customerName: string
    amount: number
    status: string
    date: string
  }>
  agentPerformance: Array<{
    id: string
    name: string
    sales: number
    orders: number
    target: number
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { isInstallable, installApp } = usePWA()
  const { permission, requestPermission } = useNotifications()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        totalSales: 2847650,
        totalOrders: 1247,
        activeAgents: 23,
        totalCustomers: 892,
        totalProducts: 156,
        pendingOrders: 34,
        completedOrders: 1213,
        todaysSales: 125400,
        monthlyGrowth: 12.5,
        topProducts: [
          { id: '1', name: 'Premium Widget A', sales: 145, revenue: 87500 },
          { id: '2', name: 'Standard Widget B', sales: 98, revenue: 49000 },
          { id: '3', name: 'Deluxe Widget C', sales: 76, revenue: 68400 },
          { id: '4', name: 'Basic Widget D', sales: 65, revenue: 32500 },
          { id: '5', name: 'Pro Widget E', sales: 54, revenue: 48600 },
        ],
        recentOrders: [
          { id: 'ORD-001', customerName: 'Acme Corp', amount: 15600, status: 'completed', date: '2025-01-06' },
          { id: 'ORD-002', customerName: 'Tech Solutions', amount: 8900, status: 'pending', date: '2025-01-06' },
          { id: 'ORD-003', customerName: 'Global Industries', amount: 23400, status: 'completed', date: '2025-01-05' },
          { id: 'ORD-004', customerName: 'Local Business', amount: 5600, status: 'processing', date: '2025-01-05' },
          { id: 'ORD-005', customerName: 'Enterprise Ltd', amount: 34500, status: 'completed', date: '2025-01-04' },
        ],
        agentPerformance: [
          { id: '1', name: 'John Smith', sales: 145600, orders: 89, target: 150000 },
          { id: '2', name: 'Sarah Johnson', sales: 132400, orders: 76, target: 140000 },
          { id: '3', name: 'Mike Wilson', sales: 98700, orders: 65, target: 120000 },
          { id: '4', name: 'Lisa Brown', sales: 87300, orders: 54, target: 100000 },
          { id: '5', name: 'David Lee', sales: 76500, orders: 43, target: 90000 },
        ],
      })
      
      setIsLoading(false)
    }

    loadDashboardData()
  }, [selectedPeriod])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your sales today.
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* PWA Install Button */}
            {isInstallable && (
              <Button
                onClick={installApp}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Install App
              </Button>
            )}
            
            {/* Notification Permission */}
            {permission === 'default' && (
              <Button
                onClick={requestPermission}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Enable Notifications
              </Button>
            )}
            
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalSales)}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{stats.monthlyGrowth}% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.completedOrders} completed, {stats.pendingOrders} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAgents}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Field agents working today
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.todaysSales)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Target: {formatCurrency(150000)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Agent Performance</h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.agentPerformance.map((agent) => (
                  <div key={agent.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-600">{agent.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(agent.sales)}
                        </p>
                        <p className="text-sm text-gray-600">
                          of {formatCurrency(agent.target)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((agent.sales / agent.target) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{order.id}</td>
                      <td className="py-3 px-4 text-gray-900">{order.customerName}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {order.status === 'processing' && <Activity className="w-3 h-3 mr-1" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}