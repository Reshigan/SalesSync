'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  Building,
  User,
  AlertTriangle,
  TrendingUp,
  Banknote
} from 'lucide-react'

interface Payment {
  id: string
  paymentNumber: string
  customerName: string
  customerId: string
  invoiceNumber: string
  paymentDate: string
  amount: number
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque'
  reference: string
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  processedBy: string
  notes?: string
}

export default function PaymentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const payments: Payment[] = [
    {
      id: 'PAY001',
      paymentNumber: 'PAY-2025-001',
      customerName: 'ABC Supermarket',
      customerId: 'CUST001',
      invoiceNumber: 'INV-2025-001',
      paymentDate: '2025-10-01',
      amount: 16750,
      paymentMethod: 'bank_transfer',
      reference: 'TXN123456789',
      status: 'completed',
      processedBy: 'John Admin'
    },
    {
      id: 'PAY002',
      paymentNumber: 'PAY-2025-002',
      customerName: 'XYZ Retail Store',
      customerId: 'CUST002',
      invoiceNumber: 'INV-2025-002',
      paymentDate: '2025-10-02',
      amount: 10000,
      paymentMethod: 'cash',
      reference: 'CASH-001',
      status: 'completed',
      processedBy: 'Sarah Manager'
    },
    {
      id: 'PAY003',
      paymentNumber: 'PAY-2025-003',
      customerName: 'Big Box Store',
      customerId: 'CUST004',
      invoiceNumber: 'INV-2025-004',
      paymentDate: '2025-10-03',
      amount: 38250,
      paymentMethod: 'cheque',
      reference: 'CHQ987654',
      status: 'pending',
      processedBy: 'Mike Finance',
      notes: 'Cheque pending clearance'
    },
    {
      id: 'PAY004',
      paymentNumber: 'PAY-2025-004',
      customerName: 'Quick Mart',
      customerId: 'CUST005',
      invoiceNumber: 'INV-2025-005',
      paymentDate: '2025-10-04',
      amount: 14075,
      paymentMethod: 'card',
      reference: 'CARD-456789',
      status: 'completed',
      processedBy: 'John Admin'
    },
    {
      id: 'PAY005',
      paymentNumber: 'PAY-2025-005',
      customerName: 'Corner Shop',
      customerId: 'CUST003',
      invoiceNumber: 'INV-2025-003',
      paymentDate: '2025-10-04',
      amount: 5000,
      paymentMethod: 'mobile_money',
      reference: 'MM-789456',
      status: 'failed',
      processedBy: 'Sarah Manager',
      notes: 'Insufficient funds'
    }
  ]

  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadge = (status: Payment['status']) => {
    const badges = {
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-700', icon: AlertTriangle, label: 'Refunded' }
    }
    const badge = badges[status]
    const Icon = badge.icon
    return (<ErrorBoundary>

      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    
</ErrorBoundary>)
  }

  const getMethodBadge = (method: Payment['paymentMethod']) => {
    const badges = {
      cash: { color: 'bg-green-100 text-green-800', label: 'Cash' },
      card: { color: 'bg-blue-100 text-blue-800', label: 'Card' },
      bank_transfer: { color: 'bg-purple-100 text-purple-800', label: 'Bank Transfer' },
      mobile_money: { color: 'bg-orange-100 text-orange-800', label: 'Mobile Money' },
      cheque: { color: 'bg-gray-100 text-gray-800', label: 'Cheque' }
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badges[method].color}`}>
        {badges[method].label}
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
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              Payment Management
            </h1>
            <p className="text-gray-600 mt-1">Track and manage customer payments</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="w-5 h-5" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg">
              <Plus className="w-5 h-5" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Stats - Wide Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPayments}</p>
                <p className="text-xs text-gray-500 mt-1">All transactions</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Banknote className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-white" />
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
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.failed}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Requires attention
                </p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {((stats.completed / stats.totalPayments) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
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
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>
        </Card>

        {/* Payments Table - Wide Desktop Layout */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 text-green-500 mr-2" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{payment.paymentNumber}</p>
                          {payment.notes && (
                            <p className="text-xs text-gray-500">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.customerName}</p>
                        <p className="text-xs text-gray-500">{payment.customerId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-mono">{payment.invoiceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {payment.paymentDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getMethodBadge(payment.paymentMethod)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-mono">{payment.reference}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="w-4 h-4 mr-1 text-gray-400" />
                        {payment.processedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Receipt">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredPayments.length === 0 && (
          <Card className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
