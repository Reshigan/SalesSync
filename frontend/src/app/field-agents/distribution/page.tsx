'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem, MobileButton, MobileInput, MobileFloatingActionButton } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { fieldAgentsService, ProductDistribution } from '@/services/field-agents.service'

import { 
  Plus,
  Search,
  Filter,
  Package,
  MapPin,
  Calendar,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function ProductDistributionPage() {
  const [distributions, setDistributions] = useState<ProductDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
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
    loadDistributions()
  }, [statusFilter])

  const loadDistributions = async () => {
    try {
      setIsLoading(true)
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await fieldAgentsService.getProductDistributions(filters)
      setDistributions(response.data || [])
    } catch (err) {
      error('Failed to load product distributions')
      console.error('Error loading distributions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDistribution = async (distributionData: Partial<ProductDistribution>) => {
    try {
      await fieldAgentsService.createProductDistribution(distributionData)
      success('Product distribution created successfully')
      setShowCreateModal(false)
      loadDistributions()
    } catch (err) {
      error('Failed to create product distribution')
      console.error('Error creating distribution:', err)
    }
  }

  const handleUpdateDistribution = async (id: string, distributionData: Partial<ProductDistribution>) => {
    try {
      await fieldAgentsService.updateProductDistribution(id, distributionData)
      success('Product distribution updated successfully')
      loadDistributions()
    } catch (err) {
      error('Failed to update product distribution')
      console.error('Error updating distribution:', err)
    }
  }

  const filteredDistributions = distributions.filter(distribution =>
    distribution.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISTRIBUTED': return 'bg-blue-100 text-blue-800'
      case 'VERIFIED': return 'bg-green-100 text-green-800'
      case 'RETURNED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DISTRIBUTED': return <Clock className="h-4 w-4" />
      case 'VERIFIED': return <CheckCircle className="h-4 w-4" />
      case 'RETURNED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const totalDistributions = distributions.length
  const verifiedDistributions = distributions.filter(d => d.status === 'VERIFIED').length
  const pendingDistributions = distributions.filter(d => d.status === 'DISTRIBUTED').length
  const totalQuantity = distributions.reduce((sum, d) => sum + d.quantity, 0)

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Distribution" showBackButton>
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalDistributions}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">{verifiedDistributions}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </MobileCard>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingDistributions}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalQuantity}</div>
                <div className="text-sm text-gray-600">Total Qty</div>
              </MobileCard>
            </div>

            {/* Search */}
            <MobileInput
              placeholder="Search distributions..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-5 h-5" />}
            />

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'DISTRIBUTED', 'VERIFIED', 'RETURNED'].map((status) => (
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

            {/* Distributions List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <MobileList>
                {filteredDistributions.map((distribution) => (
                  <MobileListItem
                    key={distribution.id}
                    title={distribution.productName}
                    subtitle={`Agent: ${distribution.agent?.name || 'Unassigned'}`}
                    description={`Qty: ${distribution.quantity} | ${new Date(distribution.distributionDate).toLocaleDateString()}`}
                    badge={{
                      text: distribution.status,
                      color: distribution.status === 'VERIFIED' ? 'green' : 
                             distribution.status === 'RETURNED' ? 'red' : 'blue'
                    }}
                    rightText={distribution.location ? `📍 ${distribution.location}` : ''}
                    onClick={() => router.push(`/field-agents/distribution/${distribution.id}`)}
                  />
                ))}
              </MobileList>
            )}

            {filteredDistributions.length === 0 && !isLoading && (
              <MobileCard className="text-center py-8">
                <div className="text-gray-500">
                  No distributions found matching your criteria.
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
              <h1 className="text-3xl font-bold text-gray-900">Product Distribution</h1>
              <p className="mt-2 text-gray-600">
                Track product handouts and distribution by field agents
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Distribution
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distributions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDistributions}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{verifiedDistributions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingDistributions}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                  <p className="text-2xl font-bold text-purple-600">{totalQuantity}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
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
                    placeholder="Search distributions..."
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
                  <option value="DISTRIBUTED">Distributed</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Distributions Table */}
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
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distribution Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDistributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Customer: {distribution.customerId}
                              </div>
                              {distribution.location && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {distribution.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{distribution.productId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{distribution.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(distribution.status)}`}>
                            {getStatusIcon(distribution.status)}
                            {distribution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(distribution.distributionDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {distribution.coordinates.latitude.toFixed(4)}, {distribution.coordinates.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/field-agents/distribution/${distribution.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/field-agents/distribution/${distribution.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {distribution.status === 'DISTRIBUTED' && (
                              <button
                                onClick={() => handleUpdateDistribution(distribution.id, { status: 'VERIFIED', verifiedAt: new Date().toISOString() })}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as Verified"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredDistributions.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No product distributions found matching your criteria.
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