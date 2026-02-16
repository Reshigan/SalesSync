import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, Edit, Package, User } from 'lucide-react'
import { API_CONFIG } from '../../../config/api.config'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function CommissionLedgerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [id])
  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const r = await fetch(`${API_CONFIG.BASE_URL}/field-operations/commission-ledger/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      const json = await r.json()
      const d = json.data || json
      setEntry(d)
    } catch (e: any) { setError(e.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!entry) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Commission Entry not found</div></div>

  const sc: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800', approved: 'bg-green-100 text-green-800', confirmed: 'bg-blue-100 text-blue-800', processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800', closed: 'bg-gray-100 text-gray-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800', expired: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-blue-100 text-blue-800', open: 'bg-blue-100 text-blue-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/field-operations/commission')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{entry.name || entry.title || `Commission Entry #${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc[entry.status] || 'bg-gray-100 text-gray-800'}`}>{(entry.status || 'N/A').replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Amount</p><p className="text-xl font-bold">{formatCurrency(entry.amount || entry.commission_amount || 0)}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><User className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Agent</p><p className="text-xl font-bold">{entry.agent_name || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Date</p><p className="text-xl font-bold">{formatDate(entry.transaction_date || entry.date) || 'N/A'}</p></div></div></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Commission Entry Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt className="text-sm text-gray-500">Agent</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{entry.agent_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Amount</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatCurrency(entry.amount || entry.commission_amount) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Type</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{entry.commission_type || entry.type || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Reference</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{entry.reference || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Order</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{entry.order_number || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Transaction Date</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(entry.transaction_date) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Created At</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(entry.created_at) || '-'}</dd></div>
        </dl>
      </div>

      {entry.notes && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{entry.notes}</p></div>}
    </div>
  )
}
