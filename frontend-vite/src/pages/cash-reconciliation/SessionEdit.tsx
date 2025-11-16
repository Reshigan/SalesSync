import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SessionFormData {
  opening_balance: number
  closing_balance: number
  notes: string
}

export default function SessionEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-session', id],
    queryFn: async () => {
      return {
        id,
        opening_balance: 5000,
        closing_balance: 12500,
        notes: 'All collections verified'
      }
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<SessionFormData>({
    values: session
  })

  const updateMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { ...data, id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session', id] })
      toast.success('Session updated successfully')
      navigate(`/cash-reconciliation/sessions/${id}`)
    },
    onError: () => {
      toast.error('Failed to update session')
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading session...</div>
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Cash Session</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Balance *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('opening_balance', { required: 'Opening balance is required', min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.opening_balance && (
                <p className="mt-1 text-sm text-red-600">{errors.opening_balance.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Balance *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('closing_balance', { required: 'Closing balance is required', min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.closing_balance && (
                <p className="mt-1 text-sm text-red-600">{errors.closing_balance.message}</p>
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
              placeholder="Enter any notes or observations"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/cash-reconciliation/sessions/${id}`)}
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
