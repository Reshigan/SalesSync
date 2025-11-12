import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customersService } from '../../services/customers.service'

interface Visit {
  id: string
  customer_id: string
  customer_name: string
  agent_name: string
  visit_date: string
  visit_type: 'sales' | 'service' | 'collection' | 'survey'
  duration_minutes: number
  outcome: 'successful' | 'unsuccessful' | 'rescheduled'
  notes?: string
  order_value?: number
  location?: {
    latitude: number
    longitude: number
  }
}

export const CustomerVisitHistoryPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const mockVisits: Visit[] = []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      sales: 'bg-blue-100 text-blue-800',
      service: 'bg-green-100 text-green-800',
      collection: 'bg-purple-100 text-purple-800',
      survey: 'bg-indigo-100 text-indigo-800'
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getOutcomeBadge = (outcome: string) => {
    const badges = {
      successful: 'bg-green-100 text-green-800',
      unsuccessful: 'bg-red-100 text-red-800',
      rescheduled: 'bg-yellow-100 text-yellow-800'
    }
    return badges[outcome as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const filteredVisits = mockVisits.filter(v => {
    if (typeFilter !== 'all' && v.visit_type !== typeFilter) return false
    if (outcomeFilter !== 'all' && v.outcome !== outcomeFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Visit History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all customer visits and interactions
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Visits</p>
              <p className="text-2xl font-semibold text-gray-900">{mockVisits.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Successful</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockVisits.filter(v => v.outcome === 'successful').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockVisits.length > 0
                  ? Math.round(mockVisits.reduce((sum, v) => sum + v.duration_minutes, 0) / mockVisits.length)
                  : 0} min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(mockVisits.reduce((sum, v) => sum + (v.order_value || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visit Type</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'sales', 'service', 'collection', 'survey'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    typeFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'successful', 'unsuccessful', 'rescheduled'].map((outcome) => (
                <button
                  key={outcome}
                  onClick={() => setOutcomeFilter(outcome)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    outcomeFilter === outcome
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visits List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No visits</h3>
            <p className="mt-1 text-sm text-gray-500">No visits found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{visit.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{visit.agent_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(visit.visit_date).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(visit.visit_type)}`}>
                        {visit.visit_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{visit.duration_minutes} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {visit.order_value ? formatCurrency(visit.order_value) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOutcomeBadge(visit.outcome)}`}>
                        {visit.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        View Details
                      </button>
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
