import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, DollarSign, CreditCard, Calendar } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      return {
        id,
        payment_number: 'PAY-2024-001',
        invoice_number: 'INV-2024-001',
        customer_name: 'ABC Store',
        amount: 5000,
        payment_date: '2024-01-20',
        payment_method: 'Bank Transfer',
        reference_number: 'REF-123456',
        status: 'confirmed',
        notes: 'Partial payment received'
      }
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading payment...</div>
  }

  if (!payment) {
    return <div className="p-6">Payment not found</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/finance/payments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Payments
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{payment.payment_number}</h1>
            <p className="text-gray-600">{payment.customer_name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/finance/payments/${id}/edit`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="h-5 w-5" />
              Edit
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              payment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {payment.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Payment Amount</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Payment Date</h3>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {new Date(payment.payment_date).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Payment Method</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">{payment.payment_method}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Payment Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.payment_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <button
                onClick={() => navigate(`/finance/invoices/${payment.invoice_number}`)}
                className="text-primary-600 hover:text-primary-900"
              >
                {payment.invoice_number}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Customer</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.customer_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Reference Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.reference_number}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.notes || '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
