import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ordersService, Order } from '../../services/orders.service'
import { Link } from 'react-router-dom'

export const DeliveryTrackingPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('shipped')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['deliveries', statusFilter, page],
    queryFn: () => ordersService.getOrders({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit
    })
  })

  const orders = data?.orders || []
  const total = data?.total || 0

  const deliveries = orders.filter(o => ['shipped', 'in_transit', 'out_for_delivery'].includes(o.order_status))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      shipped: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed_delivery: 'bg-red-100 text-red-800'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getDeliveryProgress = (status: string) => {
    const progress = {
      shipped: 25,
      in_transit: 50,
      out_for_delivery: 75,
      delivered: 100,
      failed_delivery: 0
    }
    return progress[status as keyof typeof progress] || 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load deliveries. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Tracking</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Track Shipment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Shipped</p>
              <p className="text-2xl font-semibold text-gray-900">
                {deliveries.filter(d => d.order_status === 'shipped').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Transit</p>
              <p className="text-2xl font-semibold text-gray-900">
                {deliveries.filter(d => d.order_status === 'in_transit').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out for Delivery</p>
              <p className="text-2xl font-semibold text-gray-900">
                {deliveries.filter(d => d.order_status === 'out_for_delivery').length}
              </p>
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
              <p className="text-sm font-medium text-gray-500">Delivered Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(o => o.order_status === 'delivered' && new Date(o.delivery_date || '').toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries</h3>
            <p className="mt-1 text-sm text-gray-500">No deliveries found for the selected filter.</p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{delivery.order_number}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Customer: {delivery.customer?.name || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(delivery.order_status)}`}>
                      {delivery.order_status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Order Placed</span>
                      <span>Shipped</span>
                      <span>In Transit</span>
                      <span>Out for Delivery</span>
                      <span>Delivered</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getDeliveryProgress(delivery.order_status)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Order Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(delivery.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expected Delivery</p>
                      <p className="font-medium text-gray-900">
                        {delivery.delivery_date
                          ? new Date(delivery.delivery_date).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(delivery.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment Status</p>
                      <p className="font-medium text-gray-900">
                        {delivery.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <Link
                  to={`/orders/${delivery.id}`}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  View Details
                </Link>
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  Track Shipment
                </button>
                <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                  Update Status
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
