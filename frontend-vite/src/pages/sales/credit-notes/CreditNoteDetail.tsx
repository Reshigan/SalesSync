import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, DollarSign, Calendar, User, FileText, Package } from 'lucide-react'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function CreditNoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cn, setCn] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [id])
  const load = async () => {
    setLoading(true)
    try { const r = await salesService.getCreditNote(String(id)); setCn(r.data?.data || r.data) } catch (err: any) { setError(err.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!cn) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Credit note not found</div></div>

  const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', issued: 'bg-blue-100 text-blue-800', applied: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }
  const items = cn.items || cn.credit_note_items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/credit-notes')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">Credit Note {cn.credit_note_number || `#${id}`}</h1><span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[cn.status] || 'bg-gray-100 text-gray-800'}`}>{cn.status || 'N/A'}</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Amount</p><p className="text-xl font-bold">{formatCurrency(cn.total_amount || cn.amount || 0)}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Date</p><p className="text-xl font-bold">{formatDate(cn.credit_note_date || cn.date) || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Invoice</p><p className="text-xl font-bold">{cn.invoice_number || 'N/A'}</p></div></div></div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Credit Note Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[['Credit Note Number', cn.credit_note_number], ['Date', formatDate(cn.credit_note_date)], ['Customer', cn.customer_name], ['Invoice', cn.invoice_number], ['Return', cn.return_number], ['Reason', cn.reason], ['Created By', cn.created_by], ['Created At', formatDate(cn.created_at)]].map(([l, v]) => (
            <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
          ))}
        </dl>
      </div>
      {items.length > 0 && <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Line Items</h2>
        <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="pb-3 text-gray-500">Product</th><th className="pb-3 text-gray-500 text-right">Qty</th><th className="pb-3 text-gray-500 text-right">Unit Price</th><th className="pb-3 text-gray-500 text-right">Total</th></tr></thead>
        <tbody>{items.map((i: any, idx: number) => (<tr key={i.id || idx} className="border-b border-gray-100"><td className="py-3">{i.product_name || i.description || '-'}</td><td className="py-3 text-right">{i.quantity || 0}</td><td className="py-3 text-right">{formatCurrency(i.unit_price || 0)}</td><td className="py-3 text-right font-medium">{formatCurrency(i.total_amount || 0)}</td></tr>))}</tbody></table>
      </div>}
      {cn.notes && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700">{cn.notes}</p></div>}
    </div>
  )
}
