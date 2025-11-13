import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cashReconciliationService } from '../../services/cashReconciliation.service'
import { useNavigate } from 'react-router-dom'

export const StartCashSessionPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openingFloat, setOpeningFloat] = useState('')
  const [notes, setNotes] = useState('')

  const startSessionMutation = useMutation({
    mutationFn: (data: { agent_id: string; opening_float: number; notes?: string }) =>
      cashReconciliationService.startSession(data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
      navigate(`/cash-reconciliation/sessions/${session.id}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const agentId = 'current-agent-id'
    
    startSessionMutation.mutate({
      agent_id: agentId,
      opening_float: parseFloat(openingFloat),
      notes: notes || undefined
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Start Cash Session</h1>
        <p className="mt-1 text-sm text-gray-500">
          Begin a new cash collection session for today
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opening Float */}
          <div>
            <label htmlFor="opening_float" className="block text-sm font-medium text-gray-700">
              Opening Float (ZAR) *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R</span>
              </div>
              <input
                type="number"
                id="opening_float"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                step="0.01"
                min="0"
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              The amount of cash you're starting with today
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Any additional notes about this session..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Before you start</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Count your opening float carefully</li>
                    <li>Ensure you have all necessary documentation</li>
                    <li>Your session will remain open until you close it</li>
                    <li>All cash collections will be tracked against this session</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {startSessionMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Failed to start cash session. Please try again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/cash-reconciliation')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={startSessionMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {startSessionMutation.isPending ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
