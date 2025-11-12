import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '../../services/inventory.service'
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Package } from 'lucide-react'

export default function StockMovementsPage() {
  const [filter, setFilter] = useState({ page: 1, limit: 20, movement_type: '', start_date: '', end_date: '' })
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-movements', filter],
    queryFn: () => inventoryService.getStockMovements(filter)
  })

  const movements = data?.data || []
  const total = data?.total || 0

  const getMovementIcon = (type: string) => {
    switch(type) {
      case 'in': return <ArrowUpCircle className="h-5 w-5 text-green-500" />
      case 'out': return <ArrowDownCircle className="h-5 w-5 text-red-500" />
      case 'adjustment': return <RefreshCw className="h-5 w-5 text-blue-500" />
      default: return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getMovementBadge = (type: string) => {
    const colors = {
      in: 'bg-green-100 text-green-800',
      out: 'bg-red-100 text-red-800',
      adjustment: 'bg-blue-100 text-blue-800',
      transfer: 'bg-purple-100 text-purple-800'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>{type.toUpperCase()}</span>
  }

  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load stock movements.</p></div></div>
  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1><p className="text-sm text-gray-600 mt-1">Track all inventory movements ({total} total)</p></div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
            <select value={filter.movement_type} onChange={e => setFilter({...filter, movement_type: e.target.value, page: 1})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={filter.start_date} onChange={e => setFilter({...filter, start_date: e.target.value, page: 1})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={filter.end_date} onChange={e => setFilter({...filter, end_date: e.target.value, page: 1})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500"><Package className="h-12 w-12 mx-auto text-gray-400 mb-2" /><p>No stock movements found</p></td></tr>
              ) : (
                movements.map(movement => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{new Date(movement.movement_date).toLocaleDateString()}</div><div className="text-sm text-gray-500">{new Date(movement.movement_date).toLocaleTimeString()}</div></td>
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{movement.product_name}</div><div className="text-sm text-gray-500">{movement.sku}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-900">{movement.warehouse_name}</td>
                    <td className="px-6 py-4"><div className="flex items-center space-x-2">{getMovementIcon(movement.movement_type)}{getMovementBadge(movement.movement_type)}</div></td>
                    <td className="px-6 py-4"><span className={`text-sm font-medium ${movement.movement_type === 'in' ? 'text-green-600' : movement.movement_type === 'out' ? 'text-red-600' : 'text-gray-900'}`}>{movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : ''}{movement.quantity}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-900">{movement.reference_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{movement.user_name || '-'}</td>
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
