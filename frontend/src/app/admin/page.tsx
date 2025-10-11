'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import customerService from '@/services/customer.service'
import visitService from '@/services/visit.service'
import boardService from '@/services/board.service'
import productService from '@/services/product.service'
import commissionService from '@/services/commission.service'

import { 
  Users,
  Calendar,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  UserPlus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Award,
  Zap
} from 'lucide-react'

interface AdminStats {
  totalAgents: number
  activeAgents: number
  totalCustomers: number
  newCustomersThisMonth: number
  totalVisits: number
  visitsToday: number
  completedVisits: number
  pendingVisits: number
  totalBoards: number
  activeBoardPlacements: number
  totalProducts: number
  productDistributionsToday: number
  totalCommissions: number
  paidCommissions: number
  pendingCommissions: number
  averageCommissionPerAgent: number
  topPerformingAgents: Array<{
    id: string
    name: string
    totalCommissions: number
    visitsCompleted: number
    boardPlacements: number
  }>
  recentActivities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    agentName: string
  }>
  monthlyTrends: {
    visits: Array<{ month: string; count: number }>
    commissions: Array<{ month: string; amount: number }>
    customers: Array<{ month: string; count: number }>
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const { success, error } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadAdminStats()
  }, [selectedTimeRange])

  const loadAdminStats = async () => {
    try {
      setIsLoading(true)
      
      // Load data from multiple services in parallel
      const [
        customersResponse,
        visitsResponse,
        boardsResponse,
        productsResponse,
        commissionsResponse
      ] = await Promise.all([
        customerService.getCustomers({ limit: 1 }), // Just for count
        visitService.getVisits({ limit: 1 }), // Just for count
        boardService.getBoards({ limit: 1 }), // Just for count
        productService.getProducts({ limit: 1 }), // Just for count
        commissionService.getCommissions({ limit: 1 }) // Just for count
      ])

      // Get additional analytics
      const [
        customerAnalytics,
        visitAnalytics,
        boardAnalytics,
        commissionSummary
      ] = await Promise.all([
        customerService.getCustomerAnalytics('all').catch(() => ({})),
        visitService.getVisitAnalytics().catch(() => ({})),
        boardService.getBoardAnalytics().catch(() => ({})),
        commissionService.getCommissionSummary().catch(() => ({}))
      ])

      // Compile comprehensive stats
      const adminStats: AdminStats = {
        totalAgents: 25, // This would come from user service
        activeAgents: 18,
        totalCustomers: customersResponse.total,
        newCustomersThisMonth: customerAnalytics?.newThisMonth || 0,
        totalVisits: visitsResponse.total,
        visitsToday: visitAnalytics?.visitsToday || 0,
        completedVisits: visitAnalytics?.completedVisits || 0,
        pendingVisits: visitAnalytics?.pendingVisits || 0,
        totalBoards: boardsResponse.total,
        activeBoardPlacements: boardAnalytics?.activePlacements || 0,
        totalProducts: productsResponse.total,
        productDistributionsToday: 45, // This would come from product analytics
        totalCommissions: commissionSummary?.totalEarnings || 0,
        paidCommissions: commissionSummary?.paidCommissions || 0,
        pendingCommissions: commissionSummary?.pendingCommissions || 0,
        averageCommissionPerAgent: (commissionSummary?.totalEarnings || 0) / 25,
        topPerformingAgents: [
          {
            id: 'agent-1',
            name: 'John Smith',
            totalCommissions: 2500,
            visitsCompleted: 45,
            boardPlacements: 12
          },
          {
            id: 'agent-2',
            name: 'Sarah Johnson',
            totalCommissions: 2200,
            visitsCompleted: 38,
            boardPlacements: 10
          },
          {
            id: 'agent-3',
            name: 'Mike Davis',
            totalCommissions: 1950,
            visitsCompleted: 42,
            boardPlacements: 8
          }
        ],
        recentActivities: [
          {
            id: 'activity-1',
            type: 'VISIT_COMPLETED',
            description: 'Completed visit at ABC Store',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            agentName: 'John Smith'
          },
          {
            id: 'activity-2',
            type: 'BOARD_PLACED',
            description: 'Placed banner board at XYZ Market',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            agentName: 'Sarah Johnson'
          },
          {
            id: 'activity-3',
            type: 'PRODUCT_DISTRIBUTED',
            description: 'Distributed 50 SIM cards',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            agentName: 'Mike Davis'
          }
        ],
        monthlyTrends: {
          visits: [
            { month: 'Jan', count: 120 },
            { month: 'Feb', count: 135 },
            { month: 'Mar', count: 158 },
            { month: 'Apr', count: 142 },
            { month: 'May', count: 167 },
            { month: 'Jun', count: 189 }
          ],
          commissions: [
            { month: 'Jan', amount: 15000 },
            { month: 'Feb', amount: 18500 },
            { month: 'Mar', amount: 22000 },
            { month: 'Apr', amount: 19500 },
            { month: 'May', amount: 25000 },
            { month: 'Jun', amount: 28500 }
          ],
          customers: [
            { month: 'Jan', count: 45 },
            { month: 'Feb', count: 52 },
            { month: 'Mar', count: 38 },
            { month: 'Apr', count: 61 },
            { month: 'May', count: 47 },
            { month: 'Jun', count: 55 }
          ]
        }
      }

      setStats(adminStats)
      
    } catch (err) {
      console.error('Error loading admin stats:', err)
      error('Failed to load dashboard statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'VISIT_COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'BOARD_PLACED': return <MapPin className="h-4 w-4 text-blue-600" />
      case 'PRODUCT_DISTRIBUTED': return <Package className="h-4 w-4 text-purple-600" />
      case 'COMMISSION_PAID': return <DollarSign className="h-4 w-4 text-emerald-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">Unable to load dashboard statistics</p>
          <button
            onClick={loadAdminStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive overview of field marketing operations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <button
                onClick={() => router.push('/admin/settings')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.activeAgents}</div>
                  <div className="text-sm text-gray-600">Active Agents</div>
                  <div className="text-xs text-gray-500">of {stats.totalAgents} total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.visitsToday}</div>
                  <div className="text-sm text-gray-600">Visits Today</div>
                  <div className="text-xs text-gray-500">{stats.completedVisits} completed</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-50">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                  <div className="text-xs text-green-600">+{stats.newCustomersThisMonth} this month</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-50">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.activeBoardPlacements}</div>
                  <div className="text-sm text-gray-600">Active Boards</div>
                  <div className="text-xs text-gray-500">of {stats.totalBoards} total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-cyan-50">
                  <Package className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.productDistributionsToday}</div>
                  <div className="text-sm text-gray-600">Products Today</div>
                  <div className="text-xs text-gray-500">{stats.totalProducts} available</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-emerald-50">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">${stats.totalCommissions.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Commissions</div>
                  <div className="text-xs text-yellow-600">${stats.pendingCommissions.toLocaleString()} pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Visits</span>
                    <span>{stats.monthlyTrends.visits[stats.monthlyTrends.visits.length - 1]?.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Commissions</span>
                    <span>${stats.monthlyTrends.commissions[stats.monthlyTrends.commissions.length - 1]?.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>New Customers</span>
                    <span>{stats.monthlyTrends.customers[stats.monthlyTrends.customers.length - 1]?.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: '65%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Agents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Agents</h3>
                <Award className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {stats.topPerformingAgents.map((agent, index) => (
                  <div key={agent.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.visitsCompleted} visits • {agent.boardPlacements} boards
                      </div>
                    </div>
                    
                    <div className="text-sm font-semibold text-green-600">
                      ${agent.totalCommissions.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{activity.agentName}</span> {activity.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/admin/activities')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all activities →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/agents')}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Manage Agents</div>
                <div className="text-xs text-gray-500">Add, edit, or deactivate agents</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/reports')}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Generate Reports</div>
                <div className="text-xs text-gray-500">Export data and analytics</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/products')}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Package className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Product Catalog</div>
                <div className="text-xs text-gray-500">Manage products and inventory</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/commissions')}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="h-6 w-6 text-emerald-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Commission Settings</div>
                <div className="text-xs text-gray-500">Configure rates and rules</div>
              </div>
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}
