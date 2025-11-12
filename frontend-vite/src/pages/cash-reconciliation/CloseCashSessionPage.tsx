import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashReconciliationService } from '../../services/cashReconciliation.service'
import { useParams, useNavigate } from 'react-router-dom'

export const CloseCashSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')

  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-session', sessionId],
    queryFn: () => cashReconciliationService.getSession(sessionId!),
    enabled: !!sessionId
  })

  const { data: collections } = useQuery({
    queryKey: ['cash-collections', sessionId],
    queryFn: () => cashReconciliationService.getCollections(sessionId!),
    enabled: !!sessionId
  })

  const closeSessionMutation = useMutation({
    mutationFn: (data: { closing_cash: number; notes?: string }) =>
      cashReconciliationService.closeSession(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cash-session', sessionId] })
      navigate('/cash-reconciliation')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    closeSessionMutation.mutate({
      closing_cash: parseFloat(closingCash),
      notes: notes || undefined
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Session not found.</p>
      </div>
    )
  }

  const totalCollected = collections?.reduce((sum, c) => sum + c.amount, 0) || 0
  const expectedCash = session.opening_float + totalCollected
  const calculatedVariance = closingCash ? parseFloat(closingCash) - expectedCash : 0
  const variancePercentage = expectedCash > 0 ? (calculatedVariance / expectedCash) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Close Cash Session</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and close session for {new Date(session.session_date).toLocaleDateString()}
        </p>
      </div>

      {/* Session Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Session Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Opening Float</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(session.opening_float)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Expected Cash</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(expectedCash)}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Collections Count</p>
              <p className="text-lg font-semibold text-gray-900">{collections?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cash Collections</p>
              <p className="text-lg font-semibold text-gray-900">
                {collections?.filter(c => c.payment_method === 'cash').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Closing Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Close Session</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Closing Cash */}
          <div>
            <label htmlFor="closing_cash" className="block text-sm font-medium text-gray-700">
              Actual Closing Cash (ZAR) *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R</span>
              </div>
              <input
                type="number"
                id="closing_cash"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                step="0.01"
                min="0"
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Count all cash in hand and enter the total amount
            </p>
          </div>

          {/* Variance Preview */}
          {closingCash && (
            <div className={`rounded-lg p-4 ${
              calculatedVariance === 0
                ? 'bg-green-50 border border-green-200'
                : calculatedVariance < 0
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Calculated Variance</p>
                  <p className={`text-3xl font-bold ${
                    calculatedVariance === 0
                      ? 'text-green-600'
                      : calculatedVariance < 0
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {formatCurrency(Math.abs(calculatedVariance))}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {calculatedVariance === 0
                      ? 'Perfect match!'
                      : calculatedVariance < 0
                      ? `Short by ${variancePercentage.toFixed(2)}%`
                      : `Over by ${variancePercentage.toFixed(2)}%`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {calculatedVariance === 0 ? (
                    <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Closing Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Any notes about variances or issues..."
            />
          </div>

          {/* Warning for Large Variance */}
          {closingCash && Math.abs(variancePercentage) > 5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Large Variance Detected</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    The variance is greater than 5%. This session will require manager approval before it can be finalized.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {closeSessionMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Failed to close session. Please try again.
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
              disabled={closeSessionMutation.isPending || !closingCash}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {closeSessionMutation.isPending ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
