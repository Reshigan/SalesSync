import { useState, useEffect } from 'react'
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  User,
  Battery,
  Signal,
  RefreshCw,
  Search,
  Route,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Target
} from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

interface FieldAgent {
  id: string
  name: string
  phone: string
  email: string
  status: 'active' | 'inactive' | 'offline'
  location: {
    lat: number
    lng: number
    address: string
    timestamp: string
  }
  route: {
    id: string
    name: string
    customers_planned: number
    customers_visited: number
    progress: number
  }
  device: {
    battery_level: number
    signal_strength: number
    last_sync: string
  }
  performance: {
    visits_today: number
    sales_today: number
    distance_traveled: number
    efficiency_score: number
  }
}

interface CustomerVisit {
  id: string
  customer_name: string
  address: string
  visit_time: string
  status: 'planned' | 'in_progress' | 'completed' | 'skipped'
  duration: number
  sales_amount: number
  notes: string
}

export default function LiveMappingPage() {
  const [agents, setAgents] = useState<FieldAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<FieldAgent | null>(null)
  const [visits, setVisits] = useState<CustomerVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAgentsData()
    // Set up real-time updates (mock)
    const interval = setInterval(() => {
      if (!refreshing) {
        updateAgentLocations()
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadAgentsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for field agents
      const mockAgents: FieldAgent[] = [
        {
          id: '1',
          name: 'John Smith',
          phone: '+1-555-0101',
          email: 'john.smith@company.com',
          status: 'active',
          location: {
            lat: 40.7128,
            lng: -74.0060,
            address: '123 Main St, New York, NY',
            timestamp: new Date().toISOString()
          },
          route: {
            id: 'route-1',
            name: 'Manhattan North',
            customers_planned: 12,
            customers_visited: 8,
            progress: 67
          },
          device: {
            battery_level: 85,
            signal_strength: 4,
            last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          performance: {
            visits_today: 8,
            sales_today: 2500,
            distance_traveled: 45.2,
            efficiency_score: 92
          }
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '+1-555-0102',
          email: 'sarah.johnson@company.com',
          status: 'active',
          location: {
            lat: 40.7589,
            lng: -73.9851,
            address: '456 Broadway, New York, NY',
            timestamp: new Date().toISOString()
          },
          route: {
            id: 'route-2',
            name: 'Manhattan South',
            customers_planned: 10,
            customers_visited: 6,
            progress: 60
          },
          device: {
            battery_level: 92,
            signal_strength: 5,
            last_sync: new Date(Date.now() - 2 * 60 * 1000).toISOString()
          },
          performance: {
            visits_today: 6,
            sales_today: 1800,
            distance_traveled: 32.1,
            efficiency_score: 88
          }
        },
        {
          id: '3',
          name: 'Mike Davis',
          phone: '+1-555-0103',
          email: 'mike.davis@company.com',
          status: 'inactive',
          location: {
            lat: 40.6892,
            lng: -74.0445,
            address: '789 Liberty St, Jersey City, NJ',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          route: {
            id: 'route-3',
            name: 'Jersey City',
            customers_planned: 8,
            customers_visited: 3,
            progress: 38
          },
          device: {
            battery_level: 23,
            signal_strength: 2,
            last_sync: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          },
          performance: {
            visits_today: 3,
            sales_today: 950,
            distance_traveled: 18.7,
            efficiency_score: 65
          }
        }
      ]

      const mockVisits: CustomerVisit[] = [
        {
          id: '1',
          customer_name: 'ABC Electronics',
          address: '100 Tech Ave, New York, NY',
          visit_time: '09:00 AM',
          status: 'completed',
          duration: 45,
          sales_amount: 850,
          notes: 'Successful sale, customer interested in new products'
        },
        {
          id: '2',
          customer_name: 'XYZ Retail',
          address: '200 Commerce St, New York, NY',
          visit_time: '10:30 AM',
          status: 'completed',
          duration: 30,
          sales_amount: 650,
          notes: 'Regular order placed'
        },
        {
          id: '3',
          customer_name: 'Tech Solutions Inc',
          address: '300 Innovation Blvd, New York, NY',
          visit_time: '12:00 PM',
          status: 'in_progress',
          duration: 0,
          sales_amount: 0,
          notes: 'Currently presenting new product line'
        },
        {
          id: '4',
          customer_name: 'Global Distributors',
          address: '400 Trade Center, New York, NY',
          visit_time: '02:00 PM',
          status: 'planned',
          duration: 0,
          sales_amount: 0,
          notes: 'Scheduled for product demonstration'
        }
      ]
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAgents(mockAgents)
      setVisits(mockVisits)
      if (mockAgents.length > 0) {
        setSelectedAgent(mockAgents[0])
      }
    } catch (err) {
      setError('Failed to load field agents data')
      console.error('Error loading agents:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateAgentLocations = async () => {
    // Mock real-time location updates
    setAgents(prevAgents => 
      prevAgents.map(agent => ({
        ...agent,
        location: {
          ...agent.location,
          timestamp: new Date().toISOString()
        },
        device: {
          ...agent.device,
          last_sync: new Date().toISOString()
        }
      }))
    )
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAgentsData()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-yellow-600 bg-yellow-100'
      case 'offline': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'planned': return 'text-gray-600 bg-gray-100'
      case 'skipped': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.phone.includes(searchTerm) ||
                         agent.route.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Mapping</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time field agent tracking and route management.
          </p>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Live Mapping
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadAgentsData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Mapping</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time field agent tracking and route management with live location updates.
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="btn-outline p-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents by name, phone, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Field Agents ({filteredAgents.length})</h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedAgent?.id === agent.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.route.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Battery className="h-3 w-3" />
                        <span>{agent.device.battery_level}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>Last seen: {formatTime(agent.location.timestamp)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3" />
                      <span>{agent.route.customers_visited}/{agent.route.customers_planned}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <div className="space-y-6">
              {/* Agent Info Card */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selectedAgent.name}</h3>
                        <p className="text-gray-600">{selectedAgent.route.name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Phone className="h-4 w-4" />
                            <span>{selectedAgent.phone}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAgent.status)}`}>
                            {selectedAgent.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="btn-outline p-2">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="btn-outline p-2">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedAgent.performance.visits_today}</div>
                      <div className="text-sm text-gray-500">Visits Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedAgent.performance.sales_today)}</div>
                      <div className="text-sm text-gray-500">Sales Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedAgent.performance.distance_traveled} km</div>
                      <div className="text-sm text-gray-500">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedAgent.performance.efficiency_score}%</div>
                      <div className="text-sm text-gray-500">Efficiency</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Progress */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Route Progress</h4>
                    <div className="flex items-center space-x-2">
                      <Route className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedAgent.route.progress}% Complete</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedAgent.route.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Visited: {selectedAgent.route.customers_visited}</span>
                    <span>Remaining: {selectedAgent.route.customers_planned - selectedAgent.route.customers_visited}</span>
                    <span>Total: {selectedAgent.route.customers_planned}</span>
                  </div>
                </div>
              </div>

              {/* Device Status */}
              <div className="card">
                <div className="p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Device Status</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <Battery className={`h-5 w-5 ${selectedAgent.device.battery_level > 20 ? 'text-green-500' : 'text-red-500'}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{selectedAgent.device.battery_level}%</div>
                        <div className="text-xs text-gray-500">Battery</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Signal className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{selectedAgent.device.signal_strength}/5</div>
                        <div className="text-xs text-gray-500">Signal</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatTime(selectedAgent.device.last_sync)}</div>
                        <div className="text-xs text-gray-500">Last Sync</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an Agent
                </h3>
                <p className="text-gray-600">
                  Choose a field agent from the list to view their live location and details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Visits */}
      {selectedAgent && (
        <div className="card">
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-6">Today's Customer Visits</h4>
            
            <div className="space-y-4">
              {visits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {visit.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {visit.status === 'in_progress' && <Clock className="h-5 w-5 text-blue-500" />}
                      {visit.status === 'planned' && <Calendar className="h-5 w-5 text-gray-500" />}
                      {visit.status === 'skipped' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{visit.customer_name}</div>
                      <div className="text-xs text-gray-500">{visit.address}</div>
                      <div className="text-xs text-gray-500 mt-1">{visit.notes}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{visit.visit_time}</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVisitStatusColor(visit.status)}`}>
                      {visit.status.replace('_', ' ')}
                    </span>
                    {visit.sales_amount > 0 && (
                      <div className="text-xs text-green-600 mt-1">{formatCurrency(visit.sales_amount)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
