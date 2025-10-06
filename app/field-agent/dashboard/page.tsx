'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { usePWA } from '@/components/providers/PWAProvider'
import { useOffline } from '@/components/providers/OfflineProvider'
import { 
  MapPin, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Navigation,
  Battery,
  Wifi,
  WifiOff,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  Plus,
  Route,
  Package,
  Calendar,
  Phone,
  Mail,
  Star
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TodayStats {
  visitsPending: number
  visitsCompleted: number
  ordersCreated: number
  salesAmount: number
  targetAmount: number
  distanceTraveled: number
  timeOnRoute: number
  customersVisited: number
}

interface UpcomingVisit {
  id: string
  customerId: string
  customerName: string
  address: string
  scheduledTime: string
  estimatedDuration: number
  priority: 'low' | 'medium' | 'high'
  visitType: 'sales' | 'delivery' | 'collection' | 'service'
  notes?: string
  distance: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  amount: number
  status: string
  createdAt: string
}

export default function FieldAgentDashboardPage() {
  const { user } = useAuth()
  const { isOnline, isInstalled } = usePWA()
  const { pendingOperations } = useOffline()
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [routeStatus, setRouteStatus] = useState<'not-started' | 'active' | 'paused' | 'completed'>('not-started')

  useEffect(() => {
    loadDashboardData()
    getCurrentLocation()
    getBatteryLevel()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        visitsPending: 8,
        visitsCompleted: 3,
        ordersCreated: 5,
        salesAmount: 125400,
        targetAmount: 200000,
        distanceTraveled: 45.2,
        timeOnRoute: 4.5,
        customersVisited: 3,
      })

      setUpcomingVisits([
        {
          id: '1',
          customerId: '1',
          customerName: 'Acme Corporation',
          address: '123 Business District, Lagos',
          scheduledTime: '14:00',
          estimatedDuration: 45,
          priority: 'high',
          visitType: 'sales',
          notes: 'Follow up on large order proposal',
          distance: 2.3,
        },
        {
          id: '2',
          customerId: '2',
          customerName: 'Tech Solutions Ltd',
          address: '789 Tech Hub, Lagos',
          scheduledTime: '15:30',
          estimatedDuration: 30,
          priority: 'medium',
          visitType: 'delivery',
          notes: 'Deliver ordered items',
          distance: 5.7,
        },
        {
          id: '3',
          customerId: '3',
          customerName: 'Local Store',
          address: '456 Market Street, Lagos',
          scheduledTime: '16:30',
          estimatedDuration: 20,
          priority: 'low',
          visitType: 'collection',
          notes: 'Collect payment for previous order',
          distance: 3.1,
        },
      ])

      setRecentOrders([
        {
          id: '1',
          orderNumber: 'ORD-2025-001',
          customerId: '1',
          customerName: 'Morning Coffee Shop',
          amount: 25600,
          status: 'confirmed',
          createdAt: '2025-01-06T10:30:00Z',
        },
        {
          id: '2',
          orderNumber: 'ORD-2025-002',
          customerId: '2',
          customerName: 'Office Supplies Co',
          amount: 45800,
          status: 'pending',
          createdAt: '2025-01-06T11:15:00Z',
        },
        {
          id: '3',
          orderNumber: 'ORD-2025-003',
          customerId: '3',
          customerName: 'Restaurant Chain',
          amount: 54000,
          status: 'confirmed',
          createdAt: '2025-01-06T12:00:00Z',
        },
      ])
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const getBatteryLevel = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        setBatteryLevel(Math.round(battery.level * 100))
      } catch (error) {
        console.error('Error getting battery level:', error)
      }
    }
  }

  const handleStartRoute = () => {
    setRouteStatus('active')
    toast.success('Route started! GPS tracking enabled.')
  }

  const handlePauseRoute = () => {
    setRouteStatus('paused')
    toast.success('Route paused.')
  }

  const handleCompleteRoute = () => {
    setRouteStatus('completed')
    toast.success('Route completed! Great work today!')
  }

  const handleStartVisit = (visitId: string) => {
    toast.success(`Started visit ${visitId}`)
  }

  const handleCreateOrder = () => {
    toast.success('Create order functionality coming soon!')
  }

  const handleViewCustomer = (customerId: string) => {
    toast.success(`View customer ${customerId} details functionality coming soon!`)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVisitTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <Target className="w-4 h-4" />
      case 'delivery': return <Package className="w-4 h-4" />
      case 'collection': return <DollarSign className="w-4 h-4" />
      case 'service': return <Users className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading field agent dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Mobile-First Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Good afternoon, {user?.name}!</h1>
              <p className="text-blue-100">Field Agent Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-300" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-300" />
              )}
              
              {/* PWA Status */}
              {isInstalled && (
                <Smartphone className="w-5 h-5 text-blue-300" />
              )}
              
              {/* Battery Level */}
              {batteryLevel !== null && (
                <div className="flex items-center gap-1">
                  <Battery className="w-5 h-5 text-white" />
                  <span className="text-sm">{batteryLevel}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Route Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white">
                {routeStatus === 'not-started' && 'Ready to Start'}
                {routeStatus === 'active' && 'Route Active'}
                {routeStatus === 'paused' && 'Route Paused'}
                {routeStatus === 'completed' && 'Route Completed'}
              </Badge>
              {pendingOperations.length > 0 && (
                <Badge className="bg-yellow-500 text-white">
                  {pendingOperations.length} pending sync
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {routeStatus === 'not-started' && (
                <Button
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={handleStartRoute}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start Route
                </Button>
              )}
              {routeStatus === 'active' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                    onClick={handlePauseRoute}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-50"
                    onClick={handleCompleteRoute}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                </>
              )}
              {routeStatus === 'paused' && (
                <Button
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={handleStartRoute}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visits</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.visitsCompleted}/{stats.visitsPending + stats.visitsCompleted}
                  </p>
                </div>
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.visitsCompleted / (stats.visitsPending + stats.visitsCompleted)) * 100}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sales Target</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.round((stats.salesAmount / stats.targetAmount) * 100)}%
                  </p>
                </div>
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((stats.salesAmount / stats.targetAmount) * 100, 100)}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders</p>
                  <p className="text-xl font-bold text-gray-900">{stats.ordersCreated}</p>
                </div>
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Distance</p>
                  <p className="text-xl font-bold text-gray-900">{stats.distanceTraveled} km</p>
                </div>
                <Navigation className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Today's Sales Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.salesAmount)}
                </p>
                <p className="text-sm text-gray-600">Sales Amount</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.targetAmount - stats.salesAmount)}
                </p>
                <p className="text-sm text-gray-600">Remaining Target</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.customersVisited}
                </p>
                <p className="text-sm text-gray-600">Customers Visited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Visits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Visits</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {upcomingVisits.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingVisits.map((visit) => (
                <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{visit.customerName}</h4>
                        <Badge className={getPriorityColor(visit.priority)}>
                          {visit.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{visit.address}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{visit.scheduledTime} ({visit.estimatedDuration}min)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          <span>{visit.distance} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getVisitTypeIcon(visit.visitType)}
                          <span>{visit.visitType}</span>
                        </div>
                      </div>
                      {visit.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{visit.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCustomer(visit.customerId)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStartVisit(visit.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Button
                size="sm"
                onClick={handleCreateOrder}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Order
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt, 'time')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(order.amount)}
                    </p>
                    <Badge className={order.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={handleCreateOrder}
              >
                <ShoppingCart className="w-6 h-6 mb-1" />
                <span>New Order</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => toast.success('Customer lookup functionality coming soon!')}
              >
                <Users className="w-6 h-6 mb-1" />
                <span>Find Customer</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => toast.success('Expense tracking functionality coming soon!')}
              >
                <DollarSign className="w-6 h-6 mb-1" />
                <span>Log Expense</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col"
                onClick={() => toast.success('Route optimization functionality coming soon!')}
              >
                <Route className="w-6 h-6 mb-1" />
                <span>Optimize Route</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}