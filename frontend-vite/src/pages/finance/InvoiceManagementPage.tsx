import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FileText, Download, Send, Eye, Plus, Filter, Search, Check, X, Clock, Printer, RefreshCw } from 'lucide-react'
import { apiClient } from '../../services/api.service'

interface Invoice {
  id: string
  invoiceNumber: string
  invoice_number?: string
  customerId: string
  customer_id?: string
  customerName: string
  customer_name?: string
  date: string
  dueDate: string
  due_date?: string
  amount: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentTerms: string
  payment_terms?: string
  items: InvoiceItem[]
  notes?: string
}

interface InvoiceItem {
  id: string
  productName: string
  product_name?: string
  description: string
  quantity: number
  price: number
  tax: number
  total: number
}

export default function InvoiceManagementPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/invoices${qs ? `?${qs}` : ''}`)
      const data = res.data?.data || res.data
      const list = Array.isArray(data) ? data : data?.invoices || []
      setInvoices(list.map((inv: Record<string, unknown>) => ({
        ...inv,
        invoiceNumber: inv.invoiceNumber || inv.invoice_number || inv.id,
        customerName: inv.customerName || inv.customer_name || '',
        dueDate: inv.dueDate || inv.due_date || '',
        paymentTerms: inv.paymentTerms || inv.payment_terms || '',
        items: Array.isArray(inv.items) ? inv.items : [],
        amount: Number(inv.amount) || 0,
        tax: Number(inv.tax) || 0,
        total: Number(inv.total) || 0,
      })))
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create, manage, and track invoices</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => navigate('/finance/invoices/create')}>
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Invoiced</p>
              <p className="text-3xl font-bold mt-1">${stats.total.toLocaleString()}</p>
            </div>
            <FileText className="w-12 h-12 text-[#C0E02E]" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-3xl font-bold mt-1">${stats.paid.toLocaleString()}</p>
            </div>
            <Check className="w-12 h-12 text-green-500" />
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
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-3xl font-bold mt-1">${stats.overdue.toLocaleString()}</p>
            </div>
            <X className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Invoice</th>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Customer</th>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Due Date</th>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Amount</th>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{invoice.paymentTerms}</div>
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.customerName}</div>
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">${invoice.total.toLocaleString()}</div>
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice)
                        setIsViewModalOpen(true)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="text-purple-600 hover:text-purple-900">
                      <Send className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">From:</h3>
                    <p className="text-gray-900 font-semibold">Your Company Name</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Bill To:</h3>
                    <p className="text-gray-900 font-semibold">{selectedInvoice.customerName}</p>
                  </div>
                </div>

                <div>
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-900">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between py-2 border-t border-gray-100">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">${selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold text-gray-900">${selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-300">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-blue-600">${selectedInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button className="btn btn-outline flex items-center gap-2" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button className="btn btn-secondary flex items-center gap-2" onClick={() => window.print()}>
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button className="btn btn-primary flex items-center gap-2" onClick={() => navigate('/finance/invoices/create')}>
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
