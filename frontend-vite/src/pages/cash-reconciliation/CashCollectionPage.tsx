import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashReconciliationService, CashCollection } from '../../services/cashReconciliation.service'
import { useParams } from 'react-router-dom'

export const CashCollectionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    amount: '',
    payment_method: 'cash' as 'cash' | 'mobile_money'
  })

  const { data: collections, isLoading } = useQuery({
    queryKey: ['cash-collections', sessionId],
    queryFn: () => cashReconciliationService.getCollections(sessionId!),
    enabled: !!sessionId
  })

  const recordCollectionMutation = useMutation({
    mutationFn: (data: Partial<CashCollection>) =>
      cashReconciliationService.recordCollection(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-collections', sessionId] })
      setShowForm(false)
      setFormData({ order_id: '', customer_name: '', amount: '', payment_method: 'cash' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    recordCollectionMutation.mutate({
      order_id: formData.order_id,
      customer_name: formData.customer_name,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const totalCollected = collections?.reduce((sum, c) => sum + c.amount, 0) || 0

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
          <h1 className="text-2xl font-bold text-gray-900">Cash Collections</h1>
          <p className="mt-1 text-sm text-gray-500">Session ID: {sessionId}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Record Collection
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Collected</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Cash Collections</p>
            <p className="text-lg font-semibold text-gray-900">
              {collections?.filter(c => c.payment_method === 'cash').length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Mobile Money</p>
            <p className="text-lg font-semibold text-gray-900">
              {collections?.filter(c => c.payment_method === 'mobile_money').length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Collection Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Cash Collection</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order ID</label>
                <input
                  type="text"
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (ZAR)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R</span>
                  </div>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                    className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as 'cash' | 'mobile_money' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              {recordCollectionMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">Failed to record collection. Please try again.</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordCollectionMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {recordCollectionMutation.isPending ? 'Recording...' : 'Record Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!collections || collections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No collections yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start recording cash collections for this session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(collection.collected_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {collection.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(collection.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        collection.payment_method === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {collection.payment_method === 'cash' ? 'Cash' : 'Mobile Money'}
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
