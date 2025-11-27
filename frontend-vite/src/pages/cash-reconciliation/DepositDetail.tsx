import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, DollarSign, Calendar, Building2 } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { cashReconciliationService } from '../../services/cashReconciliation.service'

export default function DepositDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: deposit, isLoading } = useQuery({
    queryKey: ['deposit', id],
    queryFn: async () => {
      const deposits = await cashReconciliationService.getBankDeposits({ id })
      return deposits.data[0]
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading deposit details...</div>
  }

  if (!deposit) {
    return <div className="p-6">Deposit not found</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/cash-reconciliation/deposits')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Deposits
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deposit.deposit_number}</h1>
            <p className="text-gray-600">Session: {deposit.session_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/cash-reconciliation/deposits/${id}/edit`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="h-5 w-5" />
              Edit
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              deposit.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {deposit.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Deposit Amount</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(deposit.amount)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Deposit Date</h3>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {new Date(deposit.deposit_date).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Bank</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">{deposit.bank_name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deposit Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Deposit Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{deposit.deposit_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Reference Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{deposit.reference_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{deposit.account_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Deposited By</dt>
            <dd className="mt-1 text-sm text-gray-900">{deposit.deposited_by}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900">{deposit.notes || '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
