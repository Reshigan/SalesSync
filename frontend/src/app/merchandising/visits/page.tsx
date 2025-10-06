'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { VisitForm } from '@/components/merchandising/VisitForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { merchandisingService, Visit } from '@/services/merchandising.service'
import toast from 'react-hot-toast'
import { 
  MapPin, 
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  Camera
} from 'lucide-react'

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null)

  // Stats
  const stats = {
    total: visits.length,
    scheduled: visits.filter(v => v.status === 'scheduled').length,
    inProgress: visits.filter(v => v.status === 'in_progress').length,
    completed: visits.filter(v => v.status === 'completed').length,
    avgDuration: visits.filter(v => v.duration).length > 0 
      ? visits.filter(v => v.duration).reduce((sum, v) => sum + (v.duration || 0), 0) / visits.filter(v => v.duration).length 
      : 0
  }

  useEffect(() => {
    loadVisits()
  }, [filterStatus, filterType])

  const loadVisits = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterStatus !== 'all') filters.status = filterStatus
      if (filterType !== 'all') filters.visitType = filterType
      if (searchTerm) filters.search = searchTerm
      
      const response = await merchandisingService.getVisits(filters)
      setVisits(response.visits || [])
    } catch (error: any) {
      console.error('Error loading visits:', error)
      toast.error(error.message || 'Failed to load visits')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadVisits()
  }

  const handleCreateVisit = async (data: Visit) => {
    try {
      await merchandisingService.createVisit(data)
      toast.success('Visit created successfully')
      setShowCreateModal(false)
      loadVisits()
    } catch (error: any) {
      console.error('Error creating visit:', error)
      throw error
    }
  }

  const handleEditVisit = async (data: Visit) => {
    if (!editingVisit?.id) return
    
    try {
      await merchandisingService.updateVisit(editingVisit.id, data)
      toast.success('Visit updated successfully')
      setShowEditModal(false)
      setEditingVisit(null)
      loadVisits()
    } catch (error: any) {
      console.error('Error updating visit:', error)
      throw error
    }
  }

  const handleDeleteVisit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visit?')) return

    try {
      await merchandisingService.deleteVisit(id)
      toast.success('Visit deleted successfully')
      loadVisits()
    } catch (error: any) {
      console.error('Error deleting visit:', error)
      toast.error(error.message || 'Failed to delete visit')
    }
  }

  const openEditModal = (visit: Visit) => {
    setEditingVisit(visit)
    setShowEditModal(true)
  }

  const getStatusBadge = (status: Visit['status']) => {
    const config = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    const { color, icon: Icon } = config[status]
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type: Visit['visitType']) => {
    const colors = {
      planned: 'bg-indigo-100 text-indigo-800',
      unplanned: 'bg-purple-100 text-purple-800',
      follow_up: 'bg-teal-100 text-teal-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type]}`}>
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Visits</h1>
            <p className="text-gray-600">Manage field visit schedules and tracking</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadVisits}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-xl font-bold">{stats.avgDuration.toFixed(0)} min</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search visits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="planned">Planned</option>
              <option value="unplanned">Unplanned</option>
              <option value="follow_up">Follow Up</option>
            </select>

            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading visits...
                      </div>
                    </td>
                  </tr>
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <MapPin className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No visits found</p>
                        <p className="text-sm">Schedule your first store visit</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {visit.customerName || visit.customerId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {visit.agentName || visit.agentId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(visit.visitDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(visit.visitType)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{visit.purpose}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {visit.duration ? `${visit.duration} min` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(visit.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(visit)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => visit.id && handleDeleteVisit(visit.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        title="Schedule Store Visit"
        onClose={() => setShowCreateModal(false)}
        size="xl"
      >
        <VisitForm
          onSubmit={handleCreateVisit}
          onCancel={() => setShowCreateModal(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Visit"
        onClose={() => {
          setShowEditModal(false)
          setEditingVisit(null)
        }}
        size="xl"
      >
        {editingVisit && (
          <VisitForm
            initialData={editingVisit}
            onSubmit={handleEditVisit}
            onCancel={() => {
              setShowEditModal(false)
              setEditingVisit(null)
            }}
          />
        )}
      </FormModal>
    </DashboardLayout>
  )
}
