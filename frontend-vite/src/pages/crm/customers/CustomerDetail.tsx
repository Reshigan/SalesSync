import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, User, Phone, Mail, MapPin, DollarSign, ShoppingCart, Calendar, FileText } from 'lucide-react'
import { crmService } from '../../../services/crm.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [id])
  const load = async () => {
    setLoading(true)
    try { const r = await crmService.getCustomer(Number(id)); setCustomer(r.data?.data || r.data) } catch (err: any) { setError(err.message || 'Failed to load') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!customer) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Customer not found</div></div>

  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800', suspended: 'bg-red-100 text-red-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/crm/customers')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{customer.customer_name || customer.name || `Customer #${id}`}</h1>
            <div className="flex items-center gap-2 mt-1"><span className="text-sm text-gray-500">{customer.customer_code || customer.code}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[customer.status] || 'bg-gray-100 text-gray-800'}`}>{customer.status || 'N/A'}</span></div></div>
        </div>
        <button onClick={() => navigate(`/crm/customers/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="h-4 w-4" />Edit</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Credit Limit</p><p className="text-xl font-bold">{formatCurrency(customer.credit_limit || 0)}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-orange-500" /><div><p className="text-sm text-gray-500">Balance</p><p className="text-xl font-bold">{formatCurrency(customer.current_balance || customer.balance || 0)}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Total Orders</p><p className="text-xl font-bold">{customer.total_orders || 0}</p></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Total Revenue</p><p className="text-xl font-bold">{formatCurrency(customer.total_revenue || 0)}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5" />Customer Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Customer Code', customer.customer_code || customer.code], ['Name', customer.customer_name || customer.name], ['Type', customer.customer_type || customer.type], ['Contact Person', customer.contact_person], ['Email', customer.email], ['Phone', customer.phone], ['Mobile', customer.mobile], ['Tax ID', customer.tax_id || customer.vat_number]].map(([l, v]) => (
              <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5" />Address & Location</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Address', customer.address], ['City', customer.city], ['Region', customer.region], ['Territory', customer.territory], ['Province', customer.province || customer.state], ['Postal Code', customer.postal_code || customer.zip], ['Country', customer.country], ['GPS', customer.latitude && customer.longitude ? `${customer.latitude}, ${customer.longitude}` : null]].map(([l, v]) => (
              <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
            ))}
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Additional Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Payment Terms', customer.payment_terms], ['Price List', customer.price_list], ['Sales Rep', customer.sales_rep || customer.agent_name], ['Last Order', formatDate(customer.last_order_date)], ['Created By', customer.created_by], ['Created At', formatDate(customer.created_at)], ['Updated At', formatDate(customer.updated_at)]].map(([l, v]) => (
            <div key={l as string}><dt className="text-sm text-gray-500">{l}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{v || '-'}</dd></div>
          ))}
        </dl>
      </div>
      {customer.notes && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700">{customer.notes}</p></div>}
    </div>
  )
}
