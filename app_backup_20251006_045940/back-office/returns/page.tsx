'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Calendar,
  User,
  AlertTriangle,
  TrendingDown,
  DollarSign
} from 'lucide-react'

interface Return {
  id: string
  returnNumber: string
  orderNumber: string
  customerName: string
  customerId: string
  returnDate: string
  items: number
  totalAmount: number
  refundAmount: number
  reason: 'damaged' | 'wrong_item' | 'quality_issue' | 'customer_request' | 'expired'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  processedBy?: string
  notes?: string
}

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reasonFilter, setReasonFilter] = useState<string>('all')

  const returns: Return[] = [
    {
      id: 'RET001',
      returnNumber: 'RET-2025-001',
      orderNumber: 'ORD-2025-098',
      customerName: 'ABC Supermarket',
      customerId: 'CUST001',
      returnDate: '2025-10-01',
      items: 2,
      totalAmount: 3500,
      refundAmount: 3500,
      reason: 'damaged',
      status: 'approved',
      processedBy: 'John Admin',
      notes: 'Products damaged during delivery'
    },
    {
      id: 'RET002',
      returnNumber: 'RET-2025-002',
      orderNumber: 'ORD-2025-102',
      customerName: 'XYZ Retail Store',
      customerId: 'CUST002',
      returnDate: '2025-10-02',
      items: 1,
      totalAmount: 1200,
      refundAmount: 1200,
      reason: 'wrong_item',
      status: 'completed',
      processedBy: 'Sarah Manager',
      notes: 'Wrong variant shipped'
    },
    {
      id: 'RET003',
      returnNumber: 'RET-2025-003',
      orderNumber: 'ORD-2025-105',
      customerName: 'Corner Shop',
      customerId: 'CUST003',
      returnDate: '2025-10-03',
      items: 3,
      totalAmount: 4500,
      refundAmount: 0,
      reason: 'quality_issue',
      status: 'pending',
      notes: 'Quality inspection required'
    },
    {
      id: 'RET004',
      returnNumber: 'RET-2025-004',
      orderNumber: 'ORD-2025-108',
      customerName: 'Big Box Store',
      customerId: 'CUST004',
      returnDate: '2025-10-03',
      items: 5,
      totalAmount: 8900,
      refundAmount: 0,
      reason: 'customer_request',
      status: 'rejected',
      processedBy: 'Mike Manager',
      notes: 'Outside return policy period'
    },
    {
      id: 'RET005',
      returnNumber: 'RET-2025-005',
      orderNumber: 'ORD-2025-112',
      customerName: 'Quick Mart',
      customerId: 'CUST005',
      returnDate: '2025-10-04',
      items: 4,
      totalAmount: 6700,
      refundAmount: 6700,
      reason: 'expired',
      status: 'approved',
      processedBy: 'John Admin',
      notes: 'Products near expiry'
    }
  ]

  const stats = {
    totalReturns: returns.length,
    totalValue: returns.reduce((sum, r) => sum + r.totalAmount, 0),
    refunded: returns.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.refundAmount, 0),
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length
  }

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter
    const matchesReason = reasonFilter === 'all' || ret.reason === reasonFilter
    return matchesSearch && matchesStatus && matchesReason
  })

  const getStatusBadge = (status: Return['status']) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Completed' }
    }
    const badge = badges[status]
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getReasonBadge = (reason: Return['reason']) => {
    const badges = {
      damaged: { color: 'bg-red-100 text-red-800', label: 'Damaged' },
      wrong_item: { color: 'bg-orange-100 text-orange-800', label: 'Wrong Item' },
      quality_issue: { color: 'bg-purple-100 text-purple-800', label: 'Quality Issue' },
      customer_request: { color: 'bg-blue-100 text-blue-800', label: 'Customer Request' },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badges[reason].color}`}>
        {badges[reason].label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Desktop Optimized */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <RotateCcw className="w-8 h-8 text-white" />
              </div>
              Returns Management
            </h1>
            <p className="text-gray-600 mt-1">Process and track product returns</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="w-5 h-5" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg">
              <Plus className="w-5 h-5" />
              New Return
            </button>
          </div>
        </div>

        {/* Stats - Wide Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReturns}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
                <p className="text-xs text-yellow-600 mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Awaiting review
                </p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approved}</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready to process
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <XCircle className="w-3 h-3 mr-1" />
                  Declined
                </p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.refunded)}</p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters - Desktop Layout */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search returns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Reasons</option>
              <option value="damaged">Damaged</option>
              <option value="wrong_item">Wrong Item</option>
              <option value="quality_issue">Quality Issue</option>
              <option value="customer_request">Customer Request</option>
              <option value="expired">Expired</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>
        </Card>

        {/* Returns Table - Wide Desktop Layout */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Refund</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <RotateCcw className="w-5 h-5 text-orange-500 mr-2" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ret.returnNumber}</p>
                          {ret.notes && (
                            <p className="text-xs text-gray-500">{ret.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-mono">{ret.orderNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ret.customerName}</p>
                        <p className="text-xs text-gray-500">{ret.customerId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {ret.returnDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end text-sm text-gray-900">
                        <Package className="w-4 h-4 mr-1 text-gray-400" />
                        {ret.items}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(ret.totalAmount)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-semibold ${ret.refundAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {formatCurrency(ret.refundAmount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getReasonBadge(ret.reason)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ret.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredReturns.length === 0 && (
          <Card className="p-12 text-center">
            <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No returns found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
