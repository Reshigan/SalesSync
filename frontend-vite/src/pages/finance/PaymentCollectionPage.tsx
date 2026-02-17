import { useState, useEffect } from 'react'
import { DollarSign, CreditCard, Clock, CheckCircle, XCircle, Search, Filter, Calendar, Download } from 'lucide-react'
import { apiClient } from '../../services/api.service'

interface Payment {
  id: string
  paymentNumber: string
  invoiceNumber: string
  customerName: string
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'mobile'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  date: string
  reference?: string
  notes?: string
}

export default function PaymentCollectionPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [statusFilter, methodFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (methodFilter !== 'all') params.method = methodFilter
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/payments${qs ? `?${qs}` : ''}`)
      const data = res.data?.data || res.data
      setPayments(Array.isArray(data) ? data : data?.payments || [])
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />
      case 'cash': return <DollarSign className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    const matchesDate = (!dateRange.from || payment.date >= dateRange.from) &&
                       (!dateRange.to || payment.date <= dateRange.to)
    return matchesSearch && matchesStatus && matchesMethod && matchesDate
  })

  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    failed: payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Collection</h1>
          <p className="mt-1 text-sm text-gray-600">Track and manage payment transactions</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Collected</p>
              <p className="text-3xl font-bold mt-1">${stats.total.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-[#C0E02E]" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-1">${stats.completed.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">${stats.pending.toLocaleString()}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Failed</p>
              <p className="text-3xl font-bold mt-1">${stats.failed.toLocaleString()}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input flex-1"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="text-gray-400 w-5 h-5" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input flex-1"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="mobile">Mobile Payment</option>
            </select>
          </div>

          <button className="btn btn-outline flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Payment #</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{payment.paymentNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      {payment.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.customerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">${payment.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {getMethodIcon(payment.method)}
                      <span className="capitalize">{payment.method.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.reference || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
          <div className="space-y-3">
            {['cash', 'card', 'bank_transfer', 'mobile', 'cheque'].map((method) => {
              const total = payments
                .filter(p => p.method === method && p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0)
              const percentage = stats.completed > 0 ? (total / stats.completed) * 100 : 0
              
              return (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {method.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">${total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-100' :
                    payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {getStatusIcon(payment.status)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{payment.customerName}</div>
                    <div className="text-xs text-gray-500">{payment.paymentNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">${payment.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
