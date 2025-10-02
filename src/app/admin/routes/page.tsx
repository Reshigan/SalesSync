'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import apiService from '@/lib/api'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MapPin, 
  Route,
  Users,
  Filter,
  Download,
  Upload,
  Building2,
  Clock,
  Target
} from 'lucide-react'

interface RouteData {
  id: string
  code: string
  name: string
  area_id: string
  area_name?: string
  region_name?: string
  agent_id?: string
  agent_name?: string
  description?: string
  status: 'active' | 'inactive'
  customer_count?: number
  visit_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
  estimated_duration?: number
  target_calls?: number
  created_at: string
  updated_at: string
}

interface Area {
  id: string
  code: string
  name: string
  region_name?: string
}

interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeId: string
}

export default function RoutesPage() {
  const { hasPermission } = usePermissions()
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    area_id: '',
    agent_id: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    visit_frequency: 'weekly' as 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
    estimated_duration: '',
    target_calls: ''
  })

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRoutes([
        {
          id: '1',
          code: 'RT001',
          name: 'Sandton Business District',
          area_id: 'ar1',
          area_name: 'Central Johannesburg',
          region_name: 'Gauteng Region',
          agent_id: 'ag1',
          agent_name: 'John Doe',
          description: 'High-value corporate clients in Sandton CBD',
          status: 'active',
          customer_count: 45,
          visit_frequency: 'weekly',
          estimated_duration: 480,
          target_calls: 12,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          code: 'RT002',
          name: 'Rosebank Shopping Centers',
          area_id: 'ar1',
          area_name: 'Central Johannesburg',
          region_name: 'Gauteng Region',
          agent_id: 'ag2',
          agent_name: 'Sarah Wilson',
          description: 'Retail outlets and shopping centers in Rosebank',
          status: 'active',
          customer_count: 32,
          visit_frequency: 'bi-weekly',
          estimated_duration: 360,
          target_calls: 8,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '3',
          code: 'RT003',
          name: 'Cape Town Waterfront',
          area_id: 'ar2',
          area_name: 'Cape Town Central',
          region_name: 'Western Cape Region',
          agent_id: 'ag3',
          agent_name: 'Mike Johnson',
          description: 'Tourist and hospitality venues at V&A Waterfront',
          status: 'active',
          customer_count: 28,
          visit_frequency: 'weekly',
          estimated_duration: 420,
          target_calls: 10,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '4',
          code: 'RT004',
          name: 'Durban Beachfront',
          area_id: 'ar3',
          area_name: 'Durban North',
          region_name: 'KwaZulu-Natal Region',
          agent_id: null,
          agent_name: null,
          description: 'Hotels and restaurants along Durban beachfront',
          status: 'inactive',
          customer_count: 22,
          visit_frequency: 'monthly',
          estimated_duration: 300,
          target_calls: 6,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ])
      
      setAreas([
        { id: 'ar1', code: 'AR001', name: 'Central Johannesburg', region_name: 'Gauteng Region' },
        { id: 'ar2', code: 'AR002', name: 'Cape Town Central', region_name: 'Western Cape Region' },
        { id: 'ar3', code: 'AR003', name: 'Durban North', region_name: 'KwaZulu-Natal Region' }
      ])
      
      setAgents([
        { id: 'ag1', firstName: 'John', lastName: 'Doe', email: 'john.doe@pepsi.com', employeeId: 'EMP001' },
        { id: 'ag2', firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@pepsi.com', employeeId: 'EMP002' },
        { id: 'ag3', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@pepsi.com', employeeId: 'EMP003' },
        { id: 'ag4', firstName: 'Lisa', lastName: 'Brown', email: 'lisa.brown@pepsi.com', employeeId: 'EMP004' }
      ])
      
      setLoading(false)
    }, 1000)
  }, [])

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.area_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter
    const matchesArea = areaFilter === 'all' || route.area_id === areaFilter
    const matchesFrequency = frequencyFilter === 'all' || route.visit_frequency === frequencyFilter
    
    return matchesSearch && matchesStatus && matchesArea && matchesFrequency
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock API call - will be replaced with real API
    console.log('Saving route:', formData)
    
    // Simulate success
    setShowModal(false)
    resetForm()
  }

  // Handle delete
  const handleDelete = async (route: RouteData) => {
    if (confirm(`Are you sure you want to delete route "${route.name}"?`)) {
      console.log('Deleting route:', route.id)
      // Mock delete - remove from state
      setRoutes(routes.filter(r => r.id !== route.id))
    }
  }

  // Handle edit
  const handleEdit = (route: RouteData) => {
    setEditingRoute(route)
    setFormData({
      code: route.code,
      name: route.name,
      area_id: route.area_id,
      agent_id: route.agent_id || '',
      description: route.description || '',
      status: route.status,
      visit_frequency: route.visit_frequency,
      estimated_duration: route.estimated_duration?.toString() || '',
      target_calls: route.target_calls?.toString() || ''
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setEditingRoute(null)
    setFormData({
      code: '',
      name: '',
      area_id: '',
      agent_id: '',
      description: '',
      status: 'active',
      visit_frequency: 'weekly',
      estimated_duration: '',
      target_calls: ''
    })
  }

  // Get frequency badge color
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800'
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'bi-weekly': return 'bg-yellow-100 text-yellow-800'
      case 'monthly': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Table columns
  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (route: RouteData) => (
        <div className="font-medium text-gray-900">{route.code}</div>
      )
    },
    {
      key: 'name',
      label: 'Route Name',
      sortable: true,
      render: (route: RouteData) => (
        <div>
          <div className="font-medium text-gray-900">{route.name}</div>
          {route.description && (
            <div className="text-sm text-gray-500">{route.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'area_name',
      label: 'Area',
      sortable: true,
      render: (route: RouteData) => (
        <div>
          <div className="flex items-center">
            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
            <span className="font-medium">{route.area_name}</span>
          </div>
          <div className="text-sm text-gray-500">{route.region_name}</div>
        </div>
      )
    },
    {
      key: 'agent_name',
      label: 'Assigned Agent',
      render: (route: RouteData) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <span>{route.agent_name || 'Unassigned'}</span>
        </div>
      )
    },
    {
      key: 'customer_count',
      label: 'Customers',
      render: (route: RouteData) => (
        <div className="text-center">
          <Badge variant="secondary">
            {route.customer_count || 0}
          </Badge>
        </div>
      )
    },
    {
      key: 'visit_frequency',
      label: 'Frequency',
      render: (route: RouteData) => (
        <Badge className={getFrequencyColor(route.visit_frequency)}>
          {route.visit_frequency}
        </Badge>
      )
    },
    {
      key: 'estimated_duration',
      label: 'Duration',
      render: (route: RouteData) => (
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          {route.estimated_duration ? `${Math.floor(route.estimated_duration / 60)}h ${route.estimated_duration % 60}m` : 'N/A'}
        </div>
      )
    },
    {
      key: 'target_calls',
      label: 'Target Calls',
      render: (route: RouteData) => (
        <div className="flex items-center text-sm">
          <Target className="h-4 w-4 text-gray-400 mr-1" />
          {route.target_calls || 'N/A'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (route: RouteData) => (
        <Badge variant={route.status === 'active' ? 'success' : 'secondary'}>
          {route.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (route: RouteData) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(route)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(route)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
            <p className="text-gray-600">Manage sales routes and agent assignments</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Routes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.filter(r => r.agent_id).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.reduce((sum, route) => sum + (route.customer_count || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="all">All Areas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
            <Select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setAreaFilter('all')
                setFrequencyFilter('all')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredRoutes}
            columns={columns}
            loading={loading}
            emptyMessage="No routes found"
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
          title={editingRoute ? 'Edit Route' : 'Add New Route'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., RT001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sandton Business District"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area *
                </label>
                <Select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                  required
                >
                  <option value="">Select Area</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name} ({area.region_name})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Agent
                </label>
                <Select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                >
                  <option value="">Select Agent</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName} ({agent.employeeId})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Frequency *
                </label>
                <Select
                  value={formData.visit_frequency}
                  onChange={(e) => setFormData({ ...formData, visit_frequency: e.target.value as any })}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  placeholder="e.g., 480"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Calls per Visit
                </label>
                <Input
                  type="number"
                  value={formData.target_calls}
                  onChange={(e) => setFormData({ ...formData, target_calls: e.target.value })}
                  placeholder="e.g., 12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Route description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRoute ? 'Update Route' : 'Create Route'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}