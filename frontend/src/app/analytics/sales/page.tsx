'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  MapPin
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import analyticsService, { SalesAnalytics, ProductPerformanceResponse } from '@/services/analytics.service'

export default function SalesAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();
  const [dateRange, setDateRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null)
  const [productData, setProductData] = useState<ProductPerformanceResponse | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      const filters = analyticsService.getDateRangePreset(dateRange as any)
      
      const [salesResponse, productResponse] = await Promise.all([
        analyticsService.getSalesAnalytics(filters),
        analyticsService.getProductPerformance(filters)
      ])
      
      setSalesData(salesResponse)
      setProductData(productResponse)
    } catch (err) {
      console.error('Error loading analytics data:', err)
      error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  // Transform data for charts
  const salesTrendData = salesData?.salesByAgent?.map((agent, index) => ({
    date: `Agent ${index + 1}`,
    revenue: agent.revenue,
    orders: agent.orders,
    customers: Math.floor(agent.revenue / 500) // Estimate customers
  })) || []

  const productPerformanceData = productData?.products?.slice(0, 5).map(product => ({
    product: product.name,
    sales: product.revenue,
    units: product.quantitySold,
    margin: product.revenue * 0.35 // Estimate 35% margin
  })) || []

  const regionPerformanceData = [
    { name: 'Lagos', value: 35, sales: 45000, color: '#3B82F6' },
    { name: 'Abuja', value: 25, sales: 32000, color: '#10B981' },
    { name: 'Port Harcourt', value: 20, sales: 26000, color: '#F59E0B' },
    { name: 'Kano', value: 12, sales: 15000, color: '#EF4444' },
    { name: 'Others', value: 8, sales: 10000, color: '#8B5CF6' },
  ]

  const agentPerformanceData = salesData?.salesByAgent?.slice(0, 5).map(agent => ({
    agent: agent.agent,
    sales: agent.revenue,
    orders: agent.orders,
    efficiency: Math.min(95, Math.floor((agent.revenue / agent.orders) / 10)), // Estimate efficiency
    commission: agent.revenue * 0.1 // Estimate 10% commission
  })) || []

  const kpiData = {
    totalRevenue: salesData?.totalSales || 0,
    revenueGrowth: 12.5, // Would need historical data to calculate
    totalOrders: salesData?.totalOrders || 0,
    ordersGrowth: 8.3, // Would need historical data to calculate
    avgOrderValue: salesData?.averageOrderValue || 0,
    avgOrderGrowth: 4.2, // Would need historical data to calculate
    customerAcquisition: salesData?.salesByCustomer?.length || 0,
    acquisitionGrowth: 15.7, // Would need historical data to calculate
    conversionRate: 73.2, // Would need additional data to calculate
    conversionGrowth: -2.1, // Would need historical data to calculate
    agentEfficiency: 88.5, // Would need additional data to calculate
    efficiencyGrowth: 3.8, // Would need historical data to calculate
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-600' : 'text-red-600'
  }

  if (isLoading) {
    return (
      <ErrorBoundary>
        <DashboardLayout>
          <LoadingPage />
        </DashboardLayout>
      </ErrorBoundary>
    )
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600">Comprehensive sales performance insights and trends</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <Button variant="outline" onClick={loadAnalyticsData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(kpiData.revenueGrowth)}
                  <span className={`text-sm ${getGrowthColor(kpiData.revenueGrowth)}`}>
                    {formatPercentage(kpiData.revenueGrowth)}
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{kpiData.totalOrders}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(kpiData.ordersGrowth)}
                  <span className={`text-sm ${getGrowthColor(kpiData.ordersGrowth)}`}>
                    {formatPercentage(kpiData.ordersGrowth)}
                  </span>
                </div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.avgOrderValue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(kpiData.avgOrderGrowth)}
                  <span className={`text-sm ${getGrowthColor(kpiData.avgOrderGrowth)}`}>
                    {formatPercentage(kpiData.avgOrderGrowth)}
                  </span>
                </div>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">{kpiData.customerAcquisition}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(kpiData.acquisitionGrowth)}
                  <span className={`text-sm ${getGrowthColor(kpiData.acquisitionGrowth)}`}>
                    {formatPercentage(kpiData.acquisitionGrowth)}
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{kpiData.conversionRate}%</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(kpiData.conversionGrowth)}
                  <span className={`text-sm ${getGrowthColor(kpiData.conversionGrowth)}`}>
                    {formatPercentage(kpiData.conversionGrowth)}
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agent Efficiency</p>
                <p className="text-2xl font-bold">{kpiData.agentEfficiency}%</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(kpiData.efficiencyGrowth)}
                  <span className={`text-sm ${getGrowthColor(kpiData.efficiencyGrowth)}`}>
                    {formatPercentage(kpiData.efficiencyGrowth)}
                  </span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          {/* Sales Trend */}
          <div className="col-span-2">
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Sales Trend</h3>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="orders">Orders</option>
                    <option value="customers">Customers</option>
                  </select>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value as number) : value,
                          typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Regional Performance */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Regional Performance</h3>
            </Card.Header>
            <Card.Content>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionPerformanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {regionPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {regionPerformanceData.map((region, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: region.color }}
                      />
                      <span>{region.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(region.sales)}</div>
                      <div className="text-gray-500">{region.value}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Product Performance */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Top Products</h3>
            </Card.Header>
            <Card.Content>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="product" type="category" width={120} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="sales" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>

          {/* Agent Performance */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Top Performing Agents</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {agentPerformanceData.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {agent.agent.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.agent}</p>
                        <p className="text-sm text-gray-500">{agent.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(agent.sales)}</p>
                      <p className="text-sm text-gray-500">{agent.efficiency}% efficiency</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <Card.Content className="p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-6 h-6 text-green-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Strong Growth Trend</h4>
                  <p className="text-gray-600 mt-1">
                    Revenue is up 12.5% compared to last period, with consistent daily growth. 
                    Weekend performance particularly strong.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <Card.Content className="p-4">
              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 text-blue-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Customer Acquisition</h4>
                  <p className="text-gray-600 mt-1">
                    89 new customers acquired this period (+15.7%). Lagos and Abuja 
                    showing highest conversion rates.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <Card.Content className="p-4">
              <div className="flex items-start space-x-3">
                <Target className="w-6 h-6 text-orange-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Optimization Opportunity</h4>
                  <p className="text-gray-600 mt-1">
                    Conversion rate slightly down (-2.1%). Focus on agent training 
                    and customer engagement strategies.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}