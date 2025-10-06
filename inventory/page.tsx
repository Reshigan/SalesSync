'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Warehouse, BarChart3, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { apiClient, handleApiError, handleApiSuccess } from '@/lib/api-client'
import Link from 'next/link'

interface InventoryItem {
  id: string
  productId: string
  warehouseId: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  product: {
    id: string
    name: string
    sku: string
    unitPrice: number
    category?: string
  }
  warehouse: {
    id: string
    name: string
    location: string
    code: string
  }
  movements?: InventoryMovement[]
}

interface InventoryMovement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'
  quantity: number
  reason: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const STOCK_STATUSES = [
  { value: 'IN_STOCK', label: 'In Stock', color: 'success' },
  { value: 'LOW_STOCK', label: 'Low Stock', color: 'warning' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'error' },
  { value: 'OVERSTOCK', label: 'Overstock', color: 'info' }
] as const

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [inventoryStats, setInventoryStats] = useState<any>(null)

  useEffect(() => {
    fetchInventory()
    fetchWarehouses()
    fetchCategories()
    fetchInventoryStats()
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, warehouseFilter, categoryFilter])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getInventory({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        category: categoryFilter || undefined
      })

      setInventory((response as any).inventory || [])
      if ((response as any).pagination) {
        setPagination((response as any).pagination)
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch inventory')
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await apiClient.getWarehouses({ limit: 100 })
      setWarehouses((response as any).warehouses || [])
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getProductCategories()
      setCategories((response as any).categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchInventoryStats = async () => {
    try {
      const response = await apiClient.getInventoryStats()
      setInventoryStats(response as any)
    } catch (error) {
      console.error('Failed to fetch inventory stats:', error)
    }
  }

  const handleStockAdjustment = async (adjustmentData: any) => {
    if (!selectedItem) return
    
    try {
      setSubmitting(true)
      const response = await apiClient.adjustInventory(selectedItem.id, adjustmentData)
      handleApiSuccess((response as any).message || 'Stock adjusted successfully')
      setShowAdjustModal(false)
      setSelectedItem(null)
      fetchInventory()
      fetchInventoryStats()
    } catch (error) {
      handleApiError(error, 'Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') {
      setStatusFilter(value)
    } else if (type === 'warehouse') {
      setWarehouseFilter(value)
    } else if (type === 'category') {
      setCategoryFilter(value)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return 'OUT_OF_STOCK'
    if (item.currentStock <= item.minStock) return 'LOW_STOCK'
    if (item.currentStock >= item.maxStock) return 'OVERSTOCK'
    return 'IN_STOCK'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = STOCK_STATUSES.find(s => s.value === status)
    return (
      <Badge variant={statusConfig?.color as any || 'default'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (item: InventoryItem) => (
        <div>
          <div className="font-medium">{item.product.name}</div>
          <div className="text-sm text-gray-500">{item.product.sku}</div>
          {item.product.category && (
            <div className="text-xs text-gray-400">{item.product.category}</div>
          )}
        </div>
      )
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (item: InventoryItem) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-gray-400" />
          <div>
            <div className="font-medium">{item.warehouse.name}</div>
            <div className="text-xs text-gray-500">{item.warehouse.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock Level',
      render: (item: InventoryItem) => {
        const status = getStockStatus(item)
        const percentage = item.maxStock > 0 ? (item.currentStock / item.maxStock) * 100 : 0
        
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.currentStock}</span>
              {getStatusBadge(status)}
            </div>
            <div className="text-xs text-gray-500">
              Min: {item.minStock} | Max: {item.maxStock}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full ${
                  percentage <= 25 ? 'bg-red-500' :
                  percentage <= 50 ? 'bg-yellow-500' :
                  percentage <= 75 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: 'value',
      label: 'Value',
      render: (item: InventoryItem) => (
        <div>
          <div className="font-medium">${item.totalValue.toFixed(2)}</div>
          <div className="text-sm text-gray-500">
            @ ${item.unitCost.toFixed(2)}/unit
          </div>
        </div>
      )
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (item: InventoryItem) => (
        <div className="text-sm text-gray-500">
          {new Date(item.lastUpdated).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: InventoryItem) => (
        <div className="flex items-center gap-2">
          <Link href={`/inventory/${item.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItem(item)
              setShowAdjustModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Link href={`/inventory/${item.id}/movements`}>
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
  ]

  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventory.filter(item => getStockStatus(item) === 'LOW_STOCK').length
  const outOfStockItems = inventory.filter(item => getStockStatus(item) === 'OUT_OF_STOCK').length

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track stock levels, movements, and warehouse inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchInventory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/inventory/adjustments">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Adjustments
            </Button>
          </Link>
          <Link href="/inventory/movements">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Movement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryStats?.totalItems || pagination.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${(inventoryStats?.totalValue || totalValue).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{inventoryStats?.lowStockItems || lowStockItems}</p>
            </div>
            <Badge variant="warning">Low Stock</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{inventoryStats?.outOfStockItems || outOfStockItems}</p>
            </div>
            <Badge variant="error">Out of Stock</Badge>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {STOCK_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => handleFilterChange('warehouse', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Inventory Items ({pagination.total})
            </h3>
            {loading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
        </div>
        
        <SimpleTable
          data={inventory}
          columns={columns}
          emptyMessage="No inventory items found"
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false)
          setSelectedItem(null)
        }}
        title="Stock Adjustment"
      >
        <StockAdjustmentForm
          item={selectedItem}
          onSubmit={handleStockAdjustment}
          onCancel={() => {
            setShowAdjustModal(false)
            setSelectedItem(null)
          }}
          submitting={submitting}
        />
      </Modal>
    </div>
  )
}

interface StockAdjustmentFormProps {
  item: InventoryItem | null
  onSubmit: (data: any) => void
  onCancel: () => void
  submitting?: boolean
}

function StockAdjustmentForm({ item, onSubmit, onCancel, submitting = false }: StockAdjustmentFormProps) {
  const [formData, setFormData] = useState({
    type: 'ADJUSTMENT',
    quantity: 0,
    reason: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.quantity === 0) {
      newErrors.quantity = 'Quantity cannot be zero'
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  if (!item) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium">{item.product.name}</h4>
        <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
        <p className="text-sm text-gray-600">Current Stock: {item.currentStock}</p>
        <p className="text-sm text-gray-600">Warehouse: {item.warehouse.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adjustment Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={submitting}
          >
            <option value="ADJUSTMENT">Stock Adjustment</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.quantity ? 'border-red-300' : 'border-gray-300'
            }`}
            required
            disabled={submitting}
          />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason *
        </label>
        <input
          type="text"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.reason ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Damaged goods, Stock count correction"
          required
          disabled={submitting}
        />
        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>New Stock Level:</strong> {item.currentStock + formData.quantity}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Adjusting...
            </>
          ) : (
            'Adjust Stock'
          )}
        </Button>
      </div>
    </form>
  )
}