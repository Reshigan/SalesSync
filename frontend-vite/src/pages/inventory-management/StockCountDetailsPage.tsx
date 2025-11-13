import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { inventoryService } from '../../services/inventory.service'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function StockCountDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: count, isLoading, error } = useQuery({
    queryKey: ['stock-count', id],
    queryFn: () => inventoryService.getStockCountById(id!)
  })

  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>
  if (error || !count) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load stock count details.</p></div></div>

  const items = count.items || []
  const variances = items.filter(item => item.variance !== 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Stock Count #{count.count_number}</h1>
          <p className="text-sm text-gray-600 mt-1">{count.warehouse_name} - {new Date(count.count_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Matched</p>
          <p className="text-2xl font-bold text-green-600">{items.filter(i => i.variance === 0).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Variances</p>
          <p className="text-2xl font-bold text-red-600">{variances.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-bold text-gray-900">{count.status.replace('_', ' ').toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Count Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Counter</span>
            <span className="text-sm font-medium text-gray-900">{count.counter_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Count Date</span>
            <span className="text-sm font-medium text-gray-900">{new Date(count.count_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Started At</span>
            <span className="text-sm font-medium text-gray-900">{count.started_at ? new Date(count.started_at).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completed At</span>
            <span className="text-sm font-medium text-gray-900">{count.completed_at ? new Date(count.completed_at).toLocaleString() : '-'}</span>
          </div>
        </div>
      </div>

      {variances.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="text-sm font-bold text-yellow-900">Variances Detected</h3>
          </div>
          <p className="text-sm text-yellow-800">{variances.length} items have discrepancies between system and physical count.</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Count Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Physical Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, idx) => (
                <tr key={idx} className={item.variance !== 0 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{item.product_name}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.system_quantity}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.physical_quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.variance > 0 ? '+' : ''}{item.variance}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.variance === 0 ? (
                      <div className="flex items-center space-x-1 text-green-600"><CheckCircle className="h-4 w-4" /><span className="text-xs">Match</span></div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-600"><XCircle className="h-4 w-4" /><span className="text-xs">Variance</span></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {count.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-700">{count.notes}</p>
        </div>
      )}
    </div>
  )
}
