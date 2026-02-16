import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, DollarSign, Calendar, User, CreditCard, FileText, CheckCircle } from 'lucide-react'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function PaymentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadPayment() }, [id])

  const loadPayment = async () => {
    setLoading(true)
    try {
      const response = await salesService.getPayment(String(id))
      setPayment(response.data?.data || response.data)
    } catch (err: any) { setError(err.message || 'Failed to load payment') } finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>
  if (!payment) return <div className="p-6"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">Payment not found</div></div>

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800', confirmed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-red-100 text-red-800', cancelled: 'bg-red-100 text-red-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales/payments')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment {payment.payment_number || `#${id}`}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.status] || 'bg-gray-100 text-gray-800'}`}>{payment.status || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-500" /><div><p className="text-sm text-gray-500">Amount</p><p className="text-xl font-bold">{formatCurrency(payment.amount || payment.payment_amount || 0)}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><CreditCard className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Method</p><p className="text-xl font-bold">{payment.payment_method || payment.method || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-gray-500">Payment Date</p><p className="text-xl font-bold">{formatDate(payment.payment_date) || 'N/A'}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Payment Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Payment Number', payment.payment_number], ['Payment Date', formatDate(payment.payment_date)], ['Amount', formatCurrency(payment.amount || payment.payment_amount)], ['Method', payment.payment_method || payment.method], ['Reference', payment.reference || payment.transaction_ref], ['Invoice Number', payment.invoice_number], ['Receipt Number', payment.receipt_number], ['Bank', payment.bank_name], ['Created By', payment.created_by], ['Created At', formatDate(payment.created_at)]].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5" />Customer</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[['Customer', payment.customer_name], ['Customer Code', payment.customer_code], ['Email', payment.customer_email], ['Phone', payment.customer_phone]].map(([label, value]) => (
              <div key={label as string}><dt className="text-sm text-gray-500">{label}</dt><dd className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</dd></div>
            ))}
          </dl>
        </div>
      </div>
      {payment.notes && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-2">Notes</h2><p className="text-gray-700 whitespace-pre-wrap">{payment.notes}</p></div>}
    </div>
  )
}
