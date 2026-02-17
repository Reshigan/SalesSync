import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { vanSalesService } from '../../../services/vanSales.service'

export default function RouteStopExceptions() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()

  const { data: route } = useQuery({
    queryKey: ['route', routeId],
    queryFn: async () => {
      if (!routeId) return null
      return await vanSalesService.getRoute(routeId)
    },
    enabled: !!routeId,
  })

  const { data: exceptions = [], isLoading } = useQuery({
    queryKey: ['route-exceptions', routeId],
    queryFn: async () => {
      if (!routeId) return []
      return await vanSalesService.getRouteExceptions(routeId)
    },
    enabled: !!routeId,
  })

  if (isLoading) {
    return <div className="p-6">Loading exceptions...</div>
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
        <h1 className="text-2xl font-bold text-gray-900">Route Stop Exceptions</h1>
        <p className="text-gray-600">{route?.route_number} - {route?.agent_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Total Exceptions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{exceptions?.length || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">High Severity</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {exceptions?.filter(e => e.severity === 'high').length || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Resolved</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {exceptions?.filter(e => e.resolved).length || 0}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {exceptions?.map((exception) => (
          <div
            key={exception.id}
            className={`bg-white rounded-lg shadow p-6 border-l-4 ${
              exception.severity === 'high' ? 'border-red-500' :
              exception.severity === 'medium' ? 'border-yellow-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-6 w-6 ${
                  exception.severity === 'high' ? 'text-red-600' :
                  exception.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Stop #{exception.stop_number} - {exception.customer_name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      exception.severity === 'high' ? 'bg-red-100 text-red-800' :
                      exception.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {exception.severity} severity
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 capitalize mb-2">
                    {exception.exception_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              {exception.resolved && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                  Resolved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm text-gray-900 mt-1">{exception.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Resolution</p>
                <p className="text-sm text-gray-900 mt-1">{exception.resolution}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Planned Time</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(exception.planned_time).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Actual Time</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(exception.actual_time).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
