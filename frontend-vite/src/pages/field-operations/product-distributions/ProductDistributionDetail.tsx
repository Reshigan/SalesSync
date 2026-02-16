import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Edit, MapPin, Package, User } from 'lucide-react'
import { apiClient } from '../../../services/api.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function ProductDistributionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dist, setDist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<any[]>([])

  useEffect(() => { loadData() }, [id])
  const loadData = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get('/field-operations/product-distributions/${id}')
      const json = await r.json()
      const d = json.data || json
      setDist(d)
      setItems(d.items || d.line_items || d.order_items || [])
    } catch (e: any) { setError(e.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!dist) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Product Distribution not found</div></div>

  const sc: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800', approved: 'bg-green-100 text-green-800', confirmed: 'bg-blue-100 text-blue-800', processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800', closed: 'bg-gray-100 text-gray-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800', expired: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-blue-100 text-blue-800', open: 'bg-blue-100 text-blue-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/field-operations/products')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dist.name || dist.title || `Product Distribution #${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc[dist.status] || 'bg-gray-100 text-gray-800'}`}>{(dist.status || 'N/A').replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Products</p><p className="text-xl font-bold">{(dist.items||[]).length}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><User className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Agent</p><p className="text-xl font-bold">{dist.agent_name || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><MapPin className="h-8 w-8 text-red-500" /><div><p className="text-sm text-gray-500">Customer</p><p className="text-xl font-bold">{dist.customer_name || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Date</p><p className="text-xl font-bold">{formatDate(dist.distribution_date || dist.date) || 'N/A'}</p></div></div></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Product Distribution Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt className="text-sm text-gray-500">Distribution Date</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(dist.distribution_date || dist.date) || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Agent</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{dist.agent_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Customer</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{dist.customer_name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Location</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{dist.location || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Type</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{dist.distribution_type || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Created At</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(dist.created_at) || '-'}</dd></div>
        </dl>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5" />Line Items</h2>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left"><th className="pb-3 font-medium text-gray-500">Product</th><th className="pb-3 font-medium text-gray-500">SKU</th><th className="pb-3 font-medium text-gray-500 text-right">Qty</th><th className="pb-3 font-medium text-gray-500">Unit</th></tr></thead>
              <tbody>{items.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="border-b border-gray-100"><td className="py-3">{item.product_name || '-'}</td><td className="py-3">{item.sku || '-'}</td><td className="py-3 text-right">{item.quantity || 0}</td><td className="py-3">{item.unit || '-'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="text-gray-500 text-center py-8">No items</p>}
      </div>

      {dist.notes && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{dist.notes}</p></div>}
    </div>
  )
}
