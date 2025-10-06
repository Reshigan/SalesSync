'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { apiClient, handleApiError } from '@/lib/api-client'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign,
  Package,
  Truck,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react'

interface AnalyticsData {
  // Overview metrics
  totalSales: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  
  // Growth metrics
  salesGrowth: number
  orderGrowth: number
  customerGrowth: number
  productGrowth: number
  
  // Performance metrics
  averageOrderValue: number
  conversionRate: number
  customerRetentionRate: number
  inventoryTurnover: number
  
  // Time-based data
  salesByMonth: Array<{
    month: string
    sales: number
    orders: number
    customers: number
  }>
  
  salesByWeek: Array<{
    week: string
    sales: number
    orders: number
  }>
  
  // Top performers
  topProducts: Array<{
    id: string
    name: string
    sku: string
    sales: number
    revenue: number
    growth: number
  }>
  
  topCustomers: Array<{
    id: string
    name: string
    code: string
    totalSpent: number
    orders: number
    lastOrder: string
  }>
  
  topAgents: Array<{
    id: string
    name: string
    sales: number
    orders: number
    customers: number
  }>
  
  // Category analysis
  salesByCategory: Array<{
    category: string
    sales: number
    percentage: number
  }>
  
  // Regional data
  salesByRegion: Array<{
    region: string
    sales: number
    orders: number
    growth: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data from multiple endpoints
      const [
        salesAnalytics,
        productAnalytics,
        customerAnalytics,
        performanceMetrics
      ] = await Promise.allSettled([
        apiClient.getSalesAnalytics({ period: dateRange }),
        apiClient.getProductAnalytics({ period: dateRange }),
        apiClient.getCustomerAnalytics({ period: dateRange }),
        apiClient.getPerformanceMetrics({ period: dateRange })
      ])

      // Combine the analytics data
      const analyticsData: AnalyticsData = {
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        salesGrowth: 0,
        orderGrowth: 0,
        customerGrowth: 0,
        productGrowth: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        customerRetentionRate: 0,
        inventoryTurnover: 0,
        salesByMonth: [],
        salesByWeek: [],
        topProducts: [],
        topCustomers: [],
        topAgents: [],
        salesByCategory: [],
        salesByRegion: []
      }

      // Process sales analytics
      if (salesAnalytics.status === 'fulfilled') {
        const salesData = salesAnalytics.value as any
        analyticsData.totalSales = salesData?.totalSales || 0
        analyticsData.totalOrders = salesData?.totalOrders || 0
        analyticsData.salesGrowth = salesData?.salesGrowth || 0
        analyticsData.orderGrowth = salesData?.orderGrowth || 0
        analyticsData.salesByMonth = salesData?.salesByMonth || []
        analyticsData.salesByWeek = salesData?.salesByWeek || []
        analyticsData.salesByRegion = salesData?.salesByRegion || []
      }

      // Process product analytics
      if (productAnalytics.status === 'fulfilled') {
        const productData = productAnalytics.value as any
        analyticsData.totalProducts = productData?.totalProducts || 0
        analyticsData.topProducts = productData?.topProducts || []
        analyticsData.salesByCategory = productData?.salesByCategory || []
        analyticsData.inventoryTurnover = productData?.inventoryTurnover || 0
      }

      // Process customer analytics
      if (customerAnalytics.status === 'fulfilled') {
        const customerData = customerAnalytics.value as any
        analyticsData.totalCustomers = customerData?.totalCustomers || 0
        analyticsData.customerGrowth = customerData?.customerGrowth || 0
        analyticsData.topCustomers = customerData?.topCustomers || []
        analyticsData.customerRetentionRate = customerData?.retentionRate || 0
      }

      // Process performance metrics
      if (performanceMetrics.status === 'fulfilled') {
        const performanceData = performanceMetrics.value as any
        analyticsData.averageOrderValue = performanceData?.averageOrderValue || 0
        analyticsData.conversionRate = performanceData?.conversionRate || 0
        analyticsData.topAgents = performanceData?.topAgents || []
      }

      setData(analyticsData)
    } catch (error) {
      handleApiError(error, 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analytics data</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Business intelligence and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.totalSales)}
              </p>
              <div className="flex items-center mt-2">
                {data.salesGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${data.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(data.salesGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
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
              <p className="text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {data.orderGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${data.orderGrowth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatPercentage(data.orderGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalCustomers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {data.customerGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${data.customerGrowth >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {formatPercentage(data.customerGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
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
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.averageOrderValue)}
              </p>
              <div className="flex items-center mt-2">
                <Target className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">
                  {data.conversionRate.toFixed(1)}% conversion
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Customer Retention</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data.customerRetentionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Customers returning</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Inventory Turnover</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data.inventoryTurnover.toFixed(1)}x
            </div>
            <p className="text-sm text-gray-600">Times per year</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Conversion Rate</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data.conversionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Visitors to customers</p>
          </div>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-gray-500">{product.sales} sold</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Customers</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-xs text-gray-500">{customer.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sales by Category */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Sales by Category</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.salesByCategory.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index % 5]}-500`} />
                  <span className="text-sm">{category.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{formatCurrency(category.sales)}</span>
                  <span className="text-xs text-gray-500 ml-2">({category.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Agents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Agents</h3>
            <Truck className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.topAgents.slice(0, 5).map((agent, index) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.customers} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCurrency(agent.sales)}</p>
                  <p className="text-xs text-gray-500">{agent.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Reports</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Sales Report
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Customer Report
          </Button>
          <Button variant="outline" className="justify-start">
            <Package className="h-4 w-4 mr-2" />
            Inventory Report
          </Button>
          <Button variant="outline" className="justify-start">
            <Truck className="h-4 w-4 mr-2" />
            Agent Performance
          </Button>
        </div>
      </Card>
    </div>
  )
}