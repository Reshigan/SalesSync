'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem, MobileButton, MobileInput, MobileFloatingActionButton } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { fieldAgentsService, Visit } from '@/services/field-agents.service'

import { 
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function VisitsManagementPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const { success, error } = useToast()
  const router = useRouter()

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadVisits()
  }, [statusFilter])

  const loadVisits = async () => {
    try {
      setIsLoading(true)
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await fieldAgentsService.getVisits(filters)
      setVisits(response || [])
    } catch (err) {
      error('Failed to load visits')
      console.error('Error loading visits:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateVisit = async (visitData: Partial<Visit>) => {
    try {
      await fieldAgentsService.createVisit(visitData)
      success('Visit created successfully')
      setShowCreateModal(false)
      loadVisits()
    } catch (err) {
      error('Failed to create visit')
      console.error('Error creating visit:', err)
    }
  }

  const handleStartVisit = async (id: string) => {
    try {
      // Get current location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          await fieldAgentsService.startVisit(id, coordinates)
          success('Visit started successfully')
          loadVisits()
        }, async () => {
          // Start without coordinates if location access denied
          await fieldAgentsService.startVisit(id)
          success('Visit started successfully')
          loadVisits()
        })
      } else {
        await fieldAgentsService.startVisit(id)
        success('Visit started successfully')
        loadVisits()
      }
    } catch (err) {
      error('Failed to start visit')
      console.error('Error starting visit:', err)
    }
  }

  const handleCompleteVisit = async (id: string) => {
    try {
      // Get current location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          await fieldAgentsService.completeVisit(id, { coordinates })
          success('Visit completed successfully')
          loadVisits()
        }, async () => {
          // Complete without coordinates if location access denied
          await fieldAgentsService.completeVisit(id, {})
          success('Visit completed successfully')
          loadVisits()
        })
      } else {
        await fieldAgentsService.completeVisit(id, {})
        success('Visit completed successfully')
        loadVisits()
      }
    } catch (err) {
      error('Failed to complete visit')
      console.error('Error completing visit:', err)
    }
  }

  const filteredVisits = visits.filter(visit =>
    visit.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.fieldAgentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED': return <Calendar className="h-4 w-4" />
      case 'IN_PROGRESS': return <Play className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const totalVisits = visits.length
  const completedVisits = visits.filter(v => v.status === 'COMPLETED').length
  const inProgressVisits = visits.filter(v => v.status === 'IN_PROGRESS').length
  const plannedVisits = visits.filter(v => v.status === 'PLANNED').length

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Visits" showBackButton>
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalVisits}</div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedVisits}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </MobileCard>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{inProgressVisits}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-purple-600">{plannedVisits}</div>
                <div className="text-sm text-gray-600">Planned</div>
              </MobileCard>
            </div>

            {/* Search */}
            <MobileInput
              placeholder="Search visits..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-5 h-5" />}
            />

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Visits List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <MobileList>
                {filteredVisits.map((visit) => (
                  <MobileListItem
                    key={visit.id}
                    title={`Visit to ${visit.customer?.name || 'Unknown Customer'}`}
                    subtitle={`Agent: ${visit.agent?.name || 'Unassigned'}`}
                    description={`${new Date(visit.scheduledDate).toLocaleDateString()} at ${new Date(visit.scheduledDate).toLocaleTimeString()}`}
                    badge={{
                      text: visit.status,
                      color: visit.status === 'COMPLETED' ? 'green' : 
                             visit.status === 'IN_PROGRESS' ? 'yellow' :
                             visit.status === 'CANCELLED' ? 'red' : 'blue'
                    }}
                    rightText={visit.location ? `📍 ${visit.location}` : ''}
                    onClick={() => router.push(`/field-agents/visits/${visit.id}`)}
                  />
                ))}
              </MobileList>
            )}

            {filteredVisits.length === 0 && !isLoading && (
              <MobileCard className="text-center py-8">
                <div className="text-gray-500">
                  No visits found matching your criteria.
                </div>
              </MobileCard>
            )}
          </div>

          {/* Floating Action Button */}
          <MobileFloatingActionButton
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-6 h-6" />}
          />
        </MobileLayout>
      </ErrorBoundary>
    );
  }

  // Desktop version
  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visit Management</h1>
              <p className="mt-2 text-gray-600">
                Schedule and track customer visits by field agents
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Schedule Visit
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                  <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedVisits}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{inProgressVisits}</p>
                </div>
                <Play className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planned</p>
                  <p className="text-2xl font-bold text-blue-600">{plannedVisits}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search visits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visits Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activities
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Customer {visit.customerId}
                              </div>
                              {visit.coordinates && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {visit.coordinates.latitude.toFixed(4)}, {visit.coordinates.longitude.toFixed(4)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Agent {visit.fieldAgentId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(visit.visitDate).toLocaleDateString()}
                          </div>
                          {visit.startTime && (
                            <div className="text-sm text-gray-500">
                              {visit.startTime} - {visit.endTime || 'Ongoing'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                            {getStatusIcon(visit.status)}
                            {visit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {visit.activities.length} activities
                          </div>
                          <div className="text-sm text-gray-500">
                            {visit.activities.filter(a => a.completed).length} completed
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {visit.startTime && visit.endTime ? 
                              `${Math.round((new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime()) / (1000 * 60))} min`
                              : visit.startTime ? 'In progress' : 'Not started'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/field-agents/visits/${visit.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {visit.status === 'PLANNED' && (
                              <button
                                onClick={() => handleStartVisit(visit.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Start Visit"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            {visit.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleCompleteVisit(visit.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Complete Visit"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/field-agents/visits/${visit.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredVisits.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No visits found matching your criteria.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}