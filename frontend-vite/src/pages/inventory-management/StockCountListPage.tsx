import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '../../services/inventory.service'
import { Plus, Eye, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function StockCountListPage() {
  const [filter, setFilter] = useState({ page: 1, limit: 20, status: '' })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-counts', filter],
    queryFn: () => inventoryService.getStockCounts(filter)
  })

  const counts = data?.data || []
  const total = data?.total || 0

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>{status.replace('_', ' ').toUpperCase()}</span>
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load stock counts.</p></div></div>
  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Stock Counts</h1><p className="text-sm text-gray-600 mt-1">Manage physical stock counts ({total} total)</p></div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"><Plus className="h-4 w-4" /><span>New Stock Count</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Counts</p><p className="text-2xl font-bold text-gray-900">{total}</p></div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">In Progress</p><p className="text-2xl font-bold text-yellow-600">{counts.filter(c => c.status === 'in_progress').length}</p></div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold text-green-600">{counts.filter(c => c.status === 'completed').length}</p></div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Cancelled</p><p className="text-2xl font-bold text-red-600">{counts.filter(c => c.status === 'cancelled').length}</p></div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value, page: 1})} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variances</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {counts.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500"><Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" /><p>No stock counts found</p></td></tr>
              ) : (
                counts.map(count => (
                  <tr key={count.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{count.count_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{count.warehouse_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(count.count_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{count.counter_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{count.items_count || 0}</td>
                    <td className="px-6 py-4"><span className={`text-sm font-medium ${count.variances_count > 0 ? 'text-red-600' : 'text-green-600'}`}>{count.variances_count || 0}</span></td>
                    <td className="px-6 py-4"><div className="flex items-center space-x-2">{getStatusIcon(count.status)}{getStatusBadge(count.status)}</div></td>
                    <td className="px-6 py-4"><button className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > filter.limit && (
        <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-700">Showing {(filter.page-1)*filter.limit+1} to {Math.min(filter.page*filter.limit,total)} of {total}</div>
          <div className="flex space-x-2">
            <button onClick={() => setFilter({...filter, page: filter.page-1})} disabled={filter.page<=1} className="px-4 py-2 border rounded-lg disabled:opacity-50">Previous</button>
            <button onClick={() => setFilter({...filter, page: filter.page+1})} disabled={filter.page*filter.limit>=total} className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
