import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, User, CreditCard, Package } from 'lucide-react'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadInvoice() }, [id])

  const loadInvoice = async () => {
    setLoading(true)
    try {
      const response = await salesService.getInvoice(String(id))
      setInvoice(response.data?.data || response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!invoice) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Invoice not found</div></div>

  const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', sent: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800', cancelled: 'bg-red-100 text-red-800', void: 'bg-red-100 text-red-800' }
  const items = invoice.items || invoice.invoice_items || invoice.line_items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/invoices')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number || `#${id}`}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}`}>{invoice.status || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/sales/invoices/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="h-4 w-4" />Edit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Total Amount</p><p className="text-xl font-bold">{formatCurrency(invoice.total_amount || invoice.totalAmount || 0)}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><CreditCard className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Amount Paid</p><p className="text-xl font-bold">{formatCurrency(invoice.amount_paid || invoice.amountPaid || 0)}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-orange-500" /><div><p className="text-sm text-gray-500">Balance Due</p><p className="text-xl font-bold">{formatCurrency(invoice.balance_due || invoice.balanceDue || (invoice.total_amount || 0) - (invoice.amount_paid || 0))}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Due Date</p><p className="text-xl font-bold">{formatDate(invoice.due_date || invoice.dueDate) || 'N/A'}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Invoice Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Invoice Number', invoice.invoice_number], ['Invoice Date', formatDate(invoice.invoice_date)], ['Due Date', formatDate(invoice.due_date)], ['Order Number', invoice.order_number], ['Payment Terms', invoice.payment_terms], ['Reference', invoice.reference], ['Created By', invoice.created_by], ['Created At', formatDate(invoice.created_at)]].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5" />Customer</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Customer', invoice.customer_name], ['Customer Code', invoice.customer_code], ['Email', invoice.customer_email], ['Phone', invoice.customer_phone], ['Address', invoice.billing_address], ['Tax ID', invoice.tax_id]].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5" />Line Items</h2>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left"><th className="pb-3 font-medium text-gray-500">Product</th><th className="pb-3 font-medium text-gray-500">SKU</th><th className="pb-3 font-medium text-gray-500 text-right">Qty</th><th className="pb-3 font-medium text-gray-500 text-right">Unit Price</th><th className="pb-3 font-medium text-gray-500 text-right">Tax</th><th className="pb-3 font-medium text-gray-500 text-right">Total</th></tr></thead>
              <tbody>{items.map((item: any, idx: number) => (<tr key={item.id || idx} className="border-b border-gray-100"><td className="py-3 font-medium">{item.product_name || item.description || '-'}</td><td className="py-3 text-gray-600">{item.sku || item.product_code || '-'}</td><td className="py-3 text-right">{item.quantity || 0}</td><td className="py-3 text-right">{formatCurrency(item.unit_price || 0)}</td><td className="py-3 text-right">{formatCurrency(item.tax_amount || 0)}</td><td className="py-3 text-right font-medium">{formatCurrency(item.total_amount || item.line_total || 0)}</td></tr>))}</tbody>
              <tfoot><tr className="border-t-2 border-gray-300"><td colSpan={4}></td><td className="py-3 text-right font-bold">Total</td><td className="py-3 text-right font-bold text-lg">{formatCurrency(invoice.total_amount || 0)}</td></tr></tfoot>
            </table>
          </div>
        ) : <p className="text-gray-500 text-center py-8">No line items</p>}
      </div>

      {invoice.notes && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p></div>}
    </div>
  )
}
