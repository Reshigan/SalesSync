'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ReportingDashboard from '@/components/reporting/ReportingDashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  MessageSquare,
  Camera,
  FileText,
  Navigation,
  Smartphone,
  Wifi,
  Battery,
  Signal,
  User,
  Building,
  Route,
  Activity,
  Timer,
  Award,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react'

interface VisitRecord {
  id: string
  visitNumber: string
  customerName: string
  customerCode: string
  customerType: string
  agentName: string
  agentCode: string
  routeName: string
  areaName: string
  regionName: string
  plannedDate: string
  actualDate: string
  startTime: string
  endTime: string
  duration: number
  plannedDuration: number
  status: 'completed' | 'partial' | 'missed' | 'rescheduled' | 'cancelled'
  visitType: 'sales' | 'delivery' | 'collection' | 'survey' | 'maintenance'
  location: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  checkInTime: string
  checkOutTime: string
  distanceFromCustomer: number
  objectives: string[]
  completedObjectives: string[]
  outcomes: {
    orderGenerated: boolean
    orderValue: number
    paymentCollected: number
    issuesResolved: number
    newRequirements: string[]
  }
  customerFeedback: {
    satisfaction: number
    npsScore: number
    comments: string
    concerns: string[]
    compliments: string[]
  }
  agentNotes: string
  photos: number
  documentsCollected: number
  deviceInfo: {
    batteryLevel: number
    signalStrength: number
    gpsAccuracy: number
    appVersion: string
  }
  qualityScore: number
  complianceScore: number
  riskFlags: string[]
}

interface VisitSummary {
  totalVisits: number
  completedVisits: number
  missedVisits: number
  partialVisits: number
  completionRate: number
  avgDuration: number
  avgSatisfaction: number
  avgNPS: number
  totalOrderValue: number
  avgOrderValue: number
}

interface AgentVisitPerformance {
  agentId: string
  agentName: string
  agentCode: string
  totalVisits: number
  completedVisits: number
  completionRate: number
  avgDuration: number
  avgSatisfaction: number
  avgOrderValue: number
  qualityScore: number
  punctualityScore: number
  complianceScore: number
  rank: number
}

interface CustomerVisitInsights {
  customerId: string
  customerName: string
  customerCode: string
  totalVisits: number
  lastVisitDate: string
  avgSatisfaction: number
  avgNPS: number
  visitFrequency: number
  preferredVisitTime: string
  commonConcerns: string[]
  orderConversionRate: number
  avgOrderValue: number
  loyaltyScore: number
}

export default function VisitAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '2024-07-01', end: '2024-09-30' })
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [analysisType, setAnalysisType] = useState('overview')

  // Mock data
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([])
  const [visitSummary, setVisitSummary] = useState<VisitSummary | null>(null)
  const [agentPerformance, setAgentPerformance] = useState<AgentVisitPerformance[]>([])
  const [customerInsights, setCustomerInsights] = useState<CustomerVisitInsights[]>([])

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setVisitRecords([
        {
          id: '1',
          visitNumber: 'VST-2024-001234',
          customerName: 'Shoprite Lagos',
          customerCode: 'CUST001',
          customerType: 'RETAIL',
          agentName: 'John Adebayo',
          agentCode: 'AGT001',
          routeName: 'Lagos Central',
          areaName: 'Lagos Metro',
          regionName: 'South West',
          plannedDate: '2024-09-30',
          actualDate: '2024-09-30',
          startTime: '09:30',
          endTime: '10:45',
          duration: 75,
          plannedDuration: 60,
          status: 'completed',
          visitType: 'sales',
          location: {
            latitude: 6.5244,
            longitude: 3.3792,
            address: '123 Victoria Island, Lagos',
            accuracy: 5
          },
          checkInTime: '09:32',
          checkOutTime: '10:43',
          distanceFromCustomer: 12,
          objectives: ['Product presentation', 'Order collection', 'Payment collection', 'Relationship building'],
          completedObjectives: ['Product presentation', 'Order collection', 'Payment collection', 'Relationship building'],
          outcomes: {
            orderGenerated: true,
            orderValue: 15750,
            paymentCollected: 12500,
            issuesResolved: 1,
            newRequirements: ['Bulk discount request', 'Extended payment terms']
          },
          customerFeedback: {
            satisfaction: 4.8,
            npsScore: 9,
            comments: 'Excellent service and product knowledge. Very professional agent.',
            concerns: [],
            compliments: ['Professional service', 'Product knowledge', 'Punctuality']
          },
          agentNotes: 'Customer very satisfied. Discussed new product lines. Potential for increased orders.',
          photos: 3,
          documentsCollected: 2,
          deviceInfo: {
            batteryLevel: 85,
            signalStrength: 4,
            gpsAccuracy: 5,
            appVersion: '2.1.0'
          },
          qualityScore: 95,
          complianceScore: 98,
          riskFlags: []
        },
        {
          id: '2',
          visitNumber: 'VST-2024-001235',
          customerName: 'Best Buy Stores',
          customerCode: 'CUST003',
          customerType: 'RETAIL',
          agentName: 'Ahmed Hassan',
          agentCode: 'AGT003',
          routeName: 'Abuja Central',
          areaName: 'FCT Metro',
          regionName: 'North Central',
          plannedDate: '2024-09-29',
          actualDate: '2024-09-29',
          startTime: '11:00',
          endTime: '11:25',
          duration: 25,
          plannedDuration: 45,
          status: 'partial',
          visitType: 'delivery',
          location: {
            latitude: 9.0579,
            longitude: 7.4951,
            address: '789 Wuse II, Abuja',
            accuracy: 8
          },
          checkInTime: '11:05',
          checkOutTime: '11:23',
          distanceFromCustomer: 25,
          objectives: ['Product delivery', 'Quality check', 'Payment collection', 'Customer feedback'],
          completedObjectives: ['Product delivery', 'Quality check'],
          outcomes: {
            orderGenerated: false,
            orderValue: 0,
            paymentCollected: 0,
            issuesResolved: 0,
            newRequirements: ['Quality complaint investigation']
          },
          customerFeedback: {
            satisfaction: 2.5,
            npsScore: 3,
            comments: 'Products delivered were expired. Very disappointed with quality control.',
            concerns: ['Product quality', 'Expiry dates', 'Quality control'],
            compliments: []
          },
          agentNotes: 'Customer complaint about expired products. Need to investigate supply chain.',
          photos: 5,
          documentsCollected: 1,
          deviceInfo: {
            batteryLevel: 72,
            signalStrength: 3,
            gpsAccuracy: 8,
            appVersion: '2.0.8'
          },
          qualityScore: 45,
          complianceScore: 78,
          riskFlags: ['QUALITY_COMPLAINT', 'LOW_SATISFACTION']
        },
        {
          id: '3',
          visitNumber: 'VST-2024-001236',
          customerName: 'Metro Mart',
          customerCode: 'CUST004',
          customerType: 'WHOLESALE',
          agentName: 'Sarah Johnson',
          agentCode: 'AGT004',
          routeName: 'Port Harcourt East',
          areaName: 'PH Metro',
          regionName: 'South South',
          plannedDate: '2024-09-28',
          actualDate: '2024-09-28',
          startTime: '14:30',
          endTime: '15:45',
          duration: 75,
          plannedDuration: 90,
          status: 'completed',
          visitType: 'sales',
          location: {
            latitude: 4.8156,
            longitude: 7.0498,
            address: '321 Trans Amadi, Port Harcourt',
            accuracy: 3
          },
          checkInTime: '14:28',
          checkOutTime: '15:47',
          distanceFromCustomer: 8,
          objectives: ['New product presentation', 'Bulk order negotiation', 'Contract renewal', 'Market intelligence'],
          completedObjectives: ['New product presentation', 'Bulk order negotiation', 'Contract renewal', 'Market intelligence'],
          outcomes: {
            orderGenerated: true,
            orderValue: 45000,
            paymentCollected: 0,
            issuesResolved: 2,
            newRequirements: ['Volume discount structure', 'Flexible delivery schedule']
          },
          customerFeedback: {
            satisfaction: 4.6,
            npsScore: 8,
            comments: 'Good product range and competitive pricing. Agent is knowledgeable.',
            concerns: ['Delivery scheduling'],
            compliments: ['Product knowledge', 'Competitive pricing', 'Professional approach']
          },
          agentNotes: 'Successful contract renewal. Customer interested in expanding product range.',
          photos: 2,
          documentsCollected: 3,
          deviceInfo: {
            batteryLevel: 68,
            signalStrength: 4,
            gpsAccuracy: 3,
            appVersion: '2.1.0'
          },
          qualityScore: 88,
          complianceScore: 92,
          riskFlags: []
        }
      ])

      setVisitSummary({
        totalVisits: 156,
        completedVisits: 142,
        missedVisits: 8,
        partialVisits: 6,
        completionRate: 91.0,
        avgDuration: 68,
        avgSatisfaction: 4.2,
        avgNPS: 7.8,
        totalOrderValue: 2850000,
        avgOrderValue: 18269
      })

      setAgentPerformance([
        {
          agentId: '1',
          agentName: 'John Adebayo',
          agentCode: 'AGT001',
          totalVisits: 45,
          completedVisits: 43,
          completionRate: 95.6,
          avgDuration: 72,
          avgSatisfaction: 4.7,
          avgOrderValue: 52000,
          qualityScore: 94,
          punctualityScore: 96,
          complianceScore: 97,
          rank: 1
        },
        {
          agentId: '2',
          agentName: 'Sarah Johnson',
          agentCode: 'AGT004',
          totalVisits: 38,
          completedVisits: 36,
          completionRate: 94.7,
          avgDuration: 78,
          avgSatisfaction: 4.5,
          avgOrderValue: 48500,
          qualityScore: 91,
          punctualityScore: 93,
          complianceScore: 94,
          rank: 2
        },
        {
          agentId: '3',
          agentName: 'Ahmed Hassan',
          agentCode: 'AGT003',
          totalVisits: 42,
          completedVisits: 35,
          completionRate: 83.3,
          avgDuration: 58,
          avgSatisfaction: 3.8,
          avgOrderValue: 35000,
          qualityScore: 76,
          punctualityScore: 82,
          complianceScore: 85,
          rank: 3
        }
      ])

      setCustomerInsights([
        {
          customerId: '1',
          customerName: 'Shoprite Lagos',
          customerCode: 'CUST001',
          totalVisits: 12,
          lastVisitDate: '2024-09-30',
          avgSatisfaction: 4.8,
          avgNPS: 9.2,
          visitFrequency: 7.5,
          preferredVisitTime: '09:30-11:00',
          commonConcerns: [],
          orderConversionRate: 95.8,
          avgOrderValue: 54500,
          loyaltyScore: 96
        },
        {
          customerId: '2',
          customerName: 'Metro Mart',
          customerCode: 'CUST004',
          totalVisits: 8,
          lastVisitDate: '2024-09-28',
          avgSatisfaction: 4.6,
          avgNPS: 8.1,
          visitFrequency: 11.2,
          preferredVisitTime: '14:00-16:00',
          commonConcerns: ['Delivery scheduling'],
          orderConversionRate: 87.5,
          avgOrderValue: 48200,
          loyaltyScore: 88
        },
        {
          customerId: '3',
          customerName: 'Best Buy Stores',
          customerCode: 'CUST003',
          totalVisits: 15,
          lastVisitDate: '2024-09-29',
          avgSatisfaction: 3.2,
          avgNPS: 4.5,
          visitFrequency: 6.8,
          preferredVisitTime: '10:00-12:00',
          commonConcerns: ['Product quality', 'Expiry dates', 'Quality control'],
          orderConversionRate: 65.2,
          avgOrderValue: 28500,
          loyaltyScore: 52
        }
      ])

      setLoading(false)
    }, 1000)
  }, [dateRange, selectedRegion, selectedAgent])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      missed: 'bg-red-100 text-red-800',
      rescheduled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      completed: CheckCircle,
      partial: AlertTriangle,
      missed: XCircle,
      rescheduled: Clock,
      cancelled: XCircle
    }
    return icons[status as keyof typeof icons] || AlertCircle
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const metrics = [
    {
      title: 'Total Visits',
      value: visitSummary?.totalVisits || 0,
      change: 12.5,
      changeType: 'increase' as const,
      icon: MapPin,
      color: 'bg-blue-600',
      subtitle: 'All visit records',
      format: 'number' as const
    },
    {
      title: 'Completion Rate',
      value: visitSummary?.completionRate || 0,
      change: 3.8,
      changeType: 'increase' as const,
      icon: Target,
      color: 'bg-green-600',
      subtitle: 'Successfully completed',
      format: 'percentage' as const
    },
    {
      title: 'Average Duration',
      value: visitSummary?.avgDuration || 0,
      change: -5.2,
      changeType: 'decrease' as const,
      icon: Clock,
      color: 'bg-purple-600',
      subtitle: 'Minutes per visit',
      format: 'number' as const
    },
    {
      title: 'Customer Satisfaction',
      value: visitSummary?.avgSatisfaction || 0,
      change: 8.3,
      changeType: 'increase' as const,
      icon: Star,
      color: 'bg-yellow-600',
      subtitle: 'Average rating',
      format: 'number' as const
    },
    {
      title: 'Net Promoter Score',
      value: visitSummary?.avgNPS || 0,
      change: 12.1,
      changeType: 'increase' as const,
      icon: ThumbsUp,
      color: 'bg-indigo-600',
      subtitle: 'Customer loyalty',
      format: 'number' as const
    },
    {
      title: 'Order Conversion',
      value: visitSummary ? (visitSummary.totalOrderValue / visitSummary.totalVisits) : 0,
      change: 15.8,
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'bg-orange-600',
      subtitle: 'Revenue per visit',
      format: 'currency' as const
    }
  ]

  const charts = [
    {
      id: 'visit-completion-trend',
      title: 'Visit Completion Trend',
      type: 'line' as const,
      data: [],
      config: {
        xAxis: 'date',
        yAxis: 'completionRate',
        colors: ['#3B82F6'],
        showGrid: true
      }
    },
    {
      id: 'visit-status-distribution',
      title: 'Visit Status Distribution',
      type: 'pie' as const,
      data: [],
      config: {
        colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280'],
        showLegend: true
      }
    },
    {
      id: 'satisfaction-by-region',
      title: 'Customer Satisfaction by Region',
      type: 'bar' as const,
      data: [],
      config: {
        xAxis: 'region',
        yAxis: 'satisfaction',
        colors: ['#8B5CF6'],
        showGrid: true
      }
    },
    {
      id: 'agent-performance-ranking',
      title: 'Agent Performance Ranking',
      type: 'bar' as const,
      data: agentPerformance,
      config: {
        xAxis: 'agentName',
        yAxis: 'qualityScore',
        colors: ['#10B981'],
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
      id: 'agent',
      label: 'Agent',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Agents' },
        { value: 'AGT001', label: 'John Adebayo' },
        { value: 'AGT003', label: 'Ahmed Hassan' },
        { value: 'AGT004', label: 'Sarah Johnson' }
      ],
      value: selectedAgent,
      onChange: setSelectedAgent
    },
    {
      id: 'status',
      label: 'Visit Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'completed', label: 'Completed' },
        { value: 'partial', label: 'Partial' },
        { value: 'missed', label: 'Missed' },
        { value: 'rescheduled', label: 'Rescheduled' }
      ],
      value: selectedStatus,
      onChange: setSelectedStatus
    }
  ]

  const visitColumns = [
    {
      header: 'Visit Details',
      accessor: 'visit',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.visitNumber}</div>
            <div className="text-sm text-gray-500">{row.actualDate}</div>
            <div className="text-xs text-gray-400">{row.startTime} - {row.endTime}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">{row.customerName}</div>
          <div className="text-xs text-gray-500">{row.customerCode}</div>
          <div className="text-xs text-gray-400">{row.customerType}</div>
        </div>
      ),
    },
    {
      header: 'Agent & Route',
      accessor: 'agent',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            {row.agentName}
          </div>
          <div className="text-xs text-gray-500">{row.agentCode}</div>
          <div className="text-xs text-gray-400">{row.routeName}</div>
        </div>
      ),
    },
    {
      header: 'Status & Duration',
      accessor: 'status',
      cell: ({ row }: { row: VisitRecord }) => {
        const StatusIcon = getStatusIcon(row.status)
        return (<ErrorBoundary>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <StatusIcon className="w-4 h-4" />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                {row.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-900">
              {row.duration} min
            </div>
            <div className="text-xs text-gray-500">
              Planned: {row.plannedDuration} min
            </div>
          </div>
        
</ErrorBoundary>)
      },
    },
    {
      header: 'Objectives',
      accessor: 'objectives',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.completedObjectives.length}/{row.objectives.length}
          </div>
          <div className="text-xs text-green-600">
            {Math.round((row.completedObjectives.length / row.objectives.length) * 100)}% completed
          </div>
          <div className="text-xs text-gray-500">
            {row.objectives.slice(0, 2).join(', ')}
            {row.objectives.length > 2 && '...'}
          </div>
        </div>
      ),
    },
    {
      header: 'Outcomes',
      accessor: 'outcomes',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="space-y-1">
          {row.outcomes.orderGenerated && (
            <div className="text-sm text-green-600">
              Order: {formatCurrency(row.outcomes.orderValue)}
            </div>
          )}
          {row.outcomes.paymentCollected > 0 && (
            <div className="text-sm text-blue-600">
              Payment: {formatCurrency(row.outcomes.paymentCollected)}
            </div>
          )}
          {row.outcomes.issuesResolved > 0 && (
            <div className="text-xs text-gray-600">
              {row.outcomes.issuesResolved} issues resolved
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Customer Feedback',
      accessor: 'feedback',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className={`text-sm font-medium ${getSatisfactionColor(row.customerFeedback.satisfaction)}`}>
              {row.customerFeedback.satisfaction}/5.0
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <ThumbsUp className="w-3 h-3 text-blue-500" />
            <span className="text-sm text-blue-600">
              NPS: {row.customerFeedback.npsScore}
            </span>
          </div>
          {row.customerFeedback.concerns.length > 0 && (
            <div className="text-xs text-red-600">
              {row.customerFeedback.concerns.length} concerns
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Quality & Compliance',
      accessor: 'quality',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Award className="w-3 h-3 text-purple-500" />
            <span className={`text-sm font-medium ${getQualityColor(row.qualityScore)}`}>
              {row.qualityScore}%
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Compliance: {row.complianceScore}%
          </div>
          {row.riskFlags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {row.riskFlags.slice(0, 2).map((flag, index) => (
                <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: VisitRecord }) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Camera className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <MessageSquare className="w-4 h-4" />
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
            <p className="mt-4 text-gray-600">Loading visit analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ReportingDashboard
        title="Visit Analytics & Performance"
        subtitle="Comprehensive visit tracking, customer feedback analysis, and field performance insights"
        metrics={metrics}
        charts={charts}
        filters={filters}
        onExport={(format) => console.log(`Exporting visit analytics as ${format}`)}
        onRefresh={() => window.location.reload()}
        customActions={
          <Button variant="outline">
            <Navigation className="w-4 h-4 mr-2" />
            Route Optimization
          </Button>
        }
      />

      {/* Detailed Analysis Sections */}
      <div className="mt-8 space-y-6">
        {/* Agent Performance Ranking */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Visit Performance Ranking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentPerformance.map((agent, index) => (
              <Card key={agent.agentId} className={`p-4 border-l-4 ${
                index === 0 ? 'border-yellow-500 bg-yellow-50' :
                index === 1 ? 'border-gray-500 bg-gray-50' :
                'border-orange-500 bg-orange-50'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <Award className={`w-5 h-5 ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      'text-orange-600'
                    }`} />
                    <h4 className="font-medium text-gray-900">{agent.agentName}</h4>
                  </div>
                  <span className="text-sm font-bold text-blue-600">#{agent.rank}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Visits:</span>
                    <span className="font-medium">{agent.totalVisits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completion:</span>
                    <span className="font-medium text-green-600">{agent.completionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Satisfaction:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium">{agent.avgSatisfaction}/5.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className={`font-medium ${getQualityColor(agent.qualityScore)}`}>
                      {agent.qualityScore}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Order:</span>
                    <span className="font-medium">{formatCurrency(agent.avgOrderValue)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Customer Visit Insights */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Visit Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerInsights.map(customer => (
              <Card key={customer.customerId} className="p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{customer.customerName}</h4>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    customer.loyaltyScore >= 80 ? 'bg-green-100 text-green-800' :
                    customer.loyaltyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Loyalty: {customer.loyaltyScore}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Visits:</span>
                    <span className="font-medium">{customer.totalVisits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Satisfaction:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className={`font-medium ${getSatisfactionColor(customer.avgSatisfaction)}`}>
                        {customer.avgSatisfaction}/5.0
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">NPS Score:</span>
                    <span className="font-medium text-blue-600">{customer.avgNPS}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-medium text-green-600">{customer.orderConversionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Order:</span>
                    <span className="font-medium">{formatCurrency(customer.avgOrderValue)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Preferred Time:</div>
                  <div className="text-xs font-medium text-blue-600">{customer.preferredVisitTime}</div>
                  {customer.commonConcerns.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">Common Concerns:</div>
                      <div className="flex flex-wrap gap-1">
                        {customer.commonConcerns.slice(0, 2).map((concern, index) => (
                          <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            {concern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Visit Records Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Detailed Visit Records</h3>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Records
            </Button>
          </div>
          <DataTable
            data={visitRecords}
            columns={visitColumns}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}