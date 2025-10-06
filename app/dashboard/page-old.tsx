'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  DollarSign, 
  ShoppingCart,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Truck,
  Warehouse,
  Calendar,
  Eye,
  MapPin,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  activeAgents: number
  totalCustomers: number
  totalProducts: number
  pendingOrders: number
  completedOrders: number
  todaysSales: number
  salesGrowth: number
  orderGrowth: number
  customerGrowth: number
  lowStockItems: number
  activeVans: number
  totalWarehouses: number
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
  recentActivities: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    user: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const tenantCode = localStorage.getItem('tenantCode') || 'DEMO'
      
      const response = await fetch('http://localhost:3001/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Code': tenantCode,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setStats(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mock data for development
      setStats({
        totalSales: 1250000,
        totalOrders: 2450,
        activeAgents: 25,
        totalCustomers: 850,
        totalProducts: 120,
        pendingOrders: 45,
        completedOrders: 2405,
        todaysSales: 45000,
        salesGrowth: 12.5,
        orderGrowth: 8.3,
        customerGrowth: 15.2,
        lowStockItems: 18,
        activeVans: 12,
        totalWarehouses: 3,
        topProducts: [
          { id: '1', name: 'Premium Cola 500ml', sales: 450, revenue: 33750 },
          { id: '2', name: 'Premium Water 1L', sales: 380, revenue: 22800 },
          { id: '3', name: 'Premium Juice 250ml', sales: 290, revenue: 21750 },
        ],
        recentOrders: [
          { id: '1', customerName: 'ABC Store', amount: 2500, status: 'completed', date: '2025-10-06T08:30:00Z' },
          { id: '2', customerName: 'XYZ Supermarket', amount: 1800, status: 'pending', date: '2025-10-06T07:45:00Z' },
          { id: '3', customerName: 'Corner Shop', amount: 950, status: 'processing', date: '2025-10-06T06:20:00Z' },
        ],
        recentActivities: [
          { id: '1', type: 'order', message: 'New order #ORD-2025-001 created', timestamp: '2025-10-06T09:15:00Z', user: 'John Smith' },
          { id: '2', type: 'stock', message: 'Low stock alert for Premium Cola 500ml', timestamp: '2025-10-06T08:45:00Z', user: 'System' },
          { id: '3', type: 'agent', message: 'Agent Sarah Johnson completed route', timestamp: '2025-10-06T08:30:00Z', user: 'Sarah Johnson' },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(growth).toFixed(1)}%
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completed', variant: 'success' as const },
      pending: { label: 'Pending', variant: 'warning' as const },
      processing: { label: 'Processing', variant: 'info' as const },
      cancelled: { label: 'Cancelled', variant: 'error' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      order: ShoppingCart,
      stock: Package,
      agent: Users,
      system: Activity
    }
    const Icon = icons[type as keyof typeof icons] || Activity
    return <Icon className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
              <div className="mt-1">{formatGrowth(stats.salesGrowth)}</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
              <div className="mt-1">{formatGrowth(stats.orderGrowth)}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAgents}</p>
              <p className="text-sm text-gray-500">Field agents</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
              <div className="mt-1">{formatGrowth(stats.customerGrowth)}</div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-lg font-semibold text-red-600">{stats.lowStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Vans</p>
              <p className="text-lg font-semibold text-gray-900">{stats.activeVans}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Warehouse className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Warehouses</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalWarehouses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-yellow-600">{stats.pendingOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-green-600">{stats.completedOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                  <div className="mt-1">{getOrderStatusBadge(order.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {stats.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500">{activity.user}</p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}