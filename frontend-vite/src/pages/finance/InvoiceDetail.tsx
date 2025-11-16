import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, DollarSign, Calendar, FileText } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      return {
        id,
        invoice_number: 'INV-2024-001',
        customer_name: 'ABC Store',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 10000,
        tax: 1500,
        total: 11500,
        paid: 5000,
        balance: 6500,
        status: 'partial',
        notes: 'Payment plan agreed'
      }
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading invoice...</div>
  }

  if (!invoice) {
    return <div className="p-6">Invoice not found</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/finance/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Invoices
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-gray-600">{invoice.customer_name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/finance/invoices/${id}/edit`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="h-5 w-5" />
              Edit
            </button>
            <button
              onClick={() => navigate(`/finance/invoices/${id}/items`)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="h-5 w-5" />
              Items
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
              invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Total Amount</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Paid</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoice.paid)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Balance Due</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoice.balance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{invoice.invoice_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Customer</dt>
            <dd className="mt-1 text-sm text-gray-900">{invoice.customer_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(invoice.issue_date).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Due Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(invoice.due_date).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.subtotal)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Tax</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.tax)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900">{invoice.notes || '-'}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(`/finance/invoices/${id}/payments`)}
            className="btn-primary"
          >
            View Payments
          </button>
          <button
            onClick={() => navigate(`/finance/invoices/${id}/items`)}
            className="btn-secondary"
          >
            View Items
          </button>
        </div>
      </div>
    </div>
  )
}
