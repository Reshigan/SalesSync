import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  MapPin, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle,
  ShoppingCart,
  FileText,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Target,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  CalendarDays
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useAuthStore } from '../../store/auth.store'
import { analyticsService } from '../../services/analytics.service'
import { formatCurrency, formatNumber, formatDate } from '../../utils/format'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })
  const [chartPeriod, setChartPeriod] = useState('1M')
  const [showDatePicker, setShowDatePicker] = useState(false)

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-overview', dateRange],
    queryFn: () => analyticsService.getDashboardOverview(dateRange),
    staleTime: 1000 * 60 * 5,
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales-analytics', dateRange],
    queryFn: () => analyticsService.getSalesAnalytics(dateRange),
    staleTime: 1000 * 60 * 5,
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => analyticsService.getRecentActivity({ limit: 10 }),
    staleTime: 1000 * 60 * 2,
  })

  const handleRefresh = () => {
    refetch()
  }

  const periods = ['1D', '3D', '7D', '1M', '3M']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4">There was an error loading your dashboard data.</p>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.stats || {}
  const trends = dashboardData?.trends || {}

  const revenueValue = stats.total_revenue || 0
  const ordersValue = stats.total_orders || 0
  const customersValue = stats.active_customers || 0
  const agentsValue = stats.total_agents || 0
  const productsSold = stats.products_sold || 0
  const revenueGrowth = stats.revenue_growth || 0
  const ordersGrowth = stats.orders_growth || 0
  const customerGrowth = stats.customer_growth || 0

  const pieData = [
    { name: 'Sales', value: revenueValue > 0 ? 50 : 1, color: '#C0E02E' },
    { name: 'Orders', value: ordersValue > 0 ? 40 : 1, color: '#9bc21e' },
    { name: 'Returns', value: 10, color: '#5a7211' },
  ]

  const dailyRevenue = trends.daily_revenue || []

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value === 0) return null
    const isUp = value > 0
    return (
      <span className="inline-flex items-center text-sm font-medium">
        {isUp ? (
          <>
            <ChevronUp className="w-4 h-4 text-[#00C2FF]" />
            <span className="text-[#00C2FF]">{value}%</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 text-[#FF4D4D]" />
            <span className="text-[#FF4D4D]">{Math.abs(value)}%</span>
          </>
        )}
      </span>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Sales Overview
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {user?.company_name || (user?.first_name ? `${user.first_name}'s Company` : 'Your Business')}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">{dateRange.start_date} - {dateRange.end_date}</span>
              <span className="sm:hidden">Date Range</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-dropdown p-4 z-20 min-w-[280px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start_date}
                      onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-300 focus:border-lime-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end_date}
                      onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-300 focus:border-lime-400"
                    />
                  </div>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="w-full py-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards - Mobile: stack, Tablet: 2 col, Desktop: 3 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Primary Card - Dark */}
        <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)] relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400">Total Revenue</p>
            <p className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: '#C0E02E' }}>
              {formatCurrency(revenueValue)}
            </p>
            <div className="flex items-center justify-between mt-4">
              <TrendIndicator value={revenueGrowth} />
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#C0E02E] transition-colors" />
            </div>
          </div>
        </div>

        {/* Secondary Card - Light */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card relative overflow-hidden group cursor-pointer">
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              {formatNumber(ordersValue)}
            </p>
            <div className="flex items-center justify-between mt-4">
              <TrendIndicator value={ordersGrowth} />
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>

        {/* Tertiary Card - Light */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card relative overflow-hidden group cursor-pointer sm:col-span-2 lg:col-span-1">
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500">Active Customers</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              {formatNumber(customersValue)}
            </p>
            <div className="flex items-center justify-between mt-4">
              <TrendIndicator value={customerGrowth} />
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPI Row - Smaller cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-2xl">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Field Agents</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{formatNumber(agentsValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-2xl">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Products Sold</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{formatNumber(productsSold)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-2xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{formatNumber(stats.completed_orders || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-2xl">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{formatNumber(stats.pending_orders || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - Donut + Line Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Donut Chart - Light Card */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 lg:col-span-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#666', fontSize: '13px', marginLeft: '4px' }}>{value}</span>
                  )}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Dark Card */}
        <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)] lg:col-span-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-white">Graph</h3>
            <div className="flex gap-1.5">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    chartPeriod === p
                      ? 'bg-[#C0E02E] text-[#1A1A1A]'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={dailyRevenue.length > 0 ? dailyRevenue : [
                { date: 'Mon', revenue: 0, target: 0 },
                { date: 'Tue', revenue: 0, target: 0 },
                { date: 'Wed', revenue: 0, target: 0 },
                { date: 'Thu', revenue: 0, target: 0 },
                { date: 'Fri', revenue: 0, target: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (typeof value === 'string' && value.includes('-')) {
                      return formatDate(value, { format: 'short' })
                    }
                    return value
                  }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                    return value.toString()
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#C0E02E' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C0E02E"
                  strokeWidth={2.5}
                  dot={{ fill: '#C0E02E', strokeWidth: 2, r: 4, stroke: '#1A1A1A' }}
                  activeDot={{ r: 6, fill: '#C0E02E', stroke: '#1A1A1A', strokeWidth: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={{ fill: '#ffffff', strokeWidth: 2, r: 4, stroke: '#1A1A1A' }}
                  activeDot={{ r: 6, fill: '#ffffff', stroke: '#1A1A1A', strokeWidth: 3 }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2.5">
            {(recentActivity?.activities || []).length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            ) : (
              (recentActivity?.activities || []).slice(0, 6).map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-2xl">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    activity.type === 'order' ? 'bg-[#C0E02E]' :
                    activity.type === 'visit' ? 'bg-blue-500' :
                    activity.type === 'customer' ? 'bg-purple-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.agent_name} {activity.created_at && `\u00b7 ${formatDate(activity.created_at)}`}
                    </p>
                  </div>
                  {activity.value && (
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatCurrency(activity.value)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Performers</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2.5">
            {(dashboardData?.top_performers || []).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No performer data yet</p>
              </div>
            ) : (
              (dashboardData?.top_performers || []).slice(0, 5).map((performer: any, index: number) => (
                <div key={performer.agent_id} className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-[#C0E02E] text-[#1A1A1A]' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-200 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{performer.agent_name}</p>
                      <p className="text-xs text-gray-500">{performer.total_orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(performer.total_revenue)}</p>
                    <p className="text-xs text-gray-500">{performer.success_rate}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Touch-friendly for mobile */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => { window.location.href = '/sales/orders' }}
            className="flex flex-col items-center p-4 sm:p-5 bg-[#F8F9FA] rounded-2xl hover:shadow-card transition-all group"
          >
            <div className="p-3 bg-[#1A1A1A] rounded-2xl mb-3 group-hover:bg-gray-800 transition-colors">
              <ShoppingCart className="w-5 h-5" style={{ color: '#C0E02E' }} />
            </div>
            <p className="text-sm font-medium text-gray-900">New Order</p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Create order</p>
          </button>
          
          <button
            onClick={() => { window.location.href = '/customers' }}
            className="flex flex-col items-center p-4 sm:p-5 bg-[#F8F9FA] rounded-2xl hover:shadow-card transition-all group"
          >
            <div className="p-3 bg-[#1A1A1A] rounded-2xl mb-3 group-hover:bg-gray-800 transition-colors">
              <Users className="w-5 h-5" style={{ color: '#C0E02E' }} />
            </div>
            <p className="text-sm font-medium text-gray-900">Add Customer</p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Register new</p>
          </button>
          
          <button
            onClick={() => { window.location.href = '/field-agents' }}
            className="flex flex-col items-center p-4 sm:p-5 bg-[#F8F9FA] rounded-2xl hover:shadow-card transition-all group"
          >
            <div className="p-3 bg-[#1A1A1A] rounded-2xl mb-3 group-hover:bg-gray-800 transition-colors">
              <MapPin className="w-5 h-5" style={{ color: '#C0E02E' }} />
            </div>
            <p className="text-sm font-medium text-gray-900">Schedule Visit</p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Plan visit</p>
          </button>
          
          <button
            onClick={() => { window.location.href = '/reports' }}
            className="flex flex-col items-center p-4 sm:p-5 bg-[#F8F9FA] rounded-2xl hover:shadow-card transition-all group"
          >
            <div className="p-3 bg-[#1A1A1A] rounded-2xl mb-3 group-hover:bg-gray-800 transition-colors">
              <FileText className="w-5 h-5" style={{ color: '#C0E02E' }} />
            </div>
            <p className="text-sm font-medium text-gray-900">Reports</p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">View analytics</p>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="space-y-2.5">
            {dashboardData.alerts.map((alert: any, index: number) => (
              <div key={index} className={`flex items-start p-4 rounded-2xl border ${
                alert.priority === 'high' ? 'bg-red-50 border-red-200' :
                alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                  alert.priority === 'high' ? 'text-red-500' :
                  alert.priority === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
