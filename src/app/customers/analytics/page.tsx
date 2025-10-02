'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ReportingDashboard from '@/components/reporting/ReportingDashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Target,
  Clock,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Percent,
  Building,
  CreditCard,
  Phone,
  Mail,
  Package,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface CustomerSegment {
  id: string
  name: string
  count: number
  percentage: number
  avgOrderValue: number
  totalRevenue: number
  growthRate: number
  characteristics: string[]
}

interface CustomerLifecycle {
  stage: string
  count: number
  percentage: number
  avgDaysInStage: number
  conversionRate: number
  revenue: number
}

interface TopCustomer {
  id: string
  name: string
  code: string
  type: string
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  lastOrderDate: string
  growthRate: number
  riskScore: number
  location: string
}

export default function CustomerAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '2024-07-01', end: '2024-09-30' })
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [selectedCustomerType, setSelectedCustomerType] = useState('all')

  // Mock data
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([])
  const [customerLifecycle, setCustomerLifecycle] = useState<CustomerLifecycle[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setCustomerSegments([
        {
          id: 'champions',
          name: 'Champions',
          count: 156,
          percentage: 12.5,
          avgOrderValue: 45000,
          totalRevenue: 28500000,
          growthRate: 18.5,
          characteristics: ['High frequency', 'High value', 'Recent purchases', 'Long tenure']
        },
        {
          id: 'loyal',
          name: 'Loyal Customers',
          count: 298,
          percentage: 23.8,
          avgOrderValue: 32000,
          totalRevenue: 38200000,
          growthRate: 12.3,
          characteristics: ['Regular purchases', 'Good value', 'Consistent behavior']
        },
        {
          id: 'potential',
          name: 'Potential Loyalists',
          count: 187,
          percentage: 15.0,
          avgOrderValue: 28000,
          totalRevenue: 21000000,
          growthRate: 25.7,
          characteristics: ['Recent customers', 'Good frequency', 'Growing value']
        },
        {
          id: 'new',
          name: 'New Customers',
          count: 234,
          percentage: 18.7,
          avgOrderValue: 18000,
          totalRevenue: 16800000,
          growthRate: 45.2,
          characteristics: ['First-time buyers', 'Low frequency', 'Potential for growth']
        },
        {
          id: 'at_risk',
          name: 'At Risk',
          count: 145,
          percentage: 11.6,
          avgOrderValue: 35000,
          totalRevenue: 18200000,
          growthRate: -8.4,
          characteristics: ['Declining frequency', 'High historical value', 'Need attention']
        },
        {
          id: 'hibernating',
          name: 'Hibernating',
          count: 230,
          percentage: 18.4,
          avgOrderValue: 25000,
          totalRevenue: 12500000,
          growthRate: -15.2,
          characteristics: ['Low recent activity', 'Historical customers', 'Reactivation needed']
        }
      ])

      setCustomerLifecycle([
        { stage: 'Prospect', count: 450, percentage: 25.0, avgDaysInStage: 15, conversionRate: 68.5, revenue: 0 },
        { stage: 'First Purchase', count: 308, percentage: 17.1, avgDaysInStage: 7, conversionRate: 85.2, revenue: 8500000 },
        { stage: 'Repeat Customer', count: 262, percentage: 14.6, avgDaysInStage: 45, conversionRate: 72.1, revenue: 24600000 },
        { stage: 'Loyal Customer', count: 189, percentage: 10.5, avgDaysInStage: 120, conversionRate: 89.4, revenue: 45200000 },
        { stage: 'Champion', count: 156, percentage: 8.7, avgDaysInStage: 365, conversionRate: 95.8, revenue: 62800000 },
        { stage: 'At Risk', count: 145, percentage: 8.1, avgDaysInStage: 90, conversionRate: 45.2, revenue: 18200000 },
        { stage: 'Churned', count: 290, percentage: 16.1, avgDaysInStage: 180, conversionRate: 12.5, revenue: 2100000 }
      ])

      setTopCustomers([
        {
          id: '1',
          name: 'Shoprite Nigeria',
          code: 'CUST001',
          type: 'RETAIL',
          totalOrders: 156,
          totalRevenue: 8500000,
          avgOrderValue: 54487,
          lastOrderDate: '2024-09-30',
          growthRate: 23.5,
          riskScore: 15,
          location: 'Lagos, Nigeria'
        },
        {
          id: '2',
          name: 'Konga Distribution',
          code: 'CUST002',
          type: 'DISTRIBUTOR',
          totalOrders: 89,
          totalRevenue: 6200000,
          avgOrderValue: 69663,
          lastOrderDate: '2024-09-29',
          growthRate: 18.2,
          riskScore: 25,
          location: 'Lagos, Nigeria'
        },
        {
          id: '3',
          name: 'Game Stores',
          code: 'CUST003',
          type: 'RETAIL',
          totalOrders: 134,
          totalRevenue: 5800000,
          avgOrderValue: 43284,
          lastOrderDate: '2024-09-28',
          growthRate: 15.7,
          riskScore: 35,
          location: 'Abuja, Nigeria'
        }
      ])

      setLoading(false)
    }, 1000)
  }, [dateRange, selectedRegion, selectedSegment])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const metrics = [
    {
      title: 'Total Customers',
      value: 1250,
      change: 12.5,
      changeType: 'increase' as const,
      icon: Users,
      color: 'bg-blue-600',
      subtitle: 'Active customers',
      target: 1500,
      format: 'number' as const
    },
    {
      title: 'Customer Lifetime Value',
      value: 125000,
      change: 8.3,
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'bg-green-600',
      subtitle: 'Average CLV',
      format: 'currency' as const
    },
    {
      title: 'Customer Acquisition Rate',
      value: 18.5,
      change: 5.2,
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'bg-purple-600',
      subtitle: 'New customers/month',
      format: 'percentage' as const
    },
    {
      title: 'Customer Retention Rate',
      value: 87.2,
      change: -2.1,
      changeType: 'decrease' as const,
      icon: Target,
      color: 'bg-orange-600',
      subtitle: '12-month retention',
      format: 'percentage' as const
    },
    {
      title: 'Average Order Value',
      value: 35500,
      change: 15.8,
      changeType: 'increase' as const,
      icon: ShoppingCart,
      color: 'bg-indigo-600',
      subtitle: 'Per transaction',
      format: 'currency' as const
    },
    {
      title: 'Churn Risk Score',
      value: 23.5,
      change: -8.7,
      changeType: 'decrease' as const,
      icon: AlertTriangle,
      color: 'bg-red-600',
      subtitle: 'Customers at risk',
      format: 'percentage' as const
    }
  ]

  const charts = [
    {
      id: 'customer-segments',
      title: 'Customer Segmentation',
      type: 'pie' as const,
      data: customerSegments,
      config: {
        colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'],
        showLegend: true
      }
    },
    {
      id: 'customer-lifecycle',
      title: 'Customer Lifecycle Analysis',
      type: 'bar' as const,
      data: customerLifecycle,
      config: {
        xAxis: 'stage',
        yAxis: 'count',
        colors: ['#3B82F6'],
        showGrid: true
      }
    },
    {
      id: 'revenue-by-segment',
      title: 'Revenue by Customer Segment',
      type: 'bar' as const,
      data: customerSegments,
      config: {
        xAxis: 'name',
        yAxis: 'totalRevenue',
        colors: ['#10B981'],
        showGrid: true
      }
    },
    {
      id: 'customer-growth-trend',
      title: 'Customer Growth Trend',
      type: 'line' as const,
      data: [],
      config: {
        xAxis: 'month',
        yAxis: 'customers',
        colors: ['#8B5CF6'],
        showGrid: true
      }
    }
  ]

  const filters = [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const,
      value: dateRange,
      onChange: setDateRange
    },
    {
      id: 'region',
      label: 'Region',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Regions' },
        { value: 'sw', label: 'South West' },
        { value: 'ss', label: 'South South' },
        { value: 'se', label: 'South East' },
        { value: 'nc', label: 'North Central' }
      ],
      value: selectedRegion,
      onChange: setSelectedRegion
    },
    {
      id: 'segment',
      label: 'Customer Segment',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Segments' },
        { value: 'champions', label: 'Champions' },
        { value: 'loyal', label: 'Loyal Customers' },
        { value: 'potential', label: 'Potential Loyalists' },
        { value: 'new', label: 'New Customers' },
        { value: 'at_risk', label: 'At Risk' },
        { value: 'hibernating', label: 'Hibernating' }
      ],
      value: selectedSegment,
      onChange: setSelectedSegment
    },
    {
      id: 'customerType',
      label: 'Customer Type',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'RETAIL', label: 'Retail' },
        { value: 'WHOLESALE', label: 'Wholesale' },
        { value: 'DISTRIBUTOR', label: 'Distributor' },
        { value: 'CORPORATE', label: 'Corporate' }
      ],
      value: selectedCustomerType,
      onChange: setSelectedCustomerType
    }
  ]

  const topCustomerColumns = [
    {
      header: 'Customer',
      accessorKey: 'customer',
      cell: (customer: TopCustomer) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Performance',
      accessorKey: 'performance',
      cell: (customer: TopCustomer) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {customer.totalOrders} orders
          </div>
          <div className="text-sm text-green-600">
            {formatCurrency(customer.totalRevenue)}
          </div>
          <div className="text-xs text-gray-500">
            AOV: {formatCurrency(customer.avgOrderValue)}
          </div>
        </div>
      ),
    },
    {
      header: 'Growth & Risk',
      accessorKey: 'growth',
      cell: (customer: TopCustomer) => (
        <div className="space-y-1">
          <div className={`flex items-center space-x-1 ${customer.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {customer.growthRate > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(customer.growthRate)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${customer.riskScore < 30 ? 'bg-green-500' : customer.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">Risk: {customer.riskScore}%</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Last Activity',
      accessorKey: 'lastActivity',
      cell: (customer: TopCustomer) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-900">
            {new Date(customer.lastOrderDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">{customer.location}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (customer: TopCustomer) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Phone className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      ),
    }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ReportingDashboard
        title="Customer Analytics & Intelligence"
        subtitle="Comprehensive customer performance analysis, segmentation, and insights"
        metrics={metrics}
        charts={charts}
        filters={filters}
        onExport={(format) => console.log(`Exporting customer analytics as ${format}`)}
        onRefresh={() => window.location.reload()}
        customActions={
          <Button variant="outline">
            <Target className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
        }
      />

      {/* Customer Segmentation Details */}
      <div className="mt-8 space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segmentation Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customerSegments.map(segment => (
              <Card key={segment.id} className="p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{segment.name}</h4>
                  <span className="text-sm text-gray-500">{segment.percentage}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customers:</span>
                    <span className="font-medium">{segment.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Order Value:</span>
                    <span className="font-medium">{formatCurrency(segment.avgOrderValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-medium">{formatCurrency(segment.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Growth Rate:</span>
                    <span className={`font-medium ${segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {segment.growthRate > 0 ? '+' : ''}{segment.growthRate}%
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Key Characteristics:</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.characteristics.map((char, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Top Customers Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Customers</h3>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export List
            </Button>
          </div>
          <DataTable
            data={topCustomers}
            columns={topCustomerColumns}
            searchable={true}
            pagination={true}
            pageSize={10}
          />
        </Card>

        {/* Customer Lifecycle Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Lifecycle Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {customerLifecycle.map((stage, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{stage.stage}</h4>
                  <span className="text-sm text-gray-500">{stage.percentage}%</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Count:</span>
                    <span className="font-medium">{stage.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Days:</span>
                    <span className="font-medium">{stage.avgDaysInStage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-medium text-green-600">{stage.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">{formatCurrency(stage.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}