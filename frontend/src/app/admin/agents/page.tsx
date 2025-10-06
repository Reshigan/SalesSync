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
  Users, 
  Phone,
  Mail,
  MapPin,
  Filter,
  Download,
  Upload,
  Star,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react'

interface Agent {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'sales_agent' | 'merchandiser' | 'promoter' | 'supervisor'
  area_id?: string
  area_name?: string
  route_id?: string
  route_name?: string
  manager_id?: string
  manager_name?: string
  status: 'active' | 'inactive' | 'suspended'
  hire_date: string
  performance_rating?: number
  monthly_target?: number
  ytd_sales?: number
  last_activity?: string
  created_at: string
  updated_at: string
}

interface Area {
  id: string
  code: string
  name: string
}

interface Route {
  id: string
  code: string
  name: string
  area_id: string
}

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function AgentsPage() {
  const { hasPermission } = usePermissions()
  const [agents, setAgents] = useState<Agent[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'sales_agent' as 'sales_agent' | 'merchandiser' | 'promoter' | 'supervisor',
    area_id: '',
    route_id: '',
    manager_id: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    hire_date: '',
    monthly_target: ''
  })

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    setTimeout(() => {
      setAgents([
        {
          id: '1',
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@pepsi.com',
          phone: '+27 11 123 4567',
          role: 'sales_agent',
          area_id: 'ar1',
          area_name: 'Central Johannesburg',
          route_id: 'rt1',
          route_name: 'Sandton Business District',
          manager_id: 'mgr1',
          manager_name: 'Sarah Wilson',
          status: 'active',
          hire_date: '2023-03-15',
          performance_rating: 4.2,
          monthly_target: 150000,
          ytd_sales: 1250000,
          last_activity: '2024-01-15T10:30:00Z',
          created_at: '2023-03-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          employeeId: 'EMP002',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@pepsi.com',
          phone: '+27 21 234 5678',
          role: 'merchandiser',
          area_id: 'ar2',
          area_name: 'Cape Town Central',
          route_id: 'rt2',
          route_name: 'Cape Town Waterfront',
          manager_id: 'mgr2',
          manager_name: 'Mike Johnson',
          status: 'active',
          hire_date: '2023-01-20',
          performance_rating: 4.7,
          monthly_target: 120000,
          ytd_sales: 980000,
          last_activity: '2024-01-15T14:20:00Z',
          created_at: '2023-01-20',
          updated_at: '2024-01-15'
        },
        {
          id: '3',
          employeeId: 'EMP003',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@pepsi.com',
          phone: '+27 31 345 6789',
          role: 'promoter',
          area_id: 'ar3',
          area_name: 'Durban North',
          route_id: 'rt3',
          route_name: 'Durban Beachfront',
          manager_id: 'mgr1',
          manager_name: 'Sarah Wilson',
          status: 'active',
          hire_date: '2023-06-10',
          performance_rating: 3.8,
          monthly_target: 80000,
          ytd_sales: 520000,
          last_activity: '2024-01-14T16:45:00Z',
          created_at: '2023-06-10',
          updated_at: '2024-01-14'
        },
        {
          id: '4',
          employeeId: 'EMP004',
          firstName: 'Lisa',
          lastName: 'Brown',
          email: 'lisa.brown@pepsi.com',
          phone: '+27 11 456 7890',
          role: 'supervisor',
          area_id: 'ar1',
          area_name: 'Central Johannesburg',
          manager_id: 'mgr3',
          manager_name: 'David Smith',
          status: 'suspended',
          hire_date: '2022-11-05',
          performance_rating: 3.2,
          monthly_target: 200000,
          ytd_sales: 890000,
          last_activity: '2024-01-10T09:15:00Z',
          created_at: '2022-11-05',
          updated_at: '2024-01-10'
        }
      ])
      
      setAreas([
        { id: 'ar1', code: 'AR001', name: 'Central Johannesburg' },
        { id: 'ar2', code: 'AR002', name: 'Cape Town Central' },
        { id: 'ar3', code: 'AR003', name: 'Durban North' }
      ])
      
      setRoutes([
        { id: 'rt1', code: 'RT001', name: 'Sandton Business District', area_id: 'ar1' },
        { id: 'rt2', code: 'RT002', name: 'Cape Town Waterfront', area_id: 'ar2' },
        { id: 'rt3', code: 'RT003', name: 'Durban Beachfront', area_id: 'ar3' }
      ])
      
      setManagers([
        { id: 'mgr1', firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@pepsi.com' },
        { id: 'mgr2', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@pepsi.com' },
        { id: 'mgr3', firstName: 'David', lastName: 'Smith', email: 'david.smith@pepsi.com' }
      ])
      
      setLoading(false)
    }, 1000)
  }, [])

  // Filter routes based on selected area
  const filteredRoutes = routes.filter(route => 
    !formData.area_id || route.area_id === formData.area_id
  )

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter
    const matchesArea = areaFilter === 'all' || agent.area_id === areaFilter
    
    return matchesSearch && matchesStatus && matchesRole && matchesArea
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Saving agent:', formData)
    setShowModal(false)
    resetForm()
  }

  // Handle delete
  const handleDelete = async (agent: Agent) => {
    if (confirm(`Are you sure you want to delete agent "${agent.firstName} ${agent.lastName}"?`)) {
      console.log('Deleting agent:', agent.id)
      setAgents(agents.filter(a => a.id !== agent.id))
    }
  }

  // Handle edit
  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      employeeId: agent.employeeId,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      area_id: agent.area_id || '',
      route_id: agent.route_id || '',
      manager_id: agent.manager_id || '',
      status: agent.status,
      hire_date: agent.hire_date,
      monthly_target: agent.monthly_target?.toString() || ''
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setEditingAgent(null)
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'sales_agent',
      area_id: '',
      route_id: '',
      manager_id: '',
      status: 'active',
      hire_date: '',
      monthly_target: ''
    })
  }

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'sales_agent': return 'bg-blue-100 text-blue-800'
      case 'merchandiser': return 'bg-green-100 text-green-800'
      case 'promoter': return 'bg-purple-100 text-purple-800'
      case 'supervisor': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get performance stars
  const getPerformanceStars = (rating?: number) => {
    if (!rating) return null
    const stars = Math.round(rating)
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Table columns
  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      sortable: true,
      cell: ({ row }: { row: Agent; value: any }) => (
        <div className="font-medium text-gray-900">{row.employeeId}</div>
      )
    },
    {
      header: 'Agent Name',
      accessor: 'firstName',
      sortable: true,
      cell: ({ row }: { row: Agent; value: any }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.firstName} {row.lastName}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="h-3 w-3 mr-1" />
            {row.email}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="h-3 w-3 mr-1" />
            {row.phone}
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: ({ row }: { row: Agent; value: any }) => (
        <Badge className={getRoleColor(row.role)}>
          {row.role.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Area & Route',
      accessor: 'area_name',
      cell: ({ row }: { row: Agent; value: any }) => (
        <div>
          <div className="flex items-center text-sm">
            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
            {row.area_name}
          </div>
          {row.route_name && (
            <div className="text-xs text-gray-500">{row.route_name}</div>
          )}
        </div>
      )
    },
    {
      header: 'Performance',
      accessor: 'performance_rating',
      cell: ({ row }: { row: Agent; value: any }) => getPerformanceStars(row.performance_rating)
    },
    {
      header: 'Targets & Sales',
      accessor: 'ytd_sales',
      cell: ({ row }: { row: Agent; value: any }) => (
        <div className="text-sm">
          <div className="flex items-center">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="font-medium">
              R{row.ytd_sales?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Target: R{row.monthly_target?.toLocaleString() || '0'}/month
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }: { row: Agent; value: any }) => (
        <Badge variant={
          row.status === 'active' ? 'success' : 
          row.status === 'suspended' ? 'warning' : 'secondary'
        }>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: ({ row }: { row: Agent; value: any }) => (
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
            <h1 className="text-2xl font-bold text-gray-900">Agents Management</h1>
            <p className="text-gray-600">Manage field agents, performance, and assignments</p>
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
              Add Agent
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(agents.reduce((sum, a) => sum + (a.performance_rating || 0), 0) / agents.length).toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">YTD Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  R{agents.reduce((sum, a) => sum + (a.ytd_sales || 0), 0).toLocaleString()}
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
                placeholder="Search agents..."
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
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' }
              ]}
            />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'sales_agent', label: 'Sales Agent' },
                { value: 'merchandiser', label: 'Merchandiser' },
                { value: 'promoter', label: 'Promoter' },
                { value: 'supervisor', label: 'Supervisor' }
              ]}
            />
            <Select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Areas' },
                ...areas.map(area => ({ value: area.id, label: area.name }))
              ]}
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setRoleFilter('all')
                setAreaFilter('all')
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
            data={filteredAgents}
            columns={columns}
            loading={loading}
            emptyMessage="No agents found"
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
          title={editingAgent ? 'Edit Agent' : 'Add New Agent'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g., EMP001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  required
                  options={[
                    { value: 'sales_agent', label: 'Sales Agent' },
                    { value: 'merchandiser', label: 'Merchandiser' },
                    { value: 'promoter', label: 'Promoter' },
                    { value: 'supervisor', label: 'Supervisor' }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g., John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g., Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john.doe@pepsi.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +27 11 123 4567"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                <Select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value, route_id: '' })}
                  options={[
                    { value: '', label: 'Select Area' },
                    ...areas.map(area => ({ value: area.id, label: area.name }))
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <Select
                  value={formData.route_id}
                  onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  disabled={!formData.area_id}
                  options={[
                    { value: '', label: 'Select Route' },
                    ...filteredRoutes.map(route => ({ value: route.id, label: route.name }))
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date *
                </label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Target (R)
                </label>
                <Input
                  type="number"
                  value={formData.monthly_target}
                  onChange={(e) => setFormData({ ...formData, monthly_target: e.target.value })}
                  placeholder="e.g., 150000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' }
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
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}