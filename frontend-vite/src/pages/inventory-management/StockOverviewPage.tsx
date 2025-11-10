import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '../../services/inventory.service'
import { Package, TrendingDown, AlertCircle, TrendingUp } from 'lucide-react'

export default function StockOverviewPage() {
  const [filter, setFilter] = useState({ warehouse_id: '', category: '' })
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-overview', filter],
    queryFn: () => inventoryService.getStockOverview(filter)
  })

  const stock = data?.data || []
  const stats = data?.stats || {}
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'}).format(amount)

  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load stock overview.</p></div></div>
  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}</div></div></div>

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1><p className="text-sm text-gray-600 mt-1">Monitor inventory levels across all warehouses</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Products</p><p className="text-2xl font-bold text-gray-900">{stats.total_products || 0}</p></div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Stock Value</p><p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_value || 0)}</p></div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Low Stock Items</p><p className="text-2xl font-bold text-red-600">{stats.low_stock_count || 0}</p></div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Out of Stock</p><p className="text-2xl font-bold text-red-600">{stats.out_of_stock_count || 0}</p></div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <input type="text" placeholder="Filter by warehouse" value={filter.warehouse_id} onChange={e => setFilter({...filter, warehouse_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input type="text" placeholder="Filter by category" value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500"><Package className="h-12 w-12 mx-auto text-gray-400 mb-2" /><p>No stock data found</p></td></tr>
              ) : (
                stock.map(item => {
                  const isLowStock = item.current_stock <= item.min_stock_level
                  const isOutOfStock = item.current_stock === 0
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{item.product_name}</div><div className="text-sm text-gray-500">{item.category}</div></td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.warehouse_name}</td>
                      <td className="px-6 py-4"><span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'}`}>{item.current_stock}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.min_stock_level}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.unit_value || 0)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency((item.current_stock * (item.unit_value || 0)))}</td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">OUT OF STOCK</span>
                        : isLowStock ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">LOW STOCK</span>
                        : <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">IN STOCK</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
