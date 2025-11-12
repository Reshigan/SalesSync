import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '../../services/inventory.service'
import { Plus, Edit, Trash2, Warehouse, Package, TrendingUp } from 'lucide-react'

export default function WarehouseManagementPage() {
  const [filter, setFilter] = useState({ page: 1, limit: 20 })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['warehouses', filter],
    queryFn: () => inventoryService.getWarehouses(filter)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteWarehouse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] })
  })

  const warehouses = data?.data || []
  const total = data?.total || 0
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'}).format(amount)

  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load warehouses.</p></div></div>
  if (isLoading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1><p className="text-sm text-gray-600 mt-1">Manage warehouse locations ({total} total)</p></div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Add Warehouse</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Warehouses</p><p className="text-2xl font-bold text-gray-900">{total}</p></div>
            <Warehouse className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Products</p><p className="text-2xl font-bold text-gray-900">{warehouses.reduce((sum, w) => sum + (w.products_count || 0), 0)}</p></div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-600">Total Stock Value</p><p className="text-2xl font-bold text-green-600">{formatCurrency(warehouses.reduce((sum, w) => sum + (w.total_value || 0), 0))}</p></div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warehouses.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500"><Warehouse className="h-12 w-12 mx-auto text-gray-400 mb-2" /><p>No warehouses found</p></td></tr>
              ) : (
                warehouses.map(warehouse => (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{warehouse.warehouse_name}</div><div className="text-sm text-gray-500">{warehouse.warehouse_code}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{warehouse.address}</div><div className="text-sm text-gray-500">{warehouse.city}, {warehouse.country}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-900">{warehouse.manager_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{warehouse.products_count || 0}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(warehouse.total_value || 0)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: `${warehouse.capacity_utilization || 0}%`}}></div>
                        </div>
                        <span className="text-sm text-gray-900">{warehouse.capacity_utilization || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex space-x-2"><button className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button><button onClick={() => {if(confirm('Delete?')) deleteMutation.mutate(warehouse.id)}} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button></div></td>
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
