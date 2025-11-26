import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package, ShoppingCart, Eye } from 'lucide-react'

export default function BatchAllocation() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()

  const { data: batch } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      return null
    }),
  })

  const { data: allocations, isLoading } = useQuery({
    queryKey: ['batch-allocations', batchId],
    queryFn: async () => {
      return []
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading allocations...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/inventory/batches/${batchId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Batch
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Batch Allocations</h1>
        <p className="text-gray-600">{batch?.batch_number} - {batch?.product_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Current Stock</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{batch?.current_quantity}</p>
          <p className="text-sm text-gray-600 mt-1">total units</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Allocated</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">{batch?.allocated_quantity}</p>
          <p className="text-sm text-gray-600 mt-1">units allocated</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Available</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{batch?.available_quantity}</p>
          <p className="text-sm text-gray-600 mt-1">units available</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Allocation Details</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocated Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Ship</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allocations?.map((allocation) => (
              <tr key={allocation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {allocation.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {allocation.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {allocation.quantity_allocated}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(allocation.allocation_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {allocation.status === 'fulfilled' 
                    ? new Date(allocation.shipped_date).toLocaleDateString()
                    : new Date(allocation.expected_ship_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    allocation.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                    allocation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {allocation.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/orders/${allocation.id}`)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
