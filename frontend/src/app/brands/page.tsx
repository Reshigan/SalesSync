'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { BrandForm } from '@/components/brands/BrandForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { brandsService, Brand } from '@/services/brands.service'
import { getAllAgentTypes } from '@/config/agent-types'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  Users,
  CheckCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react'

interface AgentAssignment {
  agentId: string
  agentName: string
  agentType: string
  permissions: string[]
}

export default function BrandsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [selectedBrandForAssignment, setSelectedBrandForAssignment] = useState<string | null>(null)

  // Stats
  const stats = {
    total: brands.length,
    active: brands.filter(b => b.active).length,
    telecom: brands.filter(b => b.category === 'telecom').length,
    fmcg: brands.filter(b => b.category === 'fmcg').length
  }

  useEffect(() => {
    loadBrands()
  }, [filterStatus])

  const loadBrands = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterStatus !== 'all') filters.active = filterStatus === 'active'
      if (searchTerm) filters.search = searchTerm
      
      const response = await brandsService.getBrands(filters)
      setBrands(response.brands || [])
    } catch (error: any) {
      console.error('Error loading brands:', error)
      toast.error(error.message || 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadBrands()
  }

  const handleCreateBrand = async (data: Brand) => {
    try {
      await brandsService.createBrand(data)
      toast.success('Brand created successfully')
      setShowCreateModal(false)
      loadBrands()
    } catch (error: any) {
      console.error('Error creating brand:', error)
      throw error
    }
  }

  const handleEditBrand = async (data: Brand) => {
    if (!editingBrand?.id) return
    
    try {
      await brandsService.updateBrand(editingBrand.id, data)
      toast.success('Brand updated successfully')
      setShowEditModal(false)
      setEditingBrand(null)
      loadBrands()
    } catch (error: any) {
      console.error('Error updating brand:', error)
      throw error
    }
  }

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand? This will remove all agent assignments.')) return

    try {
      await brandsService.deleteBrand(id)
      toast.success('Brand deleted successfully')
      loadBrands()
    } catch (error: any) {
      console.error('Error deleting brand:', error)
      toast.error(error.message || 'Failed to delete brand')
    }
  }

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand)
    setShowEditModal(true)
  }

  const openAssignModal = (brandId: string) => {
    setSelectedBrandForAssignment(brandId)
    setShowAssignModal(true)
  }

  const getCategoryBadge = (category: Brand['category']) => {
    const colors = {
      telecom: 'bg-blue-100 text-blue-800',
      fmcg: 'bg-green-100 text-green-800',
      beverage: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return (<ErrorBoundary>

      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[category]}`}>
        {category.toUpperCase()}
      </span>
    
</ErrorBoundary>)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
            <p className="text-gray-600">Manage brands and assign them to field agents</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadBrands}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Brands</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Award className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Brands</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Telecom</p>
                <p className="text-2xl font-bold text-purple-600">{stats.telecom}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">FMCG</p>
                <p className="text-2xl font-bold text-orange-600">{stats.fmcg}</p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
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
                  placeholder="Search brands..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading brands...
                      </div>
                    </td>
                  </tr>
                ) : brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Award className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No brands found</p>
                        <p className="text-sm">Create your first brand</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {brand.logo && (
                            <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded mr-3 object-contain" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                            {brand.description && (
                              <p className="text-xs text-gray-500 mt-1">{brand.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-medium text-gray-900">{brand.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getCategoryBadge(brand.category)}
                      </td>
                      <td className="px-6 py-4">
                        {brand.active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => brand.id && openAssignModal(brand.id)}
                            title="Assign Agents"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(brand)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => brand.id && handleDeleteBrand(brand.id)}
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
        title="Create Brand"
        onClose={() => setShowCreateModal(false)}
      >
        <BrandForm
          onSubmit={handleCreateBrand}
          onCancel={() => setShowCreateModal(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Brand"
        onClose={() => {
          setShowEditModal(false)
          setEditingBrand(null)
        }}
      >
        {editingBrand && (
          <BrandForm
            initialData={editingBrand}
            onSubmit={handleEditBrand}
            onCancel={() => {
              setShowEditModal(false)
              setEditingBrand(null)
            }}
          />
        )}
      </FormModal>

      {/* Agent Assignment Modal */}
      <FormModal
        isOpen={showAssignModal}
        title="Assign Agents to Brand"
        onClose={() => {
          setShowAssignModal(false)
          setSelectedBrandForAssignment(null)
        }}
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">Agent assignment interface - Coming soon</p>
          <p className="text-sm text-gray-500">
            This feature will allow you to assign agents to this brand with specific permissions.
          </p>
        </div>
      </FormModal>
    </DashboardLayout>
  )
}
