import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cashReconciliationService } from '../../services/cashReconciliation.service'

interface DepositFormData {
  amount: number
  deposit_date: string
  bank_name: string
  reference_number: string
  notes: string
}

export default function DepositEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: deposit, isLoading } = useQuery({
    queryKey: ['deposit', id],
    queryFn: async () => {
      const deposits = await cashReconciliationService.getBankDeposits({ id })
      return deposits.data[0]
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<DepositFormData>({
    values: deposit
  })

  const updateMutation = useMutation({
    mutationFn: async (data: DepositFormData) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { ...data, id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit', id] })
      toast.success('Deposit updated successfully')
      navigate(`/cash-reconciliation/deposits/${id}`)
    },
    onError: () => {
      toast.error('Failed to update deposit')
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading deposit...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/cash-reconciliation/deposits/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Deposit
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Bank Deposit</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Date *
              </label>
              <input
                type="date"
                {...register('deposit_date', { required: 'Deposit date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.deposit_date && (
                <p className="mt-1 text-sm text-red-600">{errors.deposit_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                {...register('bank_name', { required: 'Bank name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.bank_name && (
                <p className="mt-1 text-sm text-red-600">{errors.bank_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number *
              </label>
              <input
                type="text"
                {...register('reference_number', { required: 'Reference number is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.reference_number && (
                <p className="mt-1 text-sm text-red-600">{errors.reference_number.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter any notes"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/cash-reconciliation/deposits/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
