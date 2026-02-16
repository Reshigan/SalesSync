import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Edit, MapPin, Package } from 'lucide-react'
import { apiClient } from '../../services/api.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function BoardPlacementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bp, setBp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [id])
  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const r = await fetch(`${API_CONFIG.BASE_URL}/field-operations/board-placements/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      const json = await r.json()
      const d = json.data || json
      setBp(d)
    } catch (e: any) { setError(e.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!bp) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Board Placement not found</div></div>

  const sc: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800', approved: 'bg-green-100 text-green-800', confirmed: 'bg-blue-100 text-blue-800', processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800', closed: 'bg-gray-100 text-gray-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800', expired: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-blue-100 text-blue-800', open: 'bg-blue-100 text-blue-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/field-operations/boards')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{bp.name || bp.title || `Board Placement #${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc[bp.status] || 'bg-gray-100 text-gray-800'}`}>{(bp.status || 'N/A').replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Board Type</p><p className="text-xl font-bold">{bp.board_type || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><MapPin className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Location</p><p className="text-xl font-bold">{bp.location || bp.customer_name || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Date</p><p className="text-xl font-bold">{formatDate(bp.placement_date || bp.date) || 'N/A'}</p></div></div></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Board Placement Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt className="text-sm text-gray-500">Board Type</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.board_type || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Customer</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.customer_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Location</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.location || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Placement Date</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(bp.placement_date) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Agent</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.agent_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Brand</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.brand_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Condition</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.condition || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">GPS Lat</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.latitude || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">GPS Lng</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{bp.longitude || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Created At</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(bp.created_at) || '-'}</dd></div>
        </dl>
      </div>

      {bp.notes && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{bp.notes}</p></div>}
    </div>
  )
}
