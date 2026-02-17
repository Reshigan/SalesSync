import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Calendar, Edit, Package } from 'lucide-react'
import { apiClient } from '../../services/api.service'
import { formatCurrency, formatDate } from '../../utils/format'

export default function BrandDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brand, setBrand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [id])
  const loadData = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get(`/brands/${id}`)
      const json = r.data?.data || r.data
      const d = json.data || json
      setBrand(d)
    } catch (e: any) { setError(e.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!brand) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Brand not found</div></div>

  const sc: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800', approved: 'bg-green-100 text-green-800', confirmed: 'bg-blue-100 text-blue-800', processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800', closed: 'bg-gray-100 text-gray-800', paid: 'bg-green-100 text-green-800', partial: 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800', expired: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-blue-100 text-blue-800', open: 'bg-blue-100 text-blue-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/brands')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{brand.name || brand.title || `Brand #${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc[brand.status] || 'bg-gray-100 text-gray-800'}`}>{(brand.status || 'N/A').replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Products</p><p className="text-xl font-bold">{brand.product_count || 0}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Revenue</p><p className="text-xl font-bold">{formatCurrency(brand.total_revenue || 0)}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Since</p><p className="text-xl font-bold">{formatDate(brand.created_at) || 'N/A'}</p></div></div></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Brand Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt className="text-sm text-gray-500">Brand Name</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.brand_name || brand.name || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Code</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.brand_code || brand.code || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Category</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.category || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Manufacturer</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.manufacturer || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Country</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.country_of_origin || brand.country || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Description</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.description || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Active</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{brand.is_active ? 'Yes' : 'No' || '-'}</dd></div>
          <div><dt className="text-sm text-gray-500">Created At</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(brand.created_at) || '-'}</dd></div>
        </dl>
      </div>

      {brand.notes && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{brand.notes}</p></div>}
    </div>
  )
}
