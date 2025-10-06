'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Maximize2,
  Settings,
  Share2,
  BookOpen,
  Target,
  Users,
  Package,
  MapPin,
  DollarSign,
  Percent,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface MetricCard {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: any
  color: string
  subtitle?: string
  target?: number
  format?: 'currency' | 'percentage' | 'number'
}

interface ChartData {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie' | 'area'
  data: any[]
  config: {
    xAxis?: string
    yAxis?: string
    colors?: string[]
    showLegend?: boolean
    showGrid?: boolean
  }
}

interface ReportFilter {
  id: string
  label: string
  type: 'select' | 'date' | 'daterange' | 'multiselect'
  options?: Array<{ value: string; label: string }>
  value: any
  onChange: (value: any) => void
}

interface ReportingDashboardProps {
  title: string
  subtitle?: string
  metrics: MetricCard[]
  charts: ChartData[]
  filters: ReportFilter[]
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void
  onRefresh?: () => void
  customActions?: React.ReactNode
}

export default function ReportingDashboard({
  title,
  subtitle,
  metrics,
  charts,
  filters,
  onExport,
  onRefresh,
  customActions
}: ReportingDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(value)
      case 'percentage':
        return `${value}%`
      default:
        return new Intl.NumberFormat().format(value)
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
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

  const renderChart = (chart: ChartData) => {
    // This would integrate with a charting library like Chart.js, Recharts, or D3
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{chart.title}</p>
          <p className="text-xs text-gray-400">Chart visualization would render here</p>
        </div>
      </div>
    )
  }

  const renderFilter = (filter: ReportFilter) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'date':
        return (
          <input
            type="date"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      case 'daterange':
        return (
          <div className="flex space-x-2">
            <input
              type="date"
              value={filter.value?.start || ''}
              onChange={(e) => filter.onChange({ ...filter.value, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filter.value?.end || ''}
              onChange={(e) => filter.onChange({ ...filter.value, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )
      default:
        return (
          <Input
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            placeholder={filter.label}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex space-x-3">
          {customActions}
          {onExport && (
            <div className="relative group">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => onExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => onExport('excel')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => onExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          )}
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filters.map(filter => (
              <div key={filter.id} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">
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
                  {metric.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                  )}
                  {metric.target && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((Number(metric.value) / metric.target) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${metric.color}`}
                          style={{ width: `${Math.min((Number(metric.value) / metric.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${metric.color.replace('bg-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map(chart => (
          <Card key={chart.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{chart.title}</h3>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedChart(chart.id)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {renderChart(chart)}
          </Card>
        ))}
      </div>

      {/* Insights and Recommendations */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Key Insights & Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Strong Performance</h4>
                <p className="text-sm text-green-700 mt-1">
                  Top performing products showing 25% growth this quarter. Consider expanding inventory.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Growth Opportunity</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Lagos East area showing untapped potential with 40% customer growth rate.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Attention Needed</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Route efficiency in North Central region below target. Review scheduling.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Market Intelligence</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Beverage category gaining market share. Consider promotional campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}