import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, User, FileText, AlertCircle } from 'lucide-react'

export default function StatusTransitionDetail() {
  const { orderId, transitionId } = useParams<{ orderId: string; transitionId: string }>()
  const navigate = useNavigate()

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => ({
      id: orderId,
      order_number: 'ORD-2024-001',
      customer_name: 'ABC Store',
    }),
  })

  const { data: transition, isLoading } = useQuery({
    queryKey: ['status-transition', orderId, transitionId],
    queryFn: async () => ({
      id: transitionId,
      order_id: orderId,
      status: 'shipped',
      previous_status: 'processing',
      changed_at: '2024-01-20T08:00:00Z',
      changed_by: 'John Driver',
      changed_by_id: 'user-123',
      changed_by_role: 'Driver',
      notes: 'Order loaded on vehicle VAN-001',
      reason: 'Standard workflow progression',
      metadata: {
        vehicle: 'VAN-001',
        driver_id: 'driver-1',
        warehouse: 'WH-001',
        items_loaded: 15,
        weight_kg: 150,
        delivery_route: 'Route-A',
      },
      system_info: {
        ip_address: '192.168.1.100',
        user_agent: 'Mobile App v2.1.0',
        location: {
          latitude: -1.2921,
          longitude: 36.8219,
        },
      },
      validation_passed: true,
      validation_checks: [
        { check: 'All items picked', passed: true },
        { check: 'Quality check completed', passed: true },
        { check: 'Packaging verified', passed: true },
        { check: 'Vehicle capacity available', passed: true },
      ],
    }),
  })

  if (isLoading) {
    return <div className="p-6">Loading transition details...</div>
  }

  if (!transition) {
    return <div className="p-6">Transition not found</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/orders/${orderId}/status-history`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Status History
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Status Transition Detail</h1>
        <p className="text-gray-600">{order?.order_number} - {order?.customer_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Status Change</h3>
          <div className="flex items-center gap-3">
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
              {transition.previous_status}
            </span>
            <span className="text-gray-400">→</span>
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
              {transition.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-600">{transition.reason}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Changed By</h3>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">{transition.changed_by}</p>
              <p className="text-sm text-gray-600">{transition.changed_by_role}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(transition.changed_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation Checks</h2>
        <div className="space-y-2">
          {transition.validation_checks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {check.passed ? (
                <Clock className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${check.passed ? 'text-gray-900' : 'text-red-600'}`}>
                {check.check}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(transition.metadata).map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm font-medium text-gray-500 capitalize">
                {key.replace(/_/g, ' ')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {transition.notes && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-700">{transition.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">IP Address</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{transition.system_info.ip_address}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">User Agent</dt>
            <dd className="mt-1 text-sm text-gray-900">{transition.system_info.user_agent}</dd>
          </div>
          {transition.system_info.location && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {transition.system_info.location.latitude}, {transition.system_info.location.longitude}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
