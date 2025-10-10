'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem, MobileButton, MobileInput, MobileFloatingActionButton } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { fieldAgentsService, FieldAgent } from '@/services/field-agents.service'

import { 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react'

export default function FieldAgentsManagementPage() {
  const [agents, setAgents] = useState<FieldAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<FieldAgent | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
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
    loadAgents()
  }, [statusFilter])

  const loadAgents = async () => {
    try {
      setIsLoading(true)
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await fieldAgentsService.getFieldAgents(filters)
      setAgents(response.data || [])
    } catch (err) {
      error('Failed to load field agents')
      console.error('Error loading agents:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAgent = async (agentData: Partial<FieldAgent>) => {
    try {
      await fieldAgentsService.createFieldAgent(agentData)
      success('Field agent created successfully')
      setShowCreateModal(false)
      loadAgents()
    } catch (err) {
      error('Failed to create field agent')
      console.error('Error creating agent:', err)
    }
  }

  const handleUpdateAgent = async (id: string, agentData: Partial<FieldAgent>) => {
    try {
      await fieldAgentsService.updateFieldAgent(id, agentData)
      success('Field agent updated successfully')
      loadAgents()
    } catch (err) {
      error('Failed to update field agent')
      console.error('Error updating agent:', err)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field agent?')) return
    
    try {
      await fieldAgentsService.deleteFieldAgent(id)
      success('Field agent deleted successfully')
      loadAgents()
    } catch (err) {
      error('Failed to delete field agent')
      console.error('Error deleting agent:', err)
    }
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.territory && agent.territory.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Field Agents" showBackButton>
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
                <div className="text-sm text-gray-600">Total Agents</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {agents.filter(a => a.status === 'ACTIVE').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </MobileCard>
            </div>

            {/* Search */}
            <MobileInput
              placeholder="Search agents..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-5 h-5" />}
            />

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>

            {/* Agents List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <MobileList>
                {filteredAgents.map((agent) => (
                  <MobileListItem
                    key={agent.id}
                    title={agent.name}
                    subtitle={`${agent.email} • ${agent.phone}`}
                    description={`Territory: ${agent.territory || 'Not assigned'}`}
                    badge={{
                      text: agent.status,
                      color: agent.status === 'ACTIVE' ? 'green' : 
                             agent.status === 'SUSPENDED' ? 'red' : 'gray'
                    }}
                    rightText={`${agent.performanceMetrics?.totalVisits || 0} visits`}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowDetailsModal(true);
                    }}
                  />
                ))}
              </MobileList>
            )}

            {filteredAgents.length === 0 && !isLoading && (
              <MobileCard className="text-center py-8">
                <div className="text-gray-500">
                  No field agents found matching your criteria.
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
              <h1 className="text-3xl font-bold text-gray-900">Field Agents</h1>
              <p className="mt-2 text-gray-600">
                Manage field marketing agents and their performance
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Agent
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-green-600">
                    {agents.filter(a => a.status === 'ACTIVE').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Commission Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {agents.length > 0 ? 
                      (agents.reduce((sum, a) => sum + a.commissionRate, 0) / agents.length).toFixed(1) + '%'
                      : '0%'
                    }
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {agents.reduce((sum, a) => sum + (a.performanceMetrics?.totalVisits || 0), 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
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
                    placeholder="Search agents..."
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
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agents Table */}
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
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Territory
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {agent.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {agent.email}
                              </div>
                              {agent.phone && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {agent.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{agent.employeeId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agent.status)}`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{agent.commissionRate}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {agent.performanceMetrics?.totalVisits || 0} visits
                          </div>
                          <div className="text-sm text-gray-500">
                            ${(agent.performanceMetrics?.totalCommissions || 0).toFixed(2)} earned
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {agent.territory || 'Not assigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedAgent(agent)
                                setShowDetailsModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/field-agents/agents/${agent.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredAgents.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No field agents found matching your criteria.
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