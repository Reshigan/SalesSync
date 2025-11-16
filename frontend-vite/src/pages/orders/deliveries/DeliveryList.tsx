import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, Truck } from 'lucide-react'

export default function DeliveryList() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => ({
      id: orderId,
      order_number: 'ORD-2024-001',
      customer_name: 'ABC Store',
    }),
  })

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['order-deliveries', orderId],
    queryFn: async () => [
      {
        id: '1',
        delivery_number: 'DEL-2024-001',
        status: 'delivered',
        driver_name: 'John Driver',
        vehicle_number: 'VAN-001',
        scheduled_date: '2024-01-20',
        actual_delivery_time: '2024-01-20T14:30:00Z',
        stops: 3,
      },
      {
        id: '2',
        delivery_number: 'DEL-2024-002',
        status: 'in_transit',
        driver_name: 'Jane Driver',
        vehicle_number: 'VAN-002',
        scheduled_date: '2024-01-21',
        actual_delivery_time: null,
        stops: 2,
      },
    ],
  })

  if (isLoading) {
    return <div className="p-6">Loading deliveries...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Order
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-600">{order?.order_number} - {order?.customer_name}</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stops</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deliveries?.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {delivery.delivery_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {delivery.driver_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {delivery.vehicle_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(delivery.scheduled_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {delivery.stops}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    delivery.status === 'delivered' 
                      ? 'bg-green-100 text-green-800' 
                      : delivery.status === 'in_transit'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {delivery.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/orders/${orderId}/deliveries/${delivery.id}`)}
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
