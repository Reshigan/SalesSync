import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Package, User } from 'lucide-react'
import { apiClient } from '../../../services/api.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function VisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [id])
  const loadData = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get('/field-operations/visits/${id}')
      const json = await r.json()
      const d = json.data || json
      setVisit(d)
    } catch (e: any) { setError(e.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!visit) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Visit not found</div></div>

  const sc: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800', approved: 'bg-green-100 text-green-800', confirmed: 'bg-blue-100 text-blue-800', processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800', closed: 'bg-gray-100 text-gray-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800', expired: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-blue-100 text-blue-800', open: 'bg-blue-100 text-blue-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/field-operations/visits')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{visit.name || visit.title || `Visit #${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc[visit.status] || 'bg-gray-100 text-gray-800'}`}>{(visit.status || 'N/A').replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Date</p><p className="text-xl font-bold">{formatDate(visit.visit_date || visit.date) || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><User className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Agent</p><p className="text-xl font-bold">{visit.agent_name || visit.sales_rep || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><MapPin className="h-8 w-8 text-red-500" /><div><p className="text-sm text-gray-500">Customer</p><p className="text-xl font-bold">{visit.customer_name || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Duration</p><p className="text-xl font-bold">{visit.duration ? `${visit.duration} min` : 'N/A'}</p></div></div></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Visit Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt className="text-sm text-gray-500">Visit Date</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(visit.visit_date || visit.date) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Agent</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.agent_name || visit.sales_rep || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Customer</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.customer_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Location</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.location || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Check In</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(visit.check_in_time) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Check Out</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(visit.check_out_time) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Purpose</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.purpose || visit.visit_type || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Outcome</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.outcome || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">GPS Lat</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.latitude || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">GPS Lng</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{visit.longitude || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Created At</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(visit.created_at) || '-'}</dd></div>
        </dl>
      </div>

      {visit.notes && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{visit.notes}</p></div>}
    </div>
  )
}
