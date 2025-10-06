'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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
  Filter
} from 'lucide-react'

interface AnalyticsData {
  totalSales: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  salesGrowth: number
  orderGrowth: number
  customerGrowth: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    growth: number
  }>
  salesByMonth: Array<{
    month: string
    sales: number
    orders: number
  }>
  topCustomers: Array<{
    id: string
    name: string
    totalSpent: number
    orders: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const tenantCode = localStorage.getItem('tenantCode') || 'DEMO'
      
      const response = await fetch(`http://localhost:3001/api/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Code': tenantCode,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mock data for development
      setData({
        totalSales: 125000,
        totalOrders: 1250,
        totalCustomers: 450,
        totalProducts: 89,
        salesGrowth: 12.5,
        orderGrowth: 8.3,
        customerGrowth: 15.2,
        topProducts: [
          { id: '1', name: 'Premium Cola 500ml', sales: 25000, growth: 15.2 },
          { id: '2', name: 'Premium Water 1L', sales: 18000, growth: 8.7 },
          { id: '3', name: 'Premium Juice 250ml', sales: 12000, growth: -2.1 },
        ],
        salesByMonth: [
          { month: 'Jan', sales: 45000, orders: 450 },
          { month: 'Feb', sales: 52000, orders: 520 },
          { month: 'Mar', sales: 48000, orders: 480 },
          { month: 'Apr', sales: 58000, orders: 580 },
          { month: 'May', sales: 62000, orders: 620 },
          { month: 'Jun', sales: 55000, orders: 550 },
        ],
        topCustomers: [
          { id: '1', name: 'ABC Store', totalSpent: 15000, orders: 45 },
          { id: '2', name: 'XYZ Supermarket', totalSpent: 12000, orders: 38 },
          { id: '3', name: 'Corner Shop', totalSpent: 8500, orders: 28 },
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
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(growth).toFixed(1)}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Failed to load analytics data</p>
        <Button onClick={fetchAnalyticsData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
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
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
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
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalSales)}</p>
              <div className="mt-1">{formatGrowth(data.salesGrowth)}</div>
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
              <p className="text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString()}</p>
              <div className="mt-1">{formatGrowth(data.orderGrowth)}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalCustomers.toLocaleString()}</p>
              <div className="mt-1">{formatGrowth(data.customerGrowth)}</div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalProducts.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Active products</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.salesByMonth.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">{formatCurrency(month.sales)}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(month.sales / Math.max(...data.salesByMonth.map(m => m.sales))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.sales)}</p>
                  <div className="text-xs">{formatGrowth(product.growth)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.orders}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(customer.totalSpent / customer.orders)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}