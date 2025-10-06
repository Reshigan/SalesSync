'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { apiClient, handleApiError } from '@/lib/api-client'
import Link from 'next/link'
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
  Activity,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  // Order stats
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  
  // Customer stats
  totalCustomers: number
  activeCustomers: number
  
  // Product stats
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  
  // Growth metrics
  salesGrowth?: number
  orderGrowth?: number
  customerGrowth?: number
  
  // Recent activity
  recentOrders?: Array<{
    id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  
  topProducts?: Array<{
    id: string
    name: string
    sku: string
    sales: number
    revenue: number
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch data from multiple endpoints
      const [orderStats, customerStats, productStats, inventoryStats] = await Promise.allSettled([
        apiClient.getOrderStats(),
        apiClient.getCustomers({ limit: 1 }), // Just to get total count
        apiClient.getProducts({ limit: 1 }), // Just to get total count
        apiClient.getInventory({ lowStock: true, limit: 1 }) // Just to get low stock count
      ])

      // Process the results
      const dashboardStats: DashboardStats = {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0
      }

      // Order stats
      if (orderStats.status === 'fulfilled') {
        dashboardStats.totalOrders = orderStats.value.totalOrders || 0
        dashboardStats.pendingOrders = orderStats.value.pendingOrders || 0
        dashboardStats.completedOrders = orderStats.value.completedOrders || 0
        dashboardStats.totalRevenue = orderStats.value.totalRevenue || 0
      }

      // Customer stats
      if (customerStats.status === 'fulfilled') {
        dashboardStats.totalCustomers = customerStats.value.pagination?.total || 0
        // Estimate active customers (this would need a separate API call in real implementation)
        dashboardStats.activeCustomers = Math.floor(dashboardStats.totalCustomers * 0.8)
      }

      // Product stats
      if (productStats.status === 'fulfilled') {
        dashboardStats.totalProducts = productStats.value.pagination?.total || 0
        // Estimate active products (this would need a separate API call in real implementation)
        dashboardStats.activeProducts = Math.floor(dashboardStats.totalProducts * 0.9)
      }

      // Inventory stats
      if (inventoryStats.status === 'fulfilled') {
        dashboardStats.lowStockProducts = inventoryStats.value.pagination?.total || 0
      }

      setStats(dashboardStats)
    } catch (error) {
      handleApiError(error, 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
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
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">+8.2%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">+15.3%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
              <div className="flex items-center mt-2">
                <Package className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">{stats.totalProducts} total</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <Badge variant="warning">{stats.pendingOrders}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <Badge variant="success">{stats.completedOrders}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Processing</span>
              </div>
              <Badge variant="info">{Math.max(0, stats.totalOrders - stats.pendingOrders - stats.completedOrders)}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Customer Status</h3>
            <Link href="/customers">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <Badge variant="success">{stats.activeCustomers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <Badge variant="info">{stats.totalCustomers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600">Growth Rate</span>
              </div>
              <Badge variant="default">+15.3%</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Inventory Status</h3>
            <Link href="/inventory">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Low Stock</span>
              </div>
              <Badge variant="error">{stats.lowStockProducts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">In Stock</span>
              </div>
              <Badge variant="success">{stats.activeProducts - stats.lowStockProducts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Warehouse className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Total Products</span>
              </div>
              <Badge variant="info">{stats.totalProducts}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/orders/create">
            <Button variant="outline" className="w-full justify-start">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
          <Link href="/customers/create">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
          <Link href="/products/create">
            <Button variant="outline" className="w-full justify-start">
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${order.totalAmount.toFixed(2)}</p>
                    <Badge variant="info" size="sm">{order.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent orders</p>
                <Link href="/orders/create">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create First Order
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
            <Link href="/products">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${product.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{product.sales} sold</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No product data available</p>
                <Link href="/products/create">
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Products
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">85%</p>
            <p className="text-sm text-gray-600">Order Fulfillment Rate</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">2.3</p>
            <p className="text-sm text-gray-600">Avg. Days to Delivery</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">92%</p>
            <p className="text-sm text-gray-600">Customer Satisfaction</p>
          </div>
        </div>
      </Card>
    </div>
  )
}