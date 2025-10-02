'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth.store'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { RealTimeDemo } from '@/components/ui/RealTimeDemo'
import { HydrationBoundary } from '@/components/ui/HydrationBoundary'
import apiService from '@/lib/api'
import { 
  Truck, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  Megaphone
} from 'lucide-react'

interface DashboardData {
  overview: {
    totalUsers: number;
    totalCustomers: number;
    totalProducts: number;
    totalOrders: number;
    todayOrders: number;
    todayRevenue: number;
    activeAgents: number;
  };
  recentOrders: any[];
  topCustomers: any[];
  salesByMonth: any[];
  agentPerformance: any[];
}

export default function DashboardPage() {
  const { userRole, user } = usePermissions()
  const { _hasHydrated } = useAuthStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data when user is authenticated and store is hydrated
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Wait for store to be hydrated
      if (!_hasHydrated) {
        console.log('Dashboard: Store not hydrated yet, waiting...')
        return
      }

      // Only fetch if user is authenticated and we have a token
      if (!user || !user.id) {
        console.log('Dashboard: User not authenticated yet, skipping API call', { user })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log('Dashboard: Fetching data for authenticated user:', user.firstName)
        
        const response = await apiService.getDashboard()
        
        if (response.error) {
          console.error('Dashboard API error:', response.error)
          setError(response.error)
        } else if (response.data) {
          console.log('Dashboard: Data loaded successfully:', response.data)
          setDashboardData(response.data)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, _hasHydrated]) // Depend on user being available and store being hydrated

  const [recentActivities] = useState([
    {
      id: '1',
      type: 'van_load',
      agent: 'John Doe',
      description: 'Van loaded with 45 products',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      id: '2',
      type: 'promotion',
      agent: 'Sarah Wilson',
      description: 'Campaign activity completed at Store #123',
      time: '3 hours ago',
      status: 'pending_review',
    },
    {
      id: '3',
      type: 'merchandising',
      agent: 'Mike Johnson',
      description: 'Shelf audit completed - 85% compliance',
      time: '4 hours ago',
      status: 'completed',
    },
    {
      id: '4',
      type: 'reconciliation',
      agent: 'David Brown',
      description: 'Cash reconciliation - $50 variance',
      time: '5 hours ago',
      status: 'discrepancy',
    },
  ])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleSpecificStats = () => {
    switch (userRole) {
      case 'van_sales':
        return [
          {
            name: 'Today\'s Sales',
            value: '$4,250',
            change: '+12%',
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            name: 'Orders Completed',
            value: '23',
            change: '+8%',
            icon: CheckCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            name: 'Customers Visited',
            value: '18',
            change: '+5%',
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
          {
            name: 'Pending Reconciliation',
            value: '1',
            change: '',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
        ]
      
      case 'promoter':
        return [
          {
            name: 'Activities Today',
            value: '8',
            change: '+15%',
            icon: Megaphone,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            name: 'Samples Distributed',
            value: '156',
            change: '+22%',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            name: 'Surveys Completed',
            value: '34',
            change: '+18%',
            icon: CheckCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
          {
            name: 'Pending Approval',
            value: '3',
            change: '',
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
        ]
      
      case 'merchandiser':
        return [
          {
            name: 'Stores Visited',
            value: '12',
            change: '+10%',
            icon: Eye,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            name: 'Avg Compliance',
            value: '87%',
            change: '+3%',
            icon: BarChart3,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            name: 'Issues Identified',
            value: '7',
            change: '-15%',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
          {
            name: 'Photos Captured',
            value: '45',
            change: '+25%',
            icon: Package,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
        ]
      
      default:
        return [
          {
            name: 'Today\'s Revenue',
            value: dashboardData?.overview?.todayRevenue ? `$${dashboardData.overview.todayRevenue.toLocaleString()}` : '$0',
            change: '+12%',
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            name: 'Active Agents',
            value: dashboardData?.overview?.activeAgents?.toString() || '0',
            change: '+5%',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            name: 'Total Orders',
            value: dashboardData?.overview?.totalOrders?.toString() || '0',
            change: '+8%',
            icon: Package,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
          {
            name: 'Today\'s Orders',
            value: dashboardData?.overview?.todayOrders?.toString() || '0',
            change: '',
            icon: CheckCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
        ]
    }
  }

  const roleStats = getRoleSpecificStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'pending_review':
        return 'text-yellow-600 bg-yellow-50'
      case 'discrepancy':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'van_load':
        return <Truck className="w-4 h-4" />
      case 'promotion':
        return <Megaphone className="w-4 h-4" />
      case 'merchandising':
        return <Eye className="w-4 h-4" />
      case 'reconciliation':
        return <DollarSign className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold">Loading Dashboard...</h1>
            <p className="text-primary-100 mt-1">Please wait while we fetch your data.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-800">Error Loading Dashboard</h1>
            <p className="text-red-600 mt-1">{typeof error === 'string' ? error : 'Failed to load dashboard data'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <HydrationBoundary fallback={
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold">Loading Dashboard...</h1>
            <p className="text-primary-100 mt-1">Please wait while we initialize your dashboard.</p>
          </div>
        </div>
      }>
        <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-primary-100 mt-1">
            Here's what's happening with your {userRole?.replace('_', ' ')} operations today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleStats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {stat.change} from last week
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.agent} • {activity.time}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {userRole === 'van_sales' && (
                    <>
                      <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Truck className="w-5 h-5 text-primary-600" />
                          <span className="text-sm font-medium">Load Van</span>
                        </div>
                      </button>
                      <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Reconcile Cash</span>
                        </div>
                      </button>
                    </>
                  )}
                  
                  {userRole === 'promoter' && (
                    <>
                      <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Megaphone className="w-5 h-5 text-primary-600" />
                          <span className="text-sm font-medium">Start Activity</span>
                        </div>
                      </button>
                      <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Log Samples</span>
                        </div>
                      </button>
                    </>
                  )}
                  
                  {userRole === 'merchandiser' && (
                    <>
                      <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Eye className="w-5 h-5 text-primary-600" />
                          <span className="text-sm font-medium">Start Audit</span>
                        </div>
                      </button>
                      <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <BarChart3 className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Check Compliance</span>
                        </div>
                      </button>
                    </>
                  )}
                  
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">View Reports</span>
                    </div>
                  </button>
                </div>
              </Card.Content>
            </Card>

            {/* Alerts */}
            <Card className="mt-6">
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Low Stock Alert</p>
                      <p className="text-sm text-red-700">12 products below minimum level</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Pending Approvals</p>
                      <p className="text-sm text-yellow-700">5 activities need review</p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Real-time Demo Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Features Demo</h2>
          <RealTimeDemo />
        </div>
        </div>
      </HydrationBoundary>
    </DashboardLayout>
  )
}