'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { SurveyForm, Survey } from '@/components/surveys/SurveyForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { surveysService } from '@/services/surveys.service'
import { getAllAgentTypes } from '@/config/agent-types'
import toast from 'react-hot-toast'
import { 
  ClipboardList,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3
} from 'lucide-react'

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)

  // Mock data for brands and agent types
  const brands = [
    { id: '1', name: 'Safaricom' },
    { id: '2', name: 'Airtel' },
    { id: '3', name: 'Coca-Cola' }
  ]

  // Get agent types from configuration
  const agentTypes = getAllAgentTypes().map(config => ({
    id: config.id,
    name: config.name
  }))

  // Stats
  const stats = {
    total: surveys.length,
    active: surveys.filter(s => s.active).length,
    mandatory: surveys.filter(s => s.isMandatory).length,
    responses: 0 // TODO: Get from API
  }

  useEffect(() => {
    loadSurveys()
  }, [filterCategory, filterStatus])

  const loadSurveys = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterCategory !== 'all') filters.category = filterCategory
      if (filterStatus !== 'all') filters.active = filterStatus === 'active'
      if (searchTerm) filters.search = searchTerm
      
      const response = await surveysService.getSurveys(filters)
      setSurveys(response.surveys || [])
    } catch (error: any) {
      console.error('Error loading surveys:', error)
      toast.error(error.message || 'Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadSurveys()
  }

  const handleCreateSurvey = async (data: Survey) => {
    try {
      await surveysService.createSurvey(data)
      toast.success('Survey created successfully')
      setShowCreateModal(false)
      loadSurveys()
    } catch (error: any) {
      console.error('Error creating survey:', error)
      throw error
    }
  }

  const handleEditSurvey = async (data: Survey) => {
    if (!editingSurvey?.id) return
    
    try {
      await surveysService.updateSurvey(editingSurvey.id, data)
      toast.success('Survey updated successfully')
      setShowEditModal(false)
      setEditingSurvey(null)
      loadSurveys()
    } catch (error: any) {
      console.error('Error updating survey:', error)
      throw error
    }
  }

  const handleDeleteSurvey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this survey?')) return

    try {
      await surveysService.deleteSurvey(id)
      toast.success('Survey deleted successfully')
      loadSurveys()
    } catch (error: any) {
      console.error('Error deleting survey:', error)
      toast.error(error.message || 'Failed to delete survey')
    }
  }

  const toggleSurveyStatus = async (id: string, currentStatus: boolean) => {
    try {
      await surveysService.toggleSurveyStatus(id, !currentStatus)
      toast.success(`Survey ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      loadSurveys()
    } catch (error: any) {
      console.error('Error toggling survey status:', error)
      toast.error(error.message || 'Failed to update survey status')
    }
  }

  const openEditModal = (survey: Survey) => {
    setEditingSurvey(survey)
    setShowEditModal(true)
  }

  const getCategoryBadge = (category: Survey['category']) => {
    const colors = {
      brand_awareness: 'bg-blue-100 text-blue-800',
      product_feedback: 'bg-green-100 text-green-800',
      customer_satisfaction: 'bg-purple-100 text-purple-800',
      market_research: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[category]}`}>
        {category.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
            <p className="text-gray-600">Create and manage surveys for field agents and customers</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadSurveys}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mandatory</p>
                <p className="text-2xl font-bold text-orange-600">{stats.mandatory}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-purple-600">{stats.responses}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
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
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="brand_awareness">Brand Awareness</option>
              <option value="product_feedback">Product Feedback</option>
              <option value="customer_satisfaction">Customer Satisfaction</option>
              <option value="market_research">Market Research</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Survey</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading surveys...
                      </div>
                    </td>
                  </tr>
                ) : surveys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <ClipboardList className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No surveys found</p>
                        <p className="text-sm">Create your first survey</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  surveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{survey.title}</p>
                          {survey.description && (
                            <p className="text-xs text-gray-500 mt-1">{survey.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getCategoryBadge(survey.category)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {survey.targetAudience.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{survey.questions.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {survey.isMandatory && (
                            <span className="block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 w-fit">
                              Mandatory
                            </span>
                          )}
                          {survey.assignedBrands.length > 0 && (
                            <span className="text-xs text-gray-600">
                              {survey.assignedBrands.length} brand(s)
                            </span>
                          )}
                          {survey.assignedAgentTypes.length > 0 && (
                            <span className="text-xs text-gray-600 block">
                              {survey.assignedAgentTypes.length} agent type(s)
                            </span>
                          )}
                          {survey.assignedBrands.length === 0 && survey.assignedAgentTypes.length === 0 && (
                            <span className="text-xs text-gray-500">All agents</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => survey.id && toggleSurveyStatus(survey.id, survey.active)}
                        >
                          {survey.active ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                          )}
                          {survey.active ? 'Active' : 'Inactive'}
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" title="View Analytics">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(survey)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => survey.id && handleDeleteSurvey(survey.id)}
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
        title="Create Survey"
        onClose={() => setShowCreateModal(false)}
        size="xl"
      >
        <SurveyForm
          onSubmit={handleCreateSurvey}
          onCancel={() => setShowCreateModal(false)}
          brands={brands}
          agentTypes={agentTypes}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Survey"
        onClose={() => {
          setShowEditModal(false)
          setEditingSurvey(null)
        }}
        size="xl"
      >
        {editingSurvey && (
          <SurveyForm
            initialData={editingSurvey}
            onSubmit={handleEditSurvey}
            onCancel={() => {
              setShowEditModal(false)
              setEditingSurvey(null)
            }}
            brands={brands}
            agentTypes={agentTypes}
          />
        )}
      </FormModal>
    </DashboardLayout>
  )
}
