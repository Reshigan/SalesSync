import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '../../services/inventory.service'
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, RefreshCw } from 'lucide-react'

export default function InventoryAnalyticsPage() {
  const [filter, setFilter] = useState({ period: 'month' })
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['inventory-analytics', filter],
    queryFn: () => inventoryService.getInventoryAnalytics(filter)
  })

  const stats = analytics || {}
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'}).format(amount)

  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}</div></div></div>
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load analytics.</p></div></div>

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Inventory Analytics</h1><p className="text-sm text-gray-600 mt-1">Comprehensive inventory insights and trends</p></div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
        <select value={filter.period} onChange={e => setFilter({...filter, period: e.target.value})} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Stock Value</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_stock_value || 0)}</p></div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Stock Turnover</p><p className="text-2xl font-bold text-gray-900">{stats.stock_turnover_ratio || 0}x</p></div>
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Low Stock Items</p><p className="text-2xl font-bold text-red-600">{stats.low_stock_items || 0}</p></div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Out of Stock</p><p className="text-2xl font-bold text-red-600">{stats.out_of_stock_items || 0}</p></div>
            <Package className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Stock Movement Trends</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Stock In</span>
                <span className="text-sm font-bold text-green-600">{stats.stock_in_count || 0} movements</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: `${stats.stock_in_percentage || 0}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Stock Out</span>
                <span className="text-sm font-bold text-red-600">{stats.stock_out_count || 0} movements</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{width: `${stats.stock_out_percentage || 0}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Adjustments</span>
                <span className="text-sm font-bold text-blue-600">{stats.adjustments_count || 0} movements</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${stats.adjustments_percentage || 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Warehouse Performance</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Warehouses</span>
              <span className="text-sm font-bold text-gray-900">{stats.total_warehouses || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Capacity Utilization</span>
              <span className="text-sm font-bold text-blue-600">{stats.avg_capacity_utilization || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Transfers</span>
              <span className="text-sm font-bold text-gray-900">{stats.total_transfers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Transfers</span>
              <span className="text-sm font-bold text-yellow-600">{stats.pending_transfers || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top Products by Value</h2>
        <div className="space-y-3">
          {(stats.top_products || []).map((product: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                <p className="text-xs text-gray-500">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(product.total_value || 0)}</p>
                <p className="text-xs text-gray-500">{product.quantity || 0} units</p>
              </div>
            </div>
          ))}
          {(!stats.top_products || stats.top_products.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">No product data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Stock Health Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium text-gray-900">Healthy Stock</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.healthy_stock_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.healthy_stock_percentage || 0}% of total</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm font-medium text-gray-900">Low Stock</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.low_stock_items || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.low_stock_percentage || 0}% of total</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-gray-900">Out of Stock</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_items || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.out_of_stock_percentage || 0}% of total</p>
          </div>
        </div>
      </div>
    </div>
  )
}
