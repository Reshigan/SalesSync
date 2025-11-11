import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cashReconciliationService } from '../../services/cashReconciliation.service'

export const CashReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['cash-sessions', 'all', dateRange],
    queryFn: () => cashReconciliationService.getSessions({
      start_date: dateRange.start,
      end_date: dateRange.end
    })
  })

  const allSessions = sessions?.data || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const totalSessions = allSessions.length
  const openSessions = allSessions.filter(s => s.status === 'open').length
  const closedSessions = allSessions.filter(s => s.status === 'closed').length
  const approvedSessions = allSessions.filter(s => s.status === 'approved').length
  const rejectedSessions = allSessions.filter(s => s.status === 'rejected').length

  const totalCollected = allSessions.reduce((sum, s) => sum + (s.actual_cash || 0), 0)
  const totalExpected = allSessions.reduce((sum, s) => sum + (s.expected_cash || 0), 0)
  const totalVariance = allSessions.reduce((sum, s) => sum + (s.variance || 0), 0)
  const avgVariancePercentage = totalSessions > 0
    ? allSessions.reduce((sum, s) => sum + Math.abs(s.variance_percentage || 0), 0) / totalSessions
    : 0

  const sessionsWithVariance = allSessions.filter(s => Math.abs(s.variance) > 0)
  const shortages = allSessions.filter(s => s.variance < 0)
  const overages = allSessions.filter(s => s.variance > 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Reconciliation Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive cash management analytics and insights
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setDateRange({
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0]
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCollected)}</p>
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
              <p className={`text-2xl font-semibold ${totalVariance < 0 ? 'text-red-600' : totalVariance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {formatCurrency(Math.abs(totalVariance))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Variance %</p>
              <p className="text-2xl font-semibold text-gray-900">{avgVariancePercentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Session Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{openSessions}</p>
            <p className="text-sm text-gray-500 mt-1">Open</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{closedSessions}</p>
            <p className="text-sm text-gray-500 mt-1">Closed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{approvedSessions}</p>
            <p className="text-sm text-gray-500 mt-1">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{rejectedSessions}</p>
            <p className="text-sm text-gray-500 mt-1">Rejected</p>
          </div>
        </div>
      </div>

      {/* Variance Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Variance Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Sessions with Variance</span>
              <span className="text-lg font-semibold text-gray-900">{sessionsWithVariance.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Shortages</span>
              <span className="text-lg font-semibold text-red-600">
                {shortages.length} ({formatCurrency(Math.abs(shortages.reduce((sum, s) => sum + s.variance, 0)))})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Overages</span>
              <span className="text-lg font-semibold text-green-600">
                {overages.length} ({formatCurrency(overages.reduce((sum, s) => sum + s.variance, 0))})
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Net Variance</span>
              <span className={`text-xl font-bold ${totalVariance < 0 ? 'text-red-600' : totalVariance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {formatCurrency(totalVariance)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Collection Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Expected Cash</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalExpected)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Actual Cash</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalCollected)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Variance</span>
              <span className={`text-lg font-semibold ${totalVariance < 0 ? 'text-red-600' : totalVariance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {formatCurrency(Math.abs(totalVariance))}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Accuracy Rate</span>
              <span className="text-xl font-bold text-blue-600">
                {totalExpected > 0 ? ((1 - Math.abs(totalVariance) / totalExpected) * 100).toFixed(1) : '100.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Variances */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Sessions with Largest Variances</h2>
        </div>
        {sessionsWithVariance.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Perfect reconciliation!</h3>
            <p className="mt-1 text-sm text-gray-500">All sessions balanced with no variances.</p>
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionsWithVariance
                  .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
                  .slice(0, 10)
                  .map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.agent_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.session_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(session.expected_cash)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(session.actual_cash)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          session.variance < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(session.variance)} ({session.variance_percentage.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.status === 'approved' ? 'bg-green-100 text-green-800' :
                          session.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          session.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
