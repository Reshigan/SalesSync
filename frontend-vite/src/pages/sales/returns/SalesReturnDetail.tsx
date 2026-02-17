import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, DollarSign, Calendar, User, Package, RotateCcw, FileText } from 'lucide-react'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function SalesReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [returnData, setReturnData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadReturn() }, [id])
  const loadReturn = async () => {
    setLoading(true)
    try { const r = await salesService.getReturn(String(id)); setReturnData(r.data?.data || r.data) } catch (err: any) { setError(err.message || 'Failed to load return') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!returnData) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Return not found</div></div>

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', completed: 'bg-green-100 text-green-800', processing: 'bg-blue-100 text-blue-800' }
  const items = returnData.items || returnData.return_items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/returns')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Return {returnData.return_number || `#${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[returnData.status] || 'bg-gray-100 text-gray-800'}`}>{returnData.status || 'N/A'}</span>
          </div>
        </div>
        <button onClick={() => navigate(`/sales/returns/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="h-4 w-4" />Edit</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-red-500" /><div><p className="text-sm text-gray-500">Return Amount</p><p className="text-xl font-bold">{formatCurrency(returnData.total_amount || returnData.return_amount || 0)}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Return Date</p><p className="text-xl font-bold">{formatDate(returnData.return_date) || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Items</p><p className="text-xl font-bold">{items.length}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><RotateCcw className="h-8 w-8 text-orange-500" /><div><p className="text-sm text-gray-500">Reason</p><p className="text-xl font-bold text-sm">{returnData.return_reason || returnData.reason || 'N/A'}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Return Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Return Number', returnData.return_number], ['Return Date', formatDate(returnData.return_date)], ['Order Number', returnData.order_number], ['Reason', returnData.return_reason || returnData.reason], ['Credit Note', returnData.credit_note_number], ['Refund Method', returnData.refund_method], ['Created By', returnData.created_by], ['Created At', formatDate(returnData.created_at)]].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5" />Customer</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Customer', returnData.customer_name], ['Customer Code', returnData.customer_code], ['Email', returnData.customer_email], ['Phone', returnData.customer_phone]].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5" />Return Items</h2>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left"><th className="pb-3 font-medium text-gray-500">Product</th><th className="pb-3 font-medium text-gray-500 text-right">Qty</th><th className="pb-3 font-medium text-gray-500 text-right">Unit Price</th><th className="pb-3 font-medium text-gray-500">Reason</th><th className="pb-3 font-medium text-gray-500">Condition</th><th className="pb-3 font-medium text-gray-500 text-right">Total</th></tr></thead>
              <tbody>{items.map((item: any, idx: number) => (<tr key={item.id || idx} className="border-b border-gray-100"><td className="py-3 font-medium">{item.product_name || '-'}</td><td className="py-3 text-right">{item.quantity || 0}</td><td className="py-3 text-right">{formatCurrency(item.unit_price || 0)}</td><td className="py-3">{item.reason || '-'}</td><td className="py-3">{item.condition || '-'}</td><td className="py-3 text-right font-medium">{formatCurrency(item.total_amount || item.line_total || 0)}</td></tr>))}</tbody>
              <tfoot><tr className="border-t-2 border-gray-300"><td colSpan={4}></td><td className="py-3 text-right font-bold">Total</td><td className="py-3 text-right font-bold text-lg">{formatCurrency(returnData.total_amount || 0)}</td></tr></tfoot>
            </table>
          </div>
        ) : <p className="text-gray-500 text-center py-8">No return items</p>}
      </div>
      {returnData.notes && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{returnData.notes}</p></div>}
    </div>
  )
}
