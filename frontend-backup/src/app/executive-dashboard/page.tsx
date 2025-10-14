'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  Package, 
  MapPin,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Globe,
  Building,
  Route,
  ShoppingCart,
  Award,
  Zap,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  User,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Star,
  TrendingDown,
  Clock,
  Percent
} from 'lucide-react'

interface ExecutiveMetric {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: any
  color: string
  subtitle: string
  target?: number
  format: 'currency' | 'percentage' | 'number'
  drillDownUrl: string
}

interface KPICard {
  category: string
  metrics: ExecutiveMetric[]
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  actionUrl?: string
}

interface TopPerformer {
  category: 'customer' | 'product' | 'route' | 'agent'
  name: string
  value: number
  change: number
  rank: number
}

export default function ExecutiveDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [kpiCards, setKpiCards] = useState<KPICard[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setKpiCards([
        {
          category: 'Revenue & Growth',
          status: 'excellent',
          trend: 'up',
          metrics: [
            {
              title: 'Total Revenue',
              value: 285000000,
              change: 18.5,
              changeType: 'increase',
              icon: DollarSign,
              color: 'bg-green-600',
              subtitle: 'Monthly revenue',
              target: 300000000,
              format: 'currency',
              drillDownUrl: '/analytics/sales'
            },
            {
              title: 'Revenue Growth',
              value: 18.5,
              change: 5.2,
              changeType: 'increase',
              icon: TrendingUp,
              color: 'bg-blue-600',
              subtitle: 'YoY growth rate',
              format: 'percentage',
              drillDownUrl: '/analytics/sales'
            },
            {
              title: 'Profit Margin',
              value: 26.8,
              change: 2.3,
              changeType: 'increase',
              icon: Percent,
              color: 'bg-purple-600',
              subtitle: 'Gross margin',
              format: 'percentage',
              drillDownUrl: '/products/analytics'
            }
          ]
        },
        {
          category: 'Customer Performance',
          status: 'good',
          trend: 'up',
          metrics: [
            {
              title: 'Active Customers',
              value: 1250,
              change: 12.5,
              changeType: 'increase',
              icon: Users,
              color: 'bg-blue-600',
              subtitle: 'Total active customers',
              target: 1500,
              format: 'number',
              drillDownUrl: '/customers/analytics'
            },
            {
              title: 'Customer Retention',
              value: 87.2,
              change: -2.1,
              changeType: 'decrease',
              icon: Target,
              color: 'bg-orange-600',
              subtitle: '12-month retention',
              format: 'percentage',
              drillDownUrl: '/customers/analytics'
            },
            {
              title: 'Customer Lifetime Value',
              value: 125000,
              change: 8.3,
              changeType: 'increase',
              icon: Award,
              color: 'bg-indigo-600',
              subtitle: 'Average CLV',
              format: 'currency',
              drillDownUrl: '/customers/analytics'
            }
          ]
        },
        {
          category: 'Operations & Efficiency',
          status: 'warning',
          trend: 'stable',
          metrics: [
            {
              title: 'Route Efficiency',
              value: 89.2,
              change: 3.8,
              changeType: 'increase',
              icon: Route,
              color: 'bg-green-600',
              subtitle: 'Average efficiency',
              format: 'percentage',
              drillDownUrl: '/routes/analytics'
            },
            {
              title: 'Order Fulfillment',
              value: 94.5,
              change: -1.2,
              changeType: 'decrease',
              icon: CheckCircle,
              color: 'bg-yellow-600',
              subtitle: 'On-time delivery',
              format: 'percentage',
              drillDownUrl: '/orders'
            },
            {
              title: 'Inventory Turnover',
              value: 9.2,
              change: -1.5,
              changeType: 'decrease',
              icon: Package,
              color: 'bg-red-600',
              subtitle: 'Times per year',
              format: 'number',
              drillDownUrl: '/products/analytics'
            }
          ]
        },
        {
          category: 'Market & Competition',
          status: 'good',
          trend: 'up',
          metrics: [
            {
              title: 'Market Share',
              value: 23.8,
              change: 4.2,
              changeType: 'increase',
              icon: Globe,
              color: 'bg-purple-600',
              subtitle: 'Regional market share',
              format: 'percentage',
              drillDownUrl: '/analytics/market'
            },
            {
              title: 'Brand Performance',
              value: 85.2,
              change: 6.8,
              changeType: 'increase',
              icon: Star,
              color: 'bg-yellow-600',
              subtitle: 'Brand strength index',
              format: 'number',
              drillDownUrl: '/brands/analytics'
            },
            {
              title: 'Customer Satisfaction',
              value: 4.6,
              change: 0.3,
              changeType: 'increase',
              icon: Star,
              color: 'bg-green-600',
              subtitle: 'Average rating',
              format: 'number',
              drillDownUrl: '/customers/analytics'
            }
          ]
        }
      ])

      setAlerts([
        {
          id: '1',
          type: 'critical',
          title: 'Inventory Stock-out Alert',
          message: '15 products are critically low on stock and need immediate reordering',
          timestamp: '2024-09-30T10:30:00Z',
          actionUrl: '/products?filter=low-stock'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Route Efficiency Drop',
          message: 'Abuja Central route showing 15% efficiency drop this week',
          timestamp: '2024-09-30T09:15:00Z',
          actionUrl: '/routes/analytics?route=abuja-central'
        },
        {
          id: '3',
          type: 'info',
          title: 'New Customer Milestone',
          message: 'Reached 1,250 active customers - 25% ahead of quarterly target',
          timestamp: '2024-09-30T08:45:00Z',
          actionUrl: '/customers/analytics'
        },
        {
          id: '4',
          type: 'warning',
          title: 'Payment Failures Spike',
          message: '12% increase in payment failures detected in Lagos region',
          timestamp: '2024-09-29T16:20:00Z',
          actionUrl: '/back-office/transactions?status=failed'
        }
      ])

      setTopPerformers([
        { category: 'customer', name: 'Shoprite Nigeria', value: 8500000, change: 23.5, rank: 1 },
        { category: 'product', name: 'Coca-Cola 500ml', value: 1355000, change: 18.5, rank: 1 },
        { category: 'route', name: 'Lagos Central', value: 1850000, change: 22.1, rank: 1 },
        { category: 'agent', name: 'John Adebayo', value: 3200000, change: 22.1, rank: 1 }
      ])

      setLoading(false)
    }, 1000)
  }, [selectedPeriod, selectedRegion])

  const formatValue = (value: string | number, format: string) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          notation: value > 1000000 ? 'compact' : 'standard'
        }).format(value)
      case 'percentage':
        return `${value}%`
      default:
        return new Intl.NumberFormat('en-NG', {
          notation: value > 1000 ? 'compact' : 'standard'
        }).format(value)
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'border-green-500 bg-green-50'
      case 'good':
        return 'border-blue-500 bg-blue-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      case 'critical':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50 text-red-800'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-800'
      case 'info':
        return 'border-blue-500 bg-blue-50 text-blue-800'
      default:
        return 'border-gray-500 bg-gray-50 text-gray-800'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer':
        return <Users className="w-4 h-4" />
      case 'product':
        return <Package className="w-4 h-4" />
      case 'route':
        return <MapPin className="w-4 h-4" />
      case 'agent':
        return <User className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  if (loading) {
    return (<ErrorBoundary>

      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading executive dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    
</ErrorBoundary>)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive business intelligence and performance overview</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              <option value="sw">South West</option>
              <option value="ss">South South</option>
              <option value="se">South East</option>
              <option value="nc">North Central</option>
            </select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        {alerts.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-red-600" />
                Critical Alerts & Notifications
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.slice(0, 4).map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs opacity-75">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {alert.actionUrl && (
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {kpiCards.map((kpiCard, index) => (
            <Card key={index} className={`p-6 border-l-4 ${getStatusColor(kpiCard.status)}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{kpiCard.category}</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    kpiCard.trend === 'up' ? 'bg-green-500' :
                    kpiCard.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-500 capitalize">{kpiCard.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {kpiCard.metrics.map((metric, metricIndex) => {
                  const Icon = metric.icon
                  return (
                    <div key={metricIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${metric.color.replace('bg-', 'bg-').replace('-600', '-100')}`}>
                          <Icon className={`w-5 h-5 ${metric.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                          <p className="text-xs text-gray-500">{metric.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-bold text-gray-900">
                            {formatValue(metric.value, metric.format)}
                          </p>
                          {metric.change !== 0 && (
                            <div className={`flex items-center space-x-1 ${getChangeColor(metric.changeType)}`}>
                              {getChangeIcon(metric.changeType)}
                              <span className="text-sm font-medium">
                                {Math.abs(metric.change)}%
                              </span>
                            </div>
                          )}
                        </div>
                        {metric.target && (
                          <div className="mt-1">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${metric.color}`}
                                style={{ width: `${Math.min((Number(metric.value) / metric.target) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="mt-1 p-0 h-auto text-blue-600 hover:text-blue-700"
                          onClick={() => window.location.href = metric.drillDownUrl}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topPerformers.map((performer, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(performer.category)}
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      Top {performer.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-600">#{performer.rank}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 truncate" title={performer.name}>
                    {performer.name}
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {formatValue(performer.value, 'currency')}
                  </p>
                  <div className={`flex items-center space-x-1 mt-1 ${getChangeColor(performer.change > 0 ? 'increase' : 'decrease')}`}>
                    {getChangeIcon(performer.change > 0 ? 'increase' : 'decrease')}
                    <span className="text-sm font-medium">
                      {Math.abs(performer.change)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions & Reports</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => window.location.href = '/customers/analytics'}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Customer Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => window.location.href = '/products/analytics'}
            >
              <Package className="w-6 h-6" />
              <span className="text-sm">Product Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => window.location.href = '/routes/analytics'}
            >
              <MapPin className="w-6 h-6" />
              <span className="text-sm">Route Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => window.location.href = '/back-office/transactions'}
            >
              <Activity className="w-6 h-6" />
              <span className="text-sm">Transactions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => window.location.href = '/analytics/predictions'}
            >
              <Zap className="w-6 h-6" />
              <span className="text-sm">AI Insights</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => window.location.href = '/analytics/custom'}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">Custom Reports</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}