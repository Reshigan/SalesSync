import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customersService } from '../../services/customers.service'

interface Segment {
  id: string
  name: string
  description: string
  customer_count: number
  total_sales: number
  avg_order_value: number
  criteria: {
    type?: string[]
    min_sales?: number
    max_sales?: number
    status?: string[]
  }
}

export const CustomerSegmentationPage: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)

  const mockSegments: Segment[] = []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Segmentation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze and manage customer segments for targeted marketing
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Create Segment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Segments</p>
              <p className="text-2xl font-semibold text-gray-900">{mockSegments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Segmented Customers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockSegments.reduce((sum, s) => sum + s.customer_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(mockSegments.reduce((sum, s) => sum + s.total_sales, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockSegments.length > 0
                  ? formatCurrency(mockSegments.reduce((sum, s) => sum + s.avg_order_value, 0) / mockSegments.length)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSegments.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No segments</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first customer segment to get started.</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create Segment
            </button>
          </div>
        ) : (
          mockSegments.map((segment) => (
            <div
              key={segment.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedSegment(segment)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{segment.name}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {segment.customer_count} customers
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{segment.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Sales</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(segment.total_sales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Order Value</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(segment.avg_order_value)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Customers →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Segment Details Modal */}
      {selectedSegment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedSegment.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedSegment.description}</p>
              </div>
              <button
                onClick={() => setSelectedSegment(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{selectedSegment.customer_count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(selectedSegment.total_sales)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(selectedSegment.avg_order_value)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Segment Criteria</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {selectedSegment.criteria.type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer Types</span>
                    <span className="text-gray-900">{selectedSegment.criteria.type.join(', ')}</span>
                  </div>
                )}
                {selectedSegment.criteria.min_sales !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Min Sales</span>
                    <span className="text-gray-900">{formatCurrency(selectedSegment.criteria.min_sales)}</span>
                  </div>
                )}
                {selectedSegment.criteria.max_sales !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Max Sales</span>
                    <span className="text-gray-900">{formatCurrency(selectedSegment.criteria.max_sales)}</span>
                  </div>
                )}
                {selectedSegment.criteria.status && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="text-gray-900">{selectedSegment.criteria.status.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedSegment(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                View Customers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
