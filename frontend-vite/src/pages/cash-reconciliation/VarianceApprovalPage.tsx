import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashReconciliationService, CashSession } from '../../services/cashReconciliation.service'

export const VarianceApprovalPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['cash-sessions', 'closed'],
    queryFn: () => cashReconciliationService.getSessions({ status: 'closed' })
  })

  const approveVarianceMutation = useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes?: string }) =>
      cashReconciliationService.approveVariance(sessionId, {
        approved_by: 'current-manager-id', // In real app, get from auth context
        approval_notes: notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
      setSelectedSession(null)
      setApprovalNotes('')
    }
  })

  const sessions = data?.data || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const handleApprove = (session: CashSession) => {
    setSelectedSession(session)
  }

  const handleSubmitApproval = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSession) {
      approveVarianceMutation.mutate({
        sessionId: selectedSession.id,
        notes: approvalNotes || undefined
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Variance Approval</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve cash session variances
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Variance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(sessions.reduce((sum, s) => sum + Math.abs(s.variance), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Variance %</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sessions.length > 0
                  ? (sessions.reduce((sum, s) => sum + Math.abs(s.variance_percentage), 0) / sessions.length).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-1 text-sm text-gray-500">All cash sessions have been approved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.agent_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(session.session_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(session.expected_cash)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(session.actual_cash)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        session.variance < 0 ? 'text-red-600' : session.variance > 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(session.variance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        Math.abs(session.variance_percentage) > 5
                          ? 'bg-red-100 text-red-800'
                          : Math.abs(session.variance_percentage) > 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {session.variance_percentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApprove(session)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review & Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Variance</h3>
            
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Agent</p>
                  <p className="text-base font-medium text-gray-900">{selectedSession.agent_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(selectedSession.session_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Cash</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatCurrency(selectedSession.expected_cash)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Cash</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatCurrency(selectedSession.actual_cash)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Variance</p>
                  <p className={`text-2xl font-bold ${
                    selectedSession.variance < 0 ? 'text-red-600' : selectedSession.variance > 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(selectedSession.variance)} ({selectedSession.variance_percentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Approval Notes</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Add notes about this approval..."
                />
              </div>

              {approveVarianceMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">Failed to approve variance. Please try again.</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSession(null)
                    setApprovalNotes('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveVarianceMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {approveVarianceMutation.isPending ? 'Approving...' : 'Approve Variance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
