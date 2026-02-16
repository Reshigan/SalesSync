import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Printer, Package, DollarSign, Calendar, User, MapPin, Clock, Truck, FileText, CreditCard } from 'lucide-react'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function SalesOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadOrder() }, [id])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const response = await salesService.getOrder(String(id))
      setOrder(response.data?.data || response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!order) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Order not found</div></div>

  const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', processing: 'bg-indigo-100 text-indigo-800', fulfilled: 'bg-green-100 text-green-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }
  const paymentColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', partial: 'bg-orange-100 text-orange-800', paid: 'bg-green-100 text-green-800', refunded: 'bg-red-100 text-red-800' }

  const items = order.items || order.order_items || order.line_items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/orders')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number || order.orderNumber || `#${id}`}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>{order.status || 'N/A'}</span>
              {(order.payment_status || order.paymentStatus) && <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentColors[order.payment_status || order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>{order.payment_status || order.paymentStatus}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/sales/orders/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="h-4 w-4" />Edit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Total Amount</p><p className="text-xl font-bold">{formatCurrency(order.total_amount || order.totalAmount || order.order_amount || 0)}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Order Date</p><p className="text-xl font-bold">{formatDate(order.order_date || order.orderDate || order.created_at)}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Items</p><p className="text-xl font-bold">{items.length}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Truck className="h-8 w-8 text-orange-500" /><div><p className="text-sm text-gray-500">Delivery Date</p><p className="text-xl font-bold">{formatDate(order.delivery_date || order.deliveryDate) || 'TBD'}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Order Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['Order Number', order.order_number || order.orderNumber],
              ['Order Date', formatDate(order.order_date || order.orderDate)],
              ['Delivery Date', formatDate(order.delivery_date || order.deliveryDate)],
              ['Payment Terms', order.payment_terms || order.paymentTerms],
              ['Payment Method', order.payment_method || order.paymentMethod],
              ['Shipping Method', order.shipping_method || order.shippingMethod],
              ['Reference', order.reference || order.po_number],
              ['Created By', order.created_by || order.createdBy],
              ['Created At', formatDate(order.created_at || order.createdAt)],
              ['Updated At', formatDate(order.updated_at || order.updatedAt)]
            ].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5" />Customer Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['Customer', order.customer_name || order.customerName],
              ['Customer Code', order.customer_code || order.customerCode],
              ['Email', order.customer_email || order.customerEmail],
              ['Phone', order.customer_phone || order.customerPhone],
              ['Sales Rep', order.sales_rep || order.salesRep || order.agent_name],
              ['Territory', order.territory],
              ['Shipping Address', order.shipping_address || order.shippingAddress],
              ['Billing Address', order.billing_address || order.billingAddress]
            ].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5" />Order Items</h2>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left">
                <th className="pb-3 font-medium text-gray-500">Product</th>
                <th className="pb-3 font-medium text-gray-500">SKU</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Qty</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Unit Price</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Discount</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Tax</th>
                <th className="pb-3 font-medium text-gray-500 text-right">Total</th>
              </tr></thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{item.product_name || item.productName || item.name || '-'}</td>
                    <td className="py-3 text-gray-600">{item.sku || item.product_code || '-'}</td>
                    <td className="py-3 text-right">{item.quantity || 0}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unit_price || item.unitPrice || 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(item.discount || item.discount_amount || 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(item.tax_amount || item.taxAmount || 0)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total_amount || item.totalAmount || item.line_total || (item.quantity * (item.unit_price || item.unitPrice || 0)))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={5}></td>
                  <td className="py-3 text-right font-medium text-gray-500">Subtotal</td>
                  <td className="py-3 text-right font-bold">{formatCurrency(order.subtotal || order.sub_total || 0)}</td>
                </tr>
                {(order.tax_amount || order.taxAmount) ? <tr><td colSpan={5}></td><td className="py-2 text-right text-gray-500">Tax</td><td className="py-2 text-right">{formatCurrency(order.tax_amount || order.taxAmount)}</td></tr> : null}
                {(order.discount || order.discount_amount) ? <tr><td colSpan={5}></td><td className="py-2 text-right text-gray-500">Discount</td><td className="py-2 text-right text-red-600">-{formatCurrency(order.discount || order.discount_amount)}</td></tr> : null}
                {(order.shipping_cost || order.shippingCost) ? <tr><td colSpan={5}></td><td className="py-2 text-right text-gray-500">Shipping</td><td className="py-2 text-right">{formatCurrency(order.shipping_cost || order.shippingCost)}</td></tr> : null}
                <tr className="border-t"><td colSpan={5}></td><td className="py-3 text-right font-bold text-gray-900">Total</td><td className="py-3 text-right font-bold text-lg">{formatCurrency(order.total_amount || order.totalAmount || order.order_amount || 0)}</td></tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No items in this order</p>
        )}
      </div>

      {order.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
