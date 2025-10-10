'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem, MobileButton, MobileInput, MobileFloatingActionButton } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { fieldAgentsService, Commission } from '@/services/field-agents.service'

import { 
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  TrendingUp,
  Eye,
  Edit,
  Check,
  X
} from 'lucide-react'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  
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
    loadCommissions()
  }, [statusFilter, activityTypeFilter])

  const loadCommissions = async () => {
    try {
      setIsLoading(true)
      const filters: any = {}
      if (statusFilter !== 'all') filters.paymentStatus = statusFilter
      if (activityTypeFilter !== 'all') filters.activityType = activityTypeFilter
      
      const response = await fieldAgentsService.getCommissions(filters)
      setCommissions(response.data || [])
    } catch (err) {
      error('Failed to load commissions')
      console.error('Error loading commissions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCommissionStatus = async (id: string, status: string, notes?: string) => {
    try {
      await fieldAgentsService.updateCommissionStatus(id, status, notes)
      success(`Commission ${status.toLowerCase()} successfully`)
      loadCommissions()
    } catch (err) {
      error(`Failed to update commission status`)
      console.error('Error updating commission:', err)
    }
  }

  const handleBulkPayment = async () => {
    if (selectedCommissions.length === 0) {
      error('Please select commissions to process')
      return
    }

    try {
      const paymentDetails = {
        processedBy: 'admin', // This would come from auth context
        processedAt: new Date().toISOString(),
        method: 'bank_transfer'
      }
      
      await fieldAgentsService.processCommissionPayment(selectedCommissions, paymentDetails)
      success(`${selectedCommissions.length} commissions processed successfully`)
      setSelectedCommissions([])
      loadCommissions()
    } catch (err) {
      error('Failed to process commission payments')
      console.error('Error processing payments:', err)
    }
  }

  const filteredCommissions = commissions.filter(commission =>
    commission.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.activityId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PARTIAL': return 'bg-blue-100 text-blue-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'PARTIAL': return <CreditCard className="h-4 w-4" />
      case 'PAID': return <CheckCircle className="h-4 w-4" />
      case 'OVERDUE': return <XCircle className="h-4 w-4" />
      case 'REFUNDED': return <TrendingUp className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'BOARD_PLACEMENT': return 'bg-purple-100 text-purple-800'
      case 'PRODUCT_DISTRIBUTION': return 'bg-blue-100 text-blue-800'
      case 'VISIT_COMPLETION': return 'bg-green-100 text-green-800'
      case 'SURVEY_COMPLETION': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalCommissions = commissions.length
  const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
  const pendingAmount = commissions.filter(c => c.paymentStatus === 'PENDING').reduce((sum, c) => sum + c.amount, 0)
  const paidAmount = commissions.filter(c => c.paymentStatus === 'PAID').reduce((sum, c) => sum + c.amount, 0)

  const toggleCommissionSelection = (id: string) => {
    setSelectedCommissions(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCommissions.length === filteredCommissions.length) {
      setSelectedCommissions([])
    } else {
      setSelectedCommissions(filteredCommissions.map(c => c.id))
    }
  }

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Commissions" showBackButton>
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalCommissions}</div>
                <div className="text-sm text-gray-600">Total</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </MobileCard>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Paid</div>
              </MobileCard>
            </div>

            {/* Search */}
            <MobileInput
              placeholder="Search commissions..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-5 h-5" />}
            />

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'PENDING', 'PAID', 'CANCELLED'].map((status) => (
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

            {/* Activity Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'VISIT', 'BOARD_PLACEMENT', 'PRODUCT_DISTRIBUTION'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActivityTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap touch-manipulation ${
                    activityTypeFilter === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Commissions List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <MobileList>
                {filteredCommissions.map((commission) => (
                  <MobileListItem
                    key={commission.id}
                    title={`$${commission.amount.toFixed(2)}`}
                    subtitle={`Agent: ${commission.agentId}`}
                    description={`${commission.activityType?.replace('_', ' ') || 'Unknown Activity'} | ${new Date(commission.earnedDate || commission.createdAt).toLocaleDateString()}`}
                    badge={{
                      text: commission.paymentStatus,
                      color: commission.paymentStatus === 'PAID' ? 'green' : 
                             commission.paymentStatus === 'REFUNDED' ? 'red' : 'yellow'
                    }}
                    rightText={commission.paymentDate ? `💰 ${new Date(commission.paymentDate).toLocaleDateString()}` : '⏳'}
                    onClick={() => router.push(`/field-agents/commissions/${commission.id}`)}
                  />
                ))}
              </MobileList>
            )}

            {filteredCommissions.length === 0 && !isLoading && (
              <MobileCard className="text-center py-8">
                <div className="text-gray-500">
                  No commissions found matching your criteria.
                </div>
              </MobileCard>
            )}

            {/* Bulk Actions */}
            {selectedCommissions.length > 0 && (
              <MobileCard className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {selectedCommissions.length} selected
                  </span>
                  <div className="flex gap-2">
                    <MobileButton
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCommissions([])}
                    >
                      Clear
                    </MobileButton>
                    <MobileButton
                      size="sm"
                      onClick={() => {
                        // Handle bulk payment
                        success('Bulk payment processed');
                        setSelectedCommissions([]);
                      }}
                    >
                      Pay Selected
                    </MobileButton>
                  </div>
                </div>
              </MobileCard>
            )}
          </div>

          {/* Floating Action Button */}
          <MobileFloatingActionButton
            onClick={() => router.push('/field-agents/commissions/create')}
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
              <h1 className="text-3xl font-bold text-gray-900">Commission Tracking</h1>
              <p className="mt-2 text-gray-600">
                Monitor and process field agent commissions
              </p>
            </div>
            <div className="flex gap-2">
              {selectedCommissions.length > 0 && (
                <button
                  onClick={handleBulkPayment}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Process Payment ({selectedCommissions.length})
                </button>
              )}
              <button
                onClick={() => router.push('/field-agents/commissions/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Commission
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCommissions}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-600">${totalAmount.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
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
                    placeholder="Search commissions..."
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
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Activities</option>
                  <option value="BOARD_PLACEMENT">Board Placement</option>
                  <option value="PRODUCT_DISTRIBUTION">Product Distribution</option>
                  <option value="VISIT_COMPLETION">Visit Completion</option>
                  <option value="SURVEY_COMPLETION">Survey Completion</option>
                </select>
              </div>
            </div>
          </div>

          {/* Commissions Table */}
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
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCommissions.length === filteredCommissions.length && filteredCommissions.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earned Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={() => toggleCommissionSelection(commission.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Agent {commission.agentId}
                              </div>

                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityTypeColor(commission.activityType || 'SALES')}`}>
                            {commission.activityType?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${commission.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.paymentStatus)}`}>
                            {getStatusIcon(commission.paymentStatus)}
                            {commission.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(commission.earnedDate || commission.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {commission.paidDate ? 
                              new Date(commission.paidDate).toLocaleDateString() : 
                              '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/field-agents/commissions/${commission.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {commission.paymentStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateCommissionStatus(commission.id, 'PAID')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as Paid"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateCommissionStatus(commission.id, 'OVERDUE')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Mark as Overdue"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => router.push(`/field-agents/commissions/${commission.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredCommissions.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No commissions found matching your criteria.
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