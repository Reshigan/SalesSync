'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ConsumerActivationForm } from '@/components/consumer-activation/ConsumerActivationForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { consumerActivationService, ConsumerActivation } from '@/services/consumer-activation.service'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Gift,
  CheckCircle,
  RefreshCw,
  Filter,
  User,
  MapPin
} from 'lucide-react'

export default function ConsumerActivationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [activations, setActivations] = useState<ConsumerActivation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingActivation, setEditingActivation] = useState<ConsumerActivation | null>(null)

  // Mock agent brands - replace with actual data from context/API
  const agentBrands = [
    { id: '1', name: 'Safaricom', permissions: { canDistributeSims: true, canDistributeVouchers: true } },
    { id: '2', name: 'Airtel', permissions: { canDistributeSims: true, canDistributeVouchers: true } },
    { id: '3', name: 'Coca-Cola', permissions: { canDistributeSims: false, canDistributeVouchers: true } }
  ]

  // Stats
  const stats = {
    total: activations.length,
    simDistributions: activations.filter(a => a.activationType === 'sim_distribution').length,
    voucherDistributions: activations.filter(a => a.activationType === 'voucher_distribution').length,
    completedKYCs: activations.filter(a => a.status === 'completed').length
  }

  useEffect(() => {
    loadActivations()
  }, [filterType, filterStatus])

  const loadActivations = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterType !== 'all') filters.activationType = filterType
      if (filterStatus !== 'all') filters.status = filterStatus
      if (searchTerm) filters.search = searchTerm
      
      const response = await consumerActivationService.getActivations(filters)
      setActivations(response.activations || [])
    } catch (error: any) {
      console.error('Error loading activations:', error)
      toast.error(error.message || 'Failed to load consumer activations')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadActivations()
  }

  const handleCreateActivation = async (data: ConsumerActivation) => {
    try {
      await consumerActivationService.createActivation(data)
      toast.success('Consumer activation recorded successfully')
      setShowCreateModal(false)
      loadActivations()
    } catch (error: any) {
      console.error('Error creating activation:', error)
      throw error
    }
  }

  const handleEditActivation = async (data: ConsumerActivation) => {
    if (!editingActivation?.id) return
    
    try {
      await consumerActivationService.updateActivation(editingActivation.id, data)
      toast.success('Activation updated successfully')
      setShowEditModal(false)
      setEditingActivation(null)
      loadActivations()
    } catch (error: any) {
      console.error('Error updating activation:', error)
      throw error
    }
  }

  const handleDeleteActivation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activation?')) return

    try {
      await consumerActivationService.deleteActivation(id)
      toast.success('Activation deleted successfully')
      loadActivations()
    } catch (error: any) {
      console.error('Error deleting activation:', error)
      toast.error(error.message || 'Failed to delete activation')
    }
  }

  const openEditModal = (activation: ConsumerActivation) => {
    setEditingActivation(activation)
    setShowEditModal(true)
  }

  const getStatusBadge = (status: ConsumerActivation['status']) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: User },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: User }
    }
    const { color, icon: Icon } = config[status]
    return (<ErrorBoundary>

      <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    
</ErrorBoundary>)
  }

  const getTypeBadge = (type: ConsumerActivation['activationType']) => {
    const config = {
      sim_distribution: { color: 'bg-blue-100 text-blue-800', icon: Phone },
      voucher_distribution: { color: 'bg-purple-100 text-purple-800', icon: Gift },
      survey: { color: 'bg-teal-100 text-teal-800', icon: User },
      registration: { color: 'bg-indigo-100 text-indigo-800', icon: User }
    }
    const { color, icon: Icon } = config[type]
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consumer Activations</h1>
            <p className="text-gray-600">SIM distribution, vouchers, and KYC management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadActivations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Activation
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SIM Distributions</p>
                <p className="text-2xl font-bold text-blue-600">{stats.simDistributions}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Voucher Distributions</p>
                <p className="text-2xl font-bold text-purple-600">{stats.voucherDistributions}</p>
              </div>
              <Gift className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed KYCs</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedKYCs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
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
                  placeholder="Search by consumer name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="sim_distribution">SIM Distribution</option>
              <option value="voucher_distribution">Voucher Distribution</option>
              <option value="survey">Survey</option>
              <option value="registration">Registration</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
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
                        Loading activations...
                      </div>
                    </td>
                  </tr>
                ) : activations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No activations found</p>
                        <p className="text-sm">Record your first consumer activation</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activations.map((activation) => (
                    <tr key={activation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{activation.kyc.fullName}</span>
                          <span className="text-xs text-gray-500">{activation.kyc.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{activation.brandName || activation.brandId}</span>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(activation.activationType)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {new Date(activation.activationDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {activation.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(activation.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(activation)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activation.id && handleDeleteActivation(activation.id)}
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
        title="Record Consumer Activation"
        onClose={() => setShowCreateModal(false)}
        size="xl"
      >
        <ConsumerActivationForm
          onSubmit={handleCreateActivation}
          onCancel={() => setShowCreateModal(false)}
          agentBrands={agentBrands}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Consumer Activation"
        onClose={() => {
          setShowEditModal(false)
          setEditingActivation(null)
        }}
        size="xl"
      >
        {editingActivation && (
          <ConsumerActivationForm
            initialData={editingActivation}
            onSubmit={handleEditActivation}
            onCancel={() => {
              setShowEditModal(false)
              setEditingActivation(null)
            }}
            agentBrands={agentBrands}
          />
        )}
      </FormModal>
    </DashboardLayout>
  )
}
