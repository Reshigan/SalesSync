'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  Eye, 
  Truck, 
  Route,
  Clock,
  Users,
  Navigation,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Download,
  Upload,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface RouteStop {
  id: string
  customerId: string
  customerName: string
  address: string
  latitude: number
  longitude: number
  estimatedTime: string
  actualTime?: string
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
  orders: string[]
  notes?: string
}

interface VanRoute {
  id: string
  routeName: string
  routeCode: string
  agentId: string
  agentName: string
  vehicleId: string
  vehiclePlate: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate?: string
  startTime: string
  endTime?: string
  estimatedDuration: number
  actualDuration?: number
  totalDistance: number
  stops: RouteStop[]
  totalOrders: number
  totalValue: number
  fuelCost: number
  otherExpenses: number
  createdAt: string
  updatedAt: string
}

export default function VanSalesRoutesPage() {
  const [routes, setRoutes] = useState<VanRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [dateRange, setDateRange] = useState('today')
  const [sortBy, setSortBy] = useState('startDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([])

  const statuses = ['planned', 'active', 'completed', 'cancelled']
  const agents = ['John Smith', 'Mike Wilson', 'Sarah Johnson', 'Lisa Brown', 'David Lee']

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockRoutes: VanRoute[] = [
        {
          id: '1',
          routeName: 'Lagos Central Route',
          routeCode: 'LCR-001',
          agentId: '1',
          agentName: 'John Smith',
          vehicleId: '1',
          vehiclePlate: 'LAG-123-AB',
          status: 'active',
          startDate: '2025-01-06',
          startTime: '08:00',
          estimatedDuration: 480, // 8 hours in minutes
          actualDuration: 320, // 5 hours 20 minutes so far
          totalDistance: 85.5,
          stops: [
            {
              id: '1',
              customerId: '1',
              customerName: 'Acme Corporation',
              address: '123 Business District, Lagos',
              latitude: 6.5244,
              longitude: 3.3792,
              estimatedTime: '09:00',
              actualTime: '09:15',
              status: 'completed',
              orders: ['ORD-2025-001'],
              notes: 'Delivered successfully'
            },
            {
              id: '2',
              customerId: '2',
              customerName: 'Tech Solutions Ltd',
              address: '789 Tech Hub, Lagos',
              latitude: 6.4474,
              longitude: 3.3903,
              estimatedTime: '11:00',
              actualTime: '11:30',
              status: 'in-progress',
              orders: ['ORD-2025-003'],
              notes: 'Customer meeting in progress'
            },
            {
              id: '3',
              customerId: '3',
              customerName: 'Global Industries',
              address: '555 Industrial Zone, Lagos',
              latitude: 6.5795,
              longitude: 3.3211,
              estimatedTime: '14:00',
              status: 'pending',
              orders: ['ORD-2025-005']
            }
          ],
          totalOrders: 3,
          totalValue: 1196995,
          fuelCost: 15000,
          otherExpenses: 5000,
          createdAt: '2025-01-05T18:00:00Z',
          updatedAt: '2025-01-06T11:30:00Z',
        },
        {
          id: '2',
          routeName: 'Abuja North Route',
          routeCode: 'ANR-002',
          agentId: '2',
          agentName: 'Mike Wilson',
          vehicleId: '2',
          vehiclePlate: 'ABJ-456-CD',
          status: 'planned',
          startDate: '2025-01-07',
          startTime: '07:30',
          estimatedDuration: 420, // 7 hours
          totalDistance: 65.2,
          stops: [
            {
              id: '4',
              customerId: '4',
              customerName: 'Sarah Johnson',
              address: '456 Residential Ave, Abuja',
              latitude: 9.0765,
              longitude: 7.3986,
              estimatedTime: '09:00',
              status: 'pending',
              orders: ['ORD-2025-002']
            },
            {
              id: '5',
              customerId: '5',
              customerName: 'Local Business',
              address: '321 Market Street, Abuja',
              latitude: 9.0579,
              longitude: 7.4951,
              estimatedTime: '12:00',
              status: 'pending',
              orders: ['ORD-2025-006']
            }
          ],
          totalOrders: 2,
          totalValue: 87500,
          fuelCost: 12000,
          otherExpenses: 3000,
          createdAt: '2025-01-06T10:00:00Z',
          updatedAt: '2025-01-06T10:00:00Z',
        },
        {
          id: '3',
          routeName: 'Port Harcourt Express',
          routeCode: 'PHE-003',
          agentId: '3',
          agentName: 'Sarah Johnson',
          vehicleId: '3',
          vehiclePlate: 'PH-789-EF',
          status: 'completed',
          startDate: '2025-01-05',
          endDate: '2025-01-05',
          startTime: '08:00',
          endTime: '16:30',
          estimatedDuration: 450, // 7.5 hours
          actualDuration: 510, // 8.5 hours
          totalDistance: 95.8,
          stops: [
            {
              id: '6',
              customerId: '6',
              customerName: 'Marine Industries',
              address: '100 Port Complex, Port Harcourt',
              latitude: 4.8156,
              longitude: 7.0498,
              estimatedTime: '10:00',
              actualTime: '10:15',
              status: 'completed',
              orders: ['ORD-2025-007'],
              notes: 'Large delivery completed'
            },
            {
              id: '7',
              customerId: '7',
              customerName: 'Oil Services Co',
              address: '200 Energy Street, Port Harcourt',
              latitude: 4.8396,
              longitude: 6.9569,
              estimatedTime: '13:00',
              actualTime: '13:45',
              status: 'completed',
              orders: ['ORD-2025-008'],
              notes: 'Payment collected'
            }
          ],
          totalOrders: 2,
          totalValue: 450000,
          fuelCost: 18000,
          otherExpenses: 7500,
          createdAt: '2025-01-04T16:00:00Z',
          updatedAt: '2025-01-05T16:30:00Z',
        }
      ]
      
      setRoutes(mockRoutes)
    } catch (error) {
      toast.error('Failed to load routes')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.routeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || route.status === selectedStatus
    const matchesAgent = selectedAgent === 'all' || route.agentName === selectedAgent
    
    return matchesSearch && matchesStatus && matchesAgent
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof VanRoute]
    const bValue = b[sortBy as keyof VanRoute]
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleCreateRoute = () => {
    toast.success('Create route functionality coming soon!')
  }

  const handleEditRoute = (routeId: string) => {
    toast.success(`Edit route ${routeId} functionality coming soon!`)
  }

  const handleDeleteRoute = (routeId: string) => {
    toast.success(`Delete route ${routeId} functionality coming soon!`)
  }

  const handleViewRoute = (routeId: string) => {
    toast.success(`View route ${routeId} details functionality coming soon!`)
  }

  const handleStartRoute = (routeId: string) => {
    toast.success(`Start route ${routeId} functionality coming soon!`)
  }

  const handlePauseRoute = (routeId: string) => {
    toast.success(`Pause route ${routeId} functionality coming soon!`)
  }

  const handleCompleteRoute = (routeId: string) => {
    toast.success(`Complete route ${routeId} functionality coming soon!`)
  }

  const handleBulkAction = (action: string) => {
    if (selectedRoutes.length === 0) {
      toast.error('Please select routes first')
      return
    }
    toast.success(`${action} ${selectedRoutes.length} routes functionality coming soon!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Calendar className="w-4 h-4" />
      case 'active': return <Play className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'skipped': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading routes..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Van Sales Routes</h1>
            <p className="text-gray-600 mt-1">
              Plan and manage delivery routes for field agents
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Export')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Optimize')}
            >
              <Route className="w-4 h-4 mr-2" />
              Optimize
            </Button>
            <Button onClick={handleCreateRoute}>
              <Plus className="w-4 h-4 mr-2" />
              New Route
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Routes</p>
                  <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
                </div>
                <Route className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Routes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.filter(r => r.status === 'active').length}
                  </p>
                </div>
                <Play className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.reduce((sum, r) => sum + r.totalDistance, 0).toFixed(1)} km
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Route Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(routes.reduce((sum, r) => sum + r.totalValue, 0))}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search routes by name, code, agent, or vehicle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Agents</option>
                  {agents.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="startDate-desc">Newest First</option>
                  <option value="startDate-asc">Oldest First</option>
                  <option value="totalValue-desc">Highest Value</option>
                  <option value="totalValue-asc">Lowest Value</option>
                  <option value="routeName-asc">Name A-Z</option>
                  <option value="routeName-desc">Name Z-A</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedRoutes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedRoutes.length} routes selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Start')}
                  >
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Optimize')}
                  >
                    Optimize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Export')}
                  >
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleBulkAction('Cancel')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Routes List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRoutes.includes(route.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoutes([...selectedRoutes, route.id])
                        } else {
                          setSelectedRoutes(selectedRoutes.filter(id => id !== route.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{route.routeName}</h3>
                      <p className="text-sm text-gray-600">{route.routeCode}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(route.status)}>
                      {getStatusIcon(route.status)}
                      <span className="ml-1">
                        {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                      </span>
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      {route.status === 'planned' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartRoute(route.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {route.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePauseRoute(route.id)}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteRoute(route.id)}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewRoute(route.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditRoute(route.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Route Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{route.agentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{route.vehiclePlate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{route.totalDistance} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                    </span>
                  </div>
                </div>

                {/* Route Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Stops</p>
                    <p className="text-lg font-semibold text-gray-900">{route.stops.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Orders</p>
                    <p className="text-lg font-semibold text-gray-900">{route.totalOrders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Value</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(route.totalValue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Expenses</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(route.fuelCost + route.otherExpenses)}
                    </p>
                  </div>
                </div>

                {/* Route Stops */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Route Stops</h4>
                  <div className="space-y-2">
                    {route.stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{stop.customerName}</p>
                            <p className="text-sm text-gray-600">{stop.address}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-900">
                              Est: {stop.estimatedTime}
                            </p>
                            {stop.actualTime && (
                              <p className="text-sm text-gray-600">
                                Act: {stop.actualTime}
                              </p>
                            )}
                          </div>
                          <Badge className={getStopStatusColor(stop.status)}>
                            {stop.status.charAt(0).toUpperCase() + stop.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRoutes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedAgent !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first route'
                }
              </p>
              <Button onClick={handleCreateRoute}>
                <Plus className="w-4 h-4 mr-2" />
                New Route
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}