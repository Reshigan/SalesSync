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
  Building2,
  Users,
  Filter,
  Download,
  Upload
} from 'lucide-react'

interface Area {
  id: string
  code: string
  name: string
  region_id: string
  region_name?: string
  manager_id?: string
  manager_name?: string
  description?: string
  status: 'active' | 'inactive'
  route_count?: number
  agent_count?: number
  created_at: string
  updated_at: string
}

interface Region {
  id: string
  code: string
  name: string
}

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function AreasPage() {
  const { hasPermission } = usePermissions()
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    region_id: '',
    manager_id: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  })

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAreas([
        {
          id: '1',
          code: 'AR001',
          name: 'Central Johannesburg',
          region_id: 'reg1',
          region_name: 'Gauteng Region',
          manager_id: 'mgr1',
          manager_name: 'John Smith',
          description: 'Central business district and surrounding areas',
          status: 'active',
          route_count: 12,
          agent_count: 24,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          code: 'AR002',
          name: 'Cape Town Central',
          region_id: 'reg2',
          region_name: 'Western Cape Region',
          manager_id: 'mgr2',
          manager_name: 'Sarah Johnson',
          description: 'Cape Town city center and Atlantic seaboard',
          status: 'active',
          route_count: 8,
          agent_count: 16,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '3',
          code: 'AR003',
          name: 'Durban North',
          region_id: 'reg3',
          region_name: 'KwaZulu-Natal Region',
          manager_id: 'mgr3',
          manager_name: 'Mike Wilson',
          description: 'Northern suburbs of Durban',
          status: 'active',
          route_count: 6,
          agent_count: 12,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ])
      
      setRegions([
        { id: 'reg1', code: 'GT', name: 'Gauteng Region' },
        { id: 'reg2', code: 'WC', name: 'Western Cape Region' },
        { id: 'reg3', code: 'KZN', name: 'KwaZulu-Natal Region' }
      ])
      
      setManagers([
        { id: 'mgr1', firstName: 'John', lastName: 'Smith', email: 'john.smith@pepsi.com' },
        { id: 'mgr2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@pepsi.com' },
        { id: 'mgr3', firstName: 'Mike', lastName: 'Wilson', email: 'mike.wilson@pepsi.com' }
      ])
      
      setLoading(false)
    }, 1000)
  }, [])

  // Filter areas
  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.region_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || area.status === statusFilter
    const matchesRegion = regionFilter === 'all' || area.region_id === regionFilter
    
    return matchesSearch && matchesStatus && matchesRegion
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock API call - will be replaced with real API
    console.log('Saving area:', formData)
    
    // Simulate success
    setShowModal(false)
    resetForm()
  }

  // Handle delete
  const handleDelete = async (area: Area) => {
    if (confirm(`Are you sure you want to delete area "${area.name}"?`)) {
      console.log('Deleting area:', area.id)
      // Mock delete - remove from state
      setAreas(areas.filter(a => a.id !== area.id))
    }
  }

  // Handle edit
  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setFormData({
      code: area.code,
      name: area.name,
      region_id: area.region_id,
      manager_id: area.manager_id || '',
      description: area.description || '',
      status: area.status
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setEditingArea(null)
    setFormData({
      code: '',
      name: '',
      region_id: '',
      manager_id: '',
      description: '',
      status: 'active'
    })
  }

  // Table columns
  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      sortable: true,
      cell: ({ row }: { row: Area; value: any }) => (
        <div className="font-medium text-gray-900">{row.code}</div>
      )
    },
    {
      header: 'Area Name',
      accessor: 'name',
      sortable: true,
      cell: ({ row }: { row: Area; value: any }) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-sm text-gray-500">{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Region',
      accessor: 'region_name',
      sortable: true,
      cell: ({ row }: { row: Area; value: any }) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
          <span>{row.region_name}</span>
        </div>
      )
    },
    {
      header: 'Manager',
      accessor: 'manager_name',
      cell: ({ row }: { row: Area; value: any }) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <span>{row.manager_name || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Routes',
      accessor: 'route_count',
      cell: ({ row }: { row: Area; value: any }) => (
        <div className="text-center">
          <Badge variant="secondary">
            {row.route_count || 0} routes
          </Badge>
        </div>
      )
    },
    {
      header: 'Agents',
      accessor: 'agent_count',
      cell: ({ row }: { row: Area; value: any }) => (
        <div className="text-center">
          <Badge variant="secondary">
            {row.agent_count || 0} agents
          </Badge>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }: { row: Area; value: any }) => (
        <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: ({ row }: { row: Area; value: any }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
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
            <h1 className="text-2xl font-bold text-gray-900">Areas Management</h1>
            <p className="text-gray-600">Manage geographical areas and their hierarchical structure</p>
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
              Add Area
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Areas</p>
                <p className="text-2xl font-bold text-gray-900">{areas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Areas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {areas.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {areas.reduce((sum, area) => sum + (area.route_count || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {areas.reduce((sum, area) => sum + (area.agent_count || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Regions' },
                ...regions.map(region => ({ value: region.id, label: region.name }))
              ]}
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setRegionFilter('all')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredAreas}
            columns={columns}
            loading={loading}
            emptyMessage="No areas found"
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
          title={editingArea ? 'Edit Area' : 'Add New Area'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., AR001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Central Area"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region *
                </label>
                <Select
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  required
                  options={[
                    { value: '', label: 'Select Region' },
                    ...regions.map(region => ({ value: region.id, label: region.name }))
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </label>
                <Select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Manager' },
                    ...managers.map(manager => ({ value: manager.id, label: `${manager.firstName} ${manager.lastName}` }))
                  ]}
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
                placeholder="Area description..."
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
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
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
                {editingArea ? 'Update Area' : 'Create Area'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}