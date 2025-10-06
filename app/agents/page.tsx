'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SimpleTable as DataTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Award
} from 'lucide-react'

interface Agent {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  employee_id: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  area_id: string
  area_name: string
  hire_date: string
  last_login: string
  total_sales: number
  monthly_target: number
  achievement_rate: number
  commission_earned: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const tenantCode = localStorage.getItem('tenantCode') || 'DEMO'
      
      const response = await fetch('http://localhost:3001/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Code': tenantCode,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }

      const result = await response.json()
      setAgents(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mock data for development
      setAgents([
        {
          id: '1',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@company.com',
          phone: '+27 82 123 4567',
          employee_id: 'EMP001',
          role: 'Sales Agent',
          status: 'active',
          area_id: 'area1',
          area_name: 'Johannesburg North',
          hire_date: '2024-01-15',
          last_login: '2025-10-06T08:30:00Z',
          total_sales: 125000,
          monthly_target: 100000,
          achievement_rate: 125,
          commission_earned: 12500
        },
        {
          id: '2',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@company.com',
          phone: '+27 83 987 6543',
          employee_id: 'EMP002',
          role: 'Senior Sales Agent',
          status: 'active',
          area_id: 'area2',
          area_name: 'Cape Town Central',
          hire_date: '2023-08-20',
          last_login: '2025-10-06T09:15:00Z',
          total_sales: 98000,
          monthly_target: 120000,
          achievement_rate: 82,
          commission_earned: 9800
        },
        {
          id: '3',
          first_name: 'Mike',
          last_name: 'Wilson',
          email: 'mike.wilson@company.com',
          phone: '+27 84 555 7890',
          employee_id: 'EMP003',
          role: 'Sales Agent',
          status: 'inactive',
          area_id: 'area3',
          area_name: 'Durban South',
          hire_date: '2024-03-10',
          last_login: '2025-09-28T14:22:00Z',
          total_sales: 45000,
          monthly_target: 80000,
          achievement_rate: 56,
          commission_earned: 4500
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'success' as const },
      inactive: { label: 'Inactive', variant: 'warning' as const },
      suspended: { label: 'Suspended', variant: 'error' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getAchievementBadge = (rate: number) => {
    if (rate >= 100) return <Badge variant="success">{rate}%</Badge>
    if (rate >= 80) return <Badge variant="warning">{rate}%</Badge>
    return <Badge variant="error">{rate}%</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const agentStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(agent => agent.status === 'active').length,
    totalSales: agents.reduce((sum, agent) => sum + agent.total_sales, 0),
    avgAchievement: agents.length > 0 
      ? Math.round(agents.reduce((sum, agent) => sum + agent.achievement_rate, 0) / agents.length)
      : 0
  }

  const columns = [
    {
      key: 'name',
      label: 'Agent',
      render: (agent: Agent) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {agent.first_name[0]}{agent.last_name[0]}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {agent.first_name} {agent.last_name}
            </div>
            <div className="text-sm text-gray-500">{agent.employee_id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (agent: Agent) => (
        <div>
          <div className="flex items-center text-sm text-gray-900">
            <Mail className="w-4 h-4 mr-1 text-gray-400" />
            {agent.email}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Phone className="w-4 h-4 mr-1 text-gray-400" />
            {agent.phone}
          </div>
        </div>
      )
    },
    {
      key: 'area',
      label: 'Area',
      render: (agent: Agent) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
          <span className="text-sm text-gray-900">{agent.area_name}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (agent: Agent) => getStatusBadge(agent.status)
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (agent: Agent) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(agent.total_sales)}
          </div>
          <div className="text-xs text-gray-500">
            Target: {formatCurrency(agent.monthly_target)}
          </div>
          <div className="mt-1">
            {getAchievementBadge(agent.achievement_rate)}
          </div>
        </div>
      )
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (agent: Agent) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(agent.commission_earned)}
        </div>
      )
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (agent: Agent) => (
        <div className="text-sm text-gray-600">
          {formatDate(agent.last_login)}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Agents</h1>
          <p className="text-gray-600">Manage your sales team and track performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agentStats.totalAgents}</p>
              <p className="text-sm text-green-600">{agentStats.activeAgents} active</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(agentStats.totalSales)}</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Achievement</p>
              <p className="text-2xl font-bold text-gray-900">{agentStats.avgAchievement}%</p>
              <p className="text-sm text-gray-500">Target achievement</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Performer</p>
              <p className="text-lg font-bold text-gray-900">
                {agents.length > 0 
                  ? agents.reduce((prev, current) => 
                      prev.achievement_rate > current.achievement_rate ? prev : current
                    ).first_name
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-gray-500">This month</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Agents Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Agents</h3>
            <div className="text-sm text-gray-500">
              Showing {filteredAgents.length} of {agents.length} agents
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAgents}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          <DataTable
            data={filteredAgents}
            columns={columns}
            loading={loading}
            emptyMessage="No agents found"
          />
        </div>
      </Card>

      {/* Add Agent Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Agent"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button>
              Add Agent
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}