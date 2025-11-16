/**
 * Agent Commission Dashboard - Mobile-First
 * Shows agent's earnings, pending/approved/paid commissions
 */

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Clock, CheckCircle, Package, MapPin } from 'lucide-react'
import { apiClient } from '../../services/api.service'
import { useIsMobile } from '../../hooks/useMediaQuery'
import MobileCard from '../../components/mobile/MobileCard'
import { formatCurrency, formatDate } from '../../utils/format'

interface Commission {
  id: string
  type: string
  entity_type: string
  amount: number
  status: string
  description: string
  created_at: string
}

interface Totals {
  total_earnings: number
  pending: number
  approved: number
  paid: number
}

export default function AgentCommissionDashboard() {
  const isMobile = useIsMobile()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEarnings()
  }, [])

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/commission-ledgers/my-earnings')
      const data = response.data.data || []
      const totalsData = response.data.totals || {
        total_earnings: 0,
        pending: 0,
        approved: 0,
        paid: 0
      }
      
      setCommissions(data)
      setTotals(totalsData)
    } catch (err) {
      console.error('Error loading earnings:', err)
      setError('Failed to load earnings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'board_placement': return <MapPin className="h-5 w-5" />
      case 'product_distribution': return <Package className="h-5 w-5" />
      default: return <DollarSign className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'board_placement': return 'Board Placement'
      case 'product_distribution': return 'Product Distribution'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadEarnings}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6">
          <h1 className="text-2xl font-bold">My Earnings</h1>
          <p className="text-primary-100 mt-1">Track your commissions</p>
        </div>

        {/* Stats Cards */}
        <div className="p-4 space-y-3">
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totals?.total_earnings || 0)}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </MobileCard>

          <div className="grid grid-cols-3 gap-3">
            <MobileCard>
              <div className="text-center">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totals?.pending || 0)}
                </p>
              </div>
            </MobileCard>

            <MobileCard>
              <div className="text-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Approved</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totals?.approved || 0)}
                </p>
              </div>
            </MobileCard>

            <MobileCard>
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Paid</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totals?.paid || 0)}
                </p>
              </div>
            </MobileCard>
          </div>
        </div>

        {/* Commission List */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Commissions</h2>
          <div className="space-y-3">
            {commissions.length === 0 ? (
              <MobileCard>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No commissions yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start placing boards and distributing products to earn commissions
                  </p>
                </div>
              </MobileCard>
            ) : (
              commissions.map((commission) => (
                <MobileCard key={commission.id}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(commission.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {getTypeLabel(commission.type)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(commission.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(commission.amount)}
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(commission.status)}`}>
                            {commission.status}
                          </span>
                        </div>
                      </div>
                      {commission.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {commission.description}
                        </p>
                      )}
                    </div>
                  </div>
                </MobileCard>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Earnings</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totals?.total_earnings || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {formatCurrency(totals?.pending || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(totals?.approved || 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totals?.paid || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Commission Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Commissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No commissions yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start placing boards and distributing products to earn commissions
                      </p>
                    </td>
                  </tr>
                ) : (
                  commissions.map((commission) => (
                    <tr key={commission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTypeIcon(commission.type)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {getTypeLabel(commission.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(commission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(commission.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {commission.description || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
