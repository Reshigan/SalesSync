'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ShelfAuditForm } from '@/components/merchandising/ShelfAuditForm'
import { ComprehensiveShelfAudit } from '@/types/merchandising'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { merchandisingService } from '@/services/merchandising.service'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Grid3x3, 
  Camera, 
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp
} from 'lucide-react'

export default function ShelfPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [audits, setAudits] = useState<ComprehensiveShelfAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAudit, setEditingAudit] = useState<ComprehensiveShelfAudit | null>(null)

  const stats = {
    avgShelfShare: audits.length > 0 
      ? Math.round(audits.reduce((sum, a) => sum + a.metrics.shelfShare, 0) / audits.length)
      : 0,
    avgCompliance: audits.length > 0
      ? Math.round(audits.reduce((sum, a) => sum + a.metrics.planogramCompliance, 0) / audits.length)
      : 0,
    totalAudits: audits.length,
    issuesFound: audits.reduce((sum, a) => sum + a.issues.length, 0)
  }

  useEffect(() => {
    loadAudits()
  }, [filterCategory])

  const loadAudits = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API call when backend is ready
      const mockAudits: ComprehensiveShelfAudit[] = []
      setAudits(mockAudits)
    } catch (error: any) {
      console.error('Error loading audits:', error)
      toast.error(error.message || 'Failed to load audits')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadAudits()
  }

  const handleCreateAudit = async (data: ComprehensiveShelfAudit) => {
    try {
      // Mock - replace with actual API call
      console.log('Creating audit:', data)
      toast.success('Audit created successfully')
      setShowCreateModal(false)
      loadAudits()
    } catch (error: any) {
      console.error('Error creating audit:', error)
      throw error
    }
  }

  const handleEditAudit = async (data: ComprehensiveShelfAudit) => {
    if (!editingAudit?.id) return
    
    try {
      // Mock - replace with actual API call
      console.log('Updating audit:', data)
      toast.success('Audit updated successfully')
      setShowEditModal(false)
      setEditingAudit(null)
      loadAudits()
    } catch (error: any) {
      console.error('Error updating audit:', error)
      throw error
    }
  }

  const handleDeleteAudit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audit?')) return

    try {
      // Mock - replace with actual API call
      console.log('Deleting audit:', id)
      toast.success('Audit deleted successfully')
      loadAudits()
    } catch (error: any) {
      console.error('Error deleting audit:', error)
      toast.error(error.message || 'Failed to delete audit')
    }
  }

  const openEditModal = (audit: ComprehensiveShelfAudit) => {
    setEditingAudit(audit)
    setShowEditModal(true)
  }

  const getStockLevelBadge = (level: ComprehensiveShelfAudit['metrics']['stockLevel']) => {
    const styles = {
      full: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-orange-100 text-orange-800',
      out: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[level]}`}>{level.toUpperCase()}</span>
  }

  const getComplianceIcon = (compliance: number) => {
    if (compliance >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (compliance >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shelf Audits</h1>
            <p className="text-gray-600">Track shelf space, compliance, and competitor analysis</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadAudits}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Audit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Shelf Share</p>
                <p className="text-2xl font-bold">{stats.avgShelfShare}%</p>
              </div>
              <Grid3x3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Compliance</p>
                <p className="text-2xl font-bold">{stats.avgCompliance}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Audits</p>
                <p className="text-2xl font-bold">{stats.totalAudits}</p>
              </div>
              <Camera className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Issues Found</p>
                <p className="text-2xl font-bold">{stats.issuesFound}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search by store, brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="dairy">Dairy</option>
                <option value="personal-care">Personal Care</option>
                <option value="household">Household</option>
              </select>
            </div>
            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Audits Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store / Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shelf Share
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
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
                      Loading audits...
                    </td>
                  </tr>
                ) : audits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No audits found. Create your first audit to get started.
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{audit.storeName || audit.storeId}</div>
                          <div className="text-sm text-gray-500">{audit.brand}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(audit.auditDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{audit.metrics.brandFacings} / {audit.metrics.totalFacings}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-semibold">{audit.metrics.shelfShare}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStockLevelBadge(audit.metrics.stockLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getComplianceIcon(audit.metrics.planogramCompliance)}
                          <span className="ml-2 text-sm">{audit.metrics.planogramCompliance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {audit.issues.length > 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {audit.issues.length} issues
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(audit)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAudit(audit.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <FormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="New Shelf Audit"
        >
          <ShelfAuditForm
            onSubmit={handleCreateAudit}
            onCancel={() => setShowCreateModal(false)}
          />
        </FormModal>

        <FormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingAudit(null)
          }}
          title="Edit Shelf Audit"
        >
          <ShelfAuditForm
            initialData={editingAudit || undefined}
            onSubmit={handleEditAudit}
            onCancel={() => {
              setShowEditModal(false)
              setEditingAudit(null)
            }}
          />
        </FormModal>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}
