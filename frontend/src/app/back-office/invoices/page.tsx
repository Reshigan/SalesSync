'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  AlertTriangle,
  TrendingUp,
  Package
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerId: string
  orderNumber: string
  issueDate: string
  dueDate: string
  items: number
  subtotal: number
  tax: number
  discount: number
  total: number
  amountPaid: number
  amountDue: number
  status: 'draft' | 'sent' | 'viewed' | 'overdue' | 'paid' | 'cancelled'
  paymentTerms: string
  notes?: string
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const invoices: Invoice[] = [
    {
      id: 'INV001',
      invoiceNumber: 'INV-2025-001',
      customerName: 'ABC Supermarket',
      customerId: 'CUST001',
      orderNumber: 'ORD-2025-123',
      issueDate: '2025-10-01',
      dueDate: '2025-10-15',
      items: 5,
      subtotal: 15000,
      tax: 2250,
      discount: 500,
      total: 16750,
      amountPaid: 16750,
      amountDue: 0,
      status: 'paid',
      paymentTerms: 'Net 14'
    },
    {
      id: 'INV002',
      invoiceNumber: 'INV-2025-002',
      customerName: 'XYZ Retail Store',
      customerId: 'CUST002',
      orderNumber: 'ORD-2025-124',
      issueDate: '2025-10-02',
      dueDate: '2025-10-16',
      items: 8,
      subtotal: 22000,
      tax: 3300,
      discount: 1000,
      total: 24300,
      amountPaid: 10000,
      amountDue: 14300,
      status: 'sent',
      paymentTerms: 'Net 14'
    },
    {
      id: 'INV003',
      invoiceNumber: 'INV-2025-003',
      customerName: 'Corner Shop',
      customerId: 'CUST003',
      orderNumber: 'ORD-2025-125',
      issueDate: '2025-09-20',
      dueDate: '2025-10-04',
      items: 3,
      subtotal: 8500,
      tax: 1275,
      discount: 0,
      total: 9775,
      amountPaid: 0,
      amountDue: 9775,
      status: 'overdue',
      paymentTerms: 'Net 14',
      notes: 'Follow up required'
    },
    {
      id: 'INV004',
      invoiceNumber: 'INV-2025-004',
      customerName: 'Big Box Store',
      customerId: 'CUST004',
      orderNumber: 'ORD-2025-126',
      issueDate: '2025-10-03',
      dueDate: '2025-10-17',
      items: 12,
      subtotal: 35000,
      tax: 5250,
      discount: 2000,
      total: 38250,
      amountPaid: 0,
      amountDue: 38250,
      status: 'viewed',
      paymentTerms: 'Net 14'
    },
    {
      id: 'INV005',
      invoiceNumber: 'INV-2025-005',
      customerName: 'Quick Mart',
      customerId: 'CUST005',
      orderNumber: 'ORD-2025-127',
      issueDate: '2025-10-04',
      dueDate: '2025-10-18',
      items: 6,
      subtotal: 12500,
      tax: 1875,
      discount: 300,
      total: 14075,
      amountPaid: 0,
      amountDue: 14075,
      status: 'draft',
      paymentTerms: 'Net 14'
    }
  ]

  const stats = {
    totalInvoices: invoices.length,
    totalValue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(inv => inv.status === 'paid').length,
    paidValue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    overdueValue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    outstanding: invoices.reduce((sum, inv) => sum + inv.amountDue, 0)
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Invoice['status']) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-700', icon: Send, label: 'Sent' },
      viewed: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Viewed' },
      overdue: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Overdue' },
      paid: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Paid' },
      cancelled: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' }
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
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              Invoice Management
            </h1>
            <p className="text-gray-600 mt-1">Manage customer invoices and billing</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="w-5 h-5" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
              <Plus className="w-5 h-5" />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Stats - Wide Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.paid}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {formatCurrency(stats.paidValue)}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdue}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {formatCurrency(stats.overdueValue)}
                </p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.outstanding)}</p>
                <p className="text-xs text-gray-500 mt-1">To collect</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {((stats.paidValue / stats.totalValue) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
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
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>
        </Card>

        {/* Invoices Table - Wide Desktop Layout */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-indigo-500 mr-2" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{invoice.items} items</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.customerName}</p>
                        <p className="text-xs text-gray-500">{invoice.customerId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-mono">{invoice.orderNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {invoice.issueDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {invoice.dueDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-semibold ${invoice.amountDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {formatCurrency(invoice.amountDue)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Send">
                          <Send className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download">
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

        {filteredInvoices.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
