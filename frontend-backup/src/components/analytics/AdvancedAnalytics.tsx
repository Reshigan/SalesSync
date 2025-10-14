'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Truck
} from 'lucide-react'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    growth: number
    target: number
  }
  customers: {
    total: number
    new: number
    active: number
    retention: number
  }
  products: {
    totalSold: number
    topPerforming: Array<{
      id: string
      name: string
      sales: number
      revenue: number
    }>
    lowStock: Array<{
      id: string
      name: string
      stock: number
      reorderLevel: number
    }>
  }
  routes: {
    completed: number
    inProgress: number
    efficiency: number
    avgTimePerCustomer: number
  }
  agents: {
    total: number
    active: number
    topPerformers: Array<{
      id: string
      name: string
      sales: number
      customers: number
    }>
  }
}

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('today')
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<AnalyticsData>({
    revenue: {
      current: 45250.75,
      previous: 38900.50,
      growth: 16.3,
      target: 50000
    },
    customers: {
      total: 1247,
      new: 23,
      active: 892,
      retention: 87.5
    },
    products: {
      totalSold: 3456,
      topPerforming: [
        { id: '1', name: 'Premium Cola 500ml', sales: 245, revenue: 612.50 },
        { id: '2', name: 'Chocolate Bar 100g', sales: 189, revenue: 708.75 },
        { id: '3', name: 'Energy Drink 250ml', sales: 156, revenue: 780.00 }
      ],
      lowStock: [
        { id: '1', name: 'Premium Cola 500ml', stock: 12, reorderLevel: 50 },
        { id: '2', name: 'Snack Mix 200g', stock: 8, reorderLevel: 25 }
      ]
    },
    routes: {
      completed: 18,
      inProgress: 5,
      efficiency: 92.3,
      avgTimePerCustomer: 12.5
    },
    agents: {
      total: 25,
      active: 23,
      topPerformers: [
        { id: '1', name: 'John Smith', sales: 8750.25, customers: 45 },
        { id: '2', name: 'Sarah Johnson', sales: 7890.50, customers: 38 },
        { id: '3', name: 'Mike Wilson', sales: 7234.75, customers: 42 }
      ]
    }
  })

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    target,
    format = 'number'
  }: {
    title: string
    value: number
    change?: number
    icon: any
    color?: string
    target?: number
    format?: 'number' | 'currency' | 'percentage'
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `$${val.toLocaleString()}`
        case 'percentage':
          return `${val}%`
        default:
          return val.toLocaleString()
      }
    }

    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      red: 'bg-red-50 text-red-600 border-red-200'
    }

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatValue(value)}</h3>
          <p className="text-sm text-gray-600">{title}</p>
          {target && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress to target</span>
                <span>{Math.round((value / target) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (value / target) >= 0.9 ? 'bg-green-500' : 
                    (value / target) >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const TopPerformersCard = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Performing Agents</h3>
        <Award className="w-5 h-5 text-yellow-500" />
      </div>
      <div className="space-y-4">
        {data.agents.topPerformers.map((agent, index) => (
          <div key={agent.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {index + 1}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{agent.name}</p>
                <p className="text-sm text-gray-600">{agent.customers} customers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">${agent.sales.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ProductInsightsCard = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Insights</h3>
        <Package className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Top Selling Products</h4>
          <div className="space-y-3">
            {data.products.topPerforming.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} units sold</p>
                </div>
                <p className="font-semibold text-green-600">${product.revenue}</p>
              </div>
            ))}
          </div>
        </div>

        {data.products.lowStock.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
              Low Stock Alerts
            </h4>
            <div className="space-y-2">
              {data.products.lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-red-600">Only {product.stock} left</p>
                  </div>
                  <button className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg">
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const RouteEfficiencyCard = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Route Efficiency</h3>
        <Truck className="w-5 h-5 text-green-500" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.routes.completed}</div>
          <div className="text-sm text-gray-600">Completed Routes</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.routes.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Route Efficiency</span>
          <span className="font-semibold text-green-600">{data.routes.efficiency}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 bg-green-500 rounded-full" 
            style={{ width: `${data.routes.efficiency}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <span className="text-gray-600">Avg. Time per Customer</span>
          <span className="font-semibold text-gray-900">{data.routes.avgTimePerCustomer} min</span>
        </div>
      </div>
    </div>
  )

  const RealtimeUpdates = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
        <div className="flex items-center text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          <span className="text-sm">Live</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Order #1234 completed</p>
            <p className="text-sm text-gray-600">John Smith - ABC Store - $125.50</p>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Route started</p>
            <p className="text-sm text-gray-600">Sarah Johnson - Downtown Circuit</p>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Low stock alert</p>
            <p className="text-sm text-gray-600">Premium Cola 500ml - 12 units left</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          
          <button 
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={data.revenue.current}
          change={data.revenue.growth}
          target={data.revenue.target}
          icon={DollarSign}
          color="green"
          format="currency"
        />
        <MetricCard
          title="Active Customers"
          value={data.customers.active}
          change={5.2}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Products Sold"
          value={data.products.totalSold}
          change={12.8}
          icon={Package}
          color="purple"
        />
        <MetricCard
          title="Route Efficiency"
          value={data.routes.efficiency}
          change={3.1}
          icon={Target}
          color="orange"
          format="percentage"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <TopPerformersCard />
        <ProductInsightsCard />
        <RouteEfficiencyCard />
      </div>

      {/* Real-time Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeUpdates />
        
        {/* Customer Insights */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.customers.total}</div>
              <div className="text-sm text-gray-600">Total Customers</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.customers.new}</div>
              <div className="text-sm text-gray-600">New This {timeRange}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Customer Retention</span>
              <span className="font-semibold text-green-600">{data.customers.retention}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{ width: `${data.customers.retention}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}