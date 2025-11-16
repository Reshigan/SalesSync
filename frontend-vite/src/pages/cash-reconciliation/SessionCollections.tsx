import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

export default function SessionCollections() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: collections, isLoading } = useQuery({
    queryKey: ['session-collections', id],
    queryFn: async () => {
      return [
        { id: '1', customer_name: 'ABC Store', amount: 2500, payment_method: 'Cash', collected_at: '2024-01-15T10:30:00' },
        { id: '2', customer_name: 'XYZ Shop', amount: 1800, payment_method: 'Cash', collected_at: '2024-01-15T11:45:00' },
        { id: '3', customer_name: 'Quick Mart', amount: 3200, payment_method: 'Cash', collected_at: '2024-01-15T14:20:00' },
      ]
    },
  })

  const total = collections?.reduce((sum, c) => sum + c.amount, 0) || 0

  if (isLoading) {
    return <div className="p-6">Loading collections...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/cash-reconciliation/sessions/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Session
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Session Collections</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Total Collections</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {collections?.map((collection) => (
              <tr key={collection.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {collection.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(collection.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {collection.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(collection.collected_at).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
