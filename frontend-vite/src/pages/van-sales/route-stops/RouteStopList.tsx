import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, MapPin, Clock } from 'lucide-react'
import { formatCurrency } from '../../../utils/currency'

export default function RouteStopList() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()

  const { data: route } = useQuery({
    queryKey: ['route', routeId],
    queryFn: async () => ({
      id: routeId,
      route_number: 'ROUTE-2024-001',
      agent_name: 'John Van Sales',
      route_date: '2024-01-20',
    }),
  })

  const { data: stops, isLoading } = useQuery({
    queryKey: ['route-stops', routeId],
    queryFn: async () => [
      {
        id: '1',
        stop_number: 1,
        customer_name: 'ABC Store',
        address: '123 Main St',
        planned_arrival: '2024-01-20T09:00:00Z',
        actual_arrival: '2024-01-20T09:05:00Z',
        status: 'completed',
        order_value: 250.00,
      },
      {
        id: '2',
        stop_number: 2,
        customer_name: 'XYZ Mart',
        address: '456 Oak Ave',
        planned_arrival: '2024-01-20T10:00:00Z',
        actual_arrival: '2024-01-20T10:10:00Z',
        status: 'completed',
        order_value: 180.00,
      },
      {
        id: '3',
        stop_number: 3,
        customer_name: 'DEF Shop',
        address: '789 Pine Rd',
        planned_arrival: '2024-01-20T11:00:00Z',
        actual_arrival: null,
        status: 'pending',
        order_value: 320.00,
      },
    ],
  })

  if (isLoading) {
    return <div className="p-6">Loading stops...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/van-sales/routes/${routeId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Route
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Route Stops</h1>
        <p className="text-gray-600">
          {route?.route_number} - {route?.agent_name} - {new Date(route?.route_date || '').toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Order Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stops?.map((stop) => (
              <tr key={stop.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {stop.stop_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stop.customer_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {stop.address}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(stop.planned_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stop.actual_arrival ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(stop.actual_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {formatCurrency(stop.order_value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    stop.status === 'completed' ? 'bg-green-100 text-green-800' :
                    stop.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    stop.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {stop.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/van-sales/routes/${routeId}/stops/${stop.id}`)}
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
