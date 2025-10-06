'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Eye, DollarSign, RefreshCw, Calendar, Users, TrendingUp, Calculator, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { apiClient, handleApiError, handleApiSuccess } from '@/lib/api-client'
import Link from 'next/link'

interface Commission {
  id: string
  userId: string
  period: string
  salesAmount: number
  commissionRate: number
  commissionAmount: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
  calculatedAt: string
  paidAt?: string
  notes?: string
  user: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  breakdown: {
    baseSales: number
    bonusSales: number
    baseCommission: number
    bonusCommission: number
    deductions: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const COMMISSION_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'APPROVED', label: 'Approved', color: 'info' },
  { value: 'PAID', label: 'Paid', color: 'success' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' }
] as const

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [showCalculateModal, setShowCalculateModal] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [commissionStats, setCommissionStats] = useState<any>(null)

  useEffect(() => {
    fetchCommissions()
    fetchCommissionStats()
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, periodFilter])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCommissions({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        period: periodFilter || undefined
      })

      const data = response as any
      setCommissions(data.commissions || [])
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch commissions')
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissionStats = async () => {
    try {
      const response = await apiClient.getCommissionStats()
      setCommissionStats(response)
    } catch (error) {
      console.error('Failed to fetch commission stats:', error)
    }
  }

  const handleCalculateCommissions = async (calculationData: any) => {
    try {
      setSubmitting(true)
      const response = await apiClient.calculateCommissions(calculationData) as any
      handleApiSuccess((response as any).message || 'Commissions calculated successfully')
      setShowCalculateModal(false)
      fetchCommissions()
      fetchCommissionStats()
    } catch (error) {
      handleApiError(error, 'Failed to calculate commissions')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateCommissionStatus = async (commissionId: string, status: string) => {
    try {
      const response = await apiClient.updateCommissionStatus(commissionId, status) as any
      handleApiSuccess((response as any).message || 'Commission status updated successfully')
      fetchCommissions()
      fetchCommissionStats()
    } catch (error) {
      handleApiError(error, 'Failed to update commission status')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') {
      setStatusFilter(value)
    } else if (type === 'period') {
      setPeriodFilter(value)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = COMMISSION_STATUSES.find(s => s.value === status)
    return (
      <Badge variant={statusConfig?.color as any || 'default'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const columns = [
    {
      key: 'agent',
      label: 'Agent',
      render: (commission: Commission) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {commission.user.firstName.charAt(0)}{commission.user.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium">{commission.user.firstName} {commission.user.lastName}</div>
            <div className="text-sm text-gray-500">{commission.user.role}</div>
          </div>
        </div>
      )
    },
    {
      key: 'period',
      label: 'Period',
      render: (commission: Commission) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span>{commission.period}</span>
        </div>
      )
    },
    {
      key: 'sales',
      label: 'Sales Amount',
      render: (commission: Commission) => (
        <div>
          <div className="font-medium">{formatCurrency(commission.salesAmount)}</div>
          <div className="text-sm text-gray-500">{commission.commissionRate}% rate</div>
        </div>
      )
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (commission: Commission) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-gray-400" />
          <span className="font-medium">{formatCurrency(commission.commissionAmount)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (commission: Commission) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(commission.status)}
          {commission.status === 'APPROVED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateCommissionStatus(commission.id, 'PAID')}
              className="text-xs"
            >
              Mark Paid
            </Button>
          )}
        </div>
      )
    },
    {
      key: 'calculated',
      label: 'Calculated',
      render: (commission: Commission) => (
        <div className="text-sm text-gray-500">
          {new Date(commission.calculatedAt).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (commission: Commission) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCommission(commission)
              setShowDetailsModal(true)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/commissions/${commission.id}`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
  ]

  const totalPaid = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0)
  const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0)
  const totalApproved = commissions.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + c.commissionAmount, 0)

  if (loading && commissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600">Track and manage agent commissions and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchCommissions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCalculateModal(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Commissions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(commissionStats?.totalPaid || totalPaid)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(commissionStats?.totalPending || totalPending)}
              </p>
            </div>
            <Badge variant="warning">Pending</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(commissionStats?.totalApproved || totalApproved)}
              </p>
            </div>
            <Badge variant="info">Approved</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(commissionStats?.thisMonth || 0)}
              </p>
            </div>
            <Badge variant="default">Current</Badge>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {COMMISSION_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Periods</option>
            <option value="2024-01">January 2024</option>
            <option value="2024-02">February 2024</option>
            <option value="2024-03">March 2024</option>
            <option value="2024-04">April 2024</option>
            <option value="2024-05">May 2024</option>
            <option value="2024-06">June 2024</option>
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Commissions Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Commissions ({pagination.total})
            </h3>
            {loading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
        </div>
        
        <SimpleTable
          data={commissions}
          columns={columns}
          emptyMessage="No commissions found"
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Calculate Commissions Modal */}
      <Modal
        isOpen={showCalculateModal}
        onClose={() => setShowCalculateModal(false)}
        title="Calculate Commissions"
      >
        <CommissionCalculationForm
          onSubmit={handleCalculateCommissions}
          onCancel={() => setShowCalculateModal(false)}
          submitting={submitting}
        />
      </Modal>

      {/* Commission Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedCommission(null)
        }}
        title="Commission Details"
      >
        {selectedCommission && (
          <CommissionDetails
            commission={selectedCommission}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedCommission(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

interface CommissionCalculationFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  submitting?: boolean
}

function CommissionCalculationForm({ onSubmit, onCancel, submitting = false }: CommissionCalculationFormProps) {
  const [formData, setFormData] = useState({
    period: '',
    userIds: [] as string[],
    includeBonus: true,
    applyDeductions: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Period *
        </label>
        <input
          type="month"
          value={formData.period}
          onChange={(e) => setFormData({ ...formData, period: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={submitting}
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.includeBonus}
            onChange={(e) => setFormData({ ...formData, includeBonus: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={submitting}
          />
          <span className="ml-2 text-sm text-gray-700">Include bonus commissions</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.applyDeductions}
            onChange={(e) => setFormData({ ...formData, applyDeductions: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={submitting}
          />
          <span className="ml-2 text-sm text-gray-700">Apply deductions</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Calculating...
            </>
          ) : (
            'Calculate Commissions'
          )}
        </Button>
      </div>
    </form>
  )
}

interface CommissionDetailsProps {
  commission: Commission
  onClose: () => void
}

function CommissionDetails({ commission, onClose }: CommissionDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">{commission.user.firstName} {commission.user.lastName}</h4>
        <p className="text-sm text-gray-600">Period: {commission.period}</p>
        <p className="text-sm text-gray-600">Status: {commission.status}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sales Amount</label>
          <p className="text-lg font-semibold">{formatCurrency(commission.salesAmount)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
          <p className="text-lg font-semibold">{commission.commissionRate}%</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount</label>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(commission.commissionAmount)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calculated At</label>
          <p className="text-sm">{new Date(commission.calculatedAt).toLocaleString()}</p>
        </div>
      </div>

      {commission.breakdown && (
        <div>
          <h5 className="font-medium mb-2">Commission Breakdown</h5>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Sales:</span>
              <span>{formatCurrency(commission.breakdown.baseSales)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bonus Sales:</span>
              <span>{formatCurrency(commission.breakdown.bonusSales)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Base Commission:</span>
              <span>{formatCurrency(commission.breakdown.baseCommission)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bonus Commission:</span>
              <span>{formatCurrency(commission.breakdown.bonusCommission)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Deductions:</span>
              <span className="text-red-600">-{formatCurrency(commission.breakdown.deductions)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-medium">
              <span>Total Commission:</span>
              <span className="text-green-600">{formatCurrency(commission.commissionAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {commission.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{commission.notes}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}