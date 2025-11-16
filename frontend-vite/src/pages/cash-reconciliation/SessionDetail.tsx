import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-session', id],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        id,
        session_number: 'CS-2024-001',
        agent_id: 'agent-1',
        agent_name: 'John Doe',
        start_time: '2024-01-15T08:00:00',
        end_time: '2024-01-15T17:00:00',
        opening_balance: 5000,
        closing_balance: 12500,
        expected_balance: 12300,
        variance: 200,
        status: 'closed',
        total_collections: 7500,
        total_deposits: 7300,
        notes: 'All collections verified'
      }
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading session details...</div>
  }

  if (!session) {
    return <div className="p-6">Session not found</div>
  }

  const variancePercentage = ((session.variance / session.expected_balance) * 100).toFixed(2)

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/cash-reconciliation/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.session_number}</h1>
            <p className="text-gray-600">{session.agent_name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/cash-reconciliation/sessions/${id}/edit`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="h-5 w-5" />
              Edit
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              session.status === 'closed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {session.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Opening Balance</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(session.opening_balance)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Total Collections</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(session.total_collections)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Closing Balance</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(session.closing_balance)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className={`h-5 w-5 ${Math.abs(session.variance) > 100 ? 'text-red-600' : 'text-green-600'}`} />
            <h3 className="font-semibold text-gray-900">Variance</h3>
          </div>
          <p className={`text-2xl font-bold ${Math.abs(session.variance) > 100 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(session.variance)}
          </p>
          <p className="text-sm text-gray-500">{variancePercentage}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Session Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{session.session_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Agent</dt>
              <dd className="mt-1 text-sm text-gray-900">{session.agent_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(session.start_time).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900">{session.notes || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collections</h3>
            <button
              onClick={() => navigate(`/cash-reconciliation/sessions/${id}/collections`)}
              className="w-full btn-primary"
            >
              View Collections ({session.total_collections ? formatCurrency(session.total_collections) : '$0'})
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposits</h3>
            <button
              onClick={() => navigate(`/cash-reconciliation/sessions/${id}/deposits`)}
              className="w-full btn-primary"
            >
              View Deposits ({session.total_deposits ? formatCurrency(session.total_deposits) : '$0'})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
