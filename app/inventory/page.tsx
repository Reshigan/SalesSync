'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SimpleTable as DataTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Warehouse,
  BarChart3
} from 'lucide-react'

interface InventoryItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  current_stock: number
  minimum_stock: number
  maximum_stock: number
  unit_cost: number
  total_value: number
  warehouse_id: string
  warehouse_name: string
  last_updated: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const tenantCode = localStorage.getItem('tenantCode') || 'DEMO'
      
      const response = await fetch('http://localhost:3001/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Code': tenantCode,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const result = await response.json()
      setInventory(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mock data for development
      setInventory([
        {
          id: '1',
          product_id: 'p1',
          product_name: 'Premium Cola 500ml',
          sku: 'PC500',
          current_stock: 150,
          minimum_stock: 50,
          maximum_stock: 500,
          unit_cost: 12.50,
          total_value: 1875.00,
          warehouse_id: 'w1',
          warehouse_name: 'Main Warehouse',
          last_updated: '2025-10-06T10:30:00Z',
          status: 'in_stock'
        },
        {
          id: '2',
          product_id: 'p2',
          product_name: 'Premium Water 1L',
          sku: 'PW1L',
          current_stock: 25,
          minimum_stock: 50,
          maximum_stock: 300,
          unit_cost: 8.00,
          total_value: 200.00,
          warehouse_id: 'w1',
          warehouse_name: 'Main Warehouse',
          last_updated: '2025-10-06T09:15:00Z',
          status: 'low_stock'
        },
        {
          id: '3',
          product_id: 'p3',
          product_name: 'Premium Juice 250ml',
          sku: 'PJ250',
          current_stock: 0,
          minimum_stock: 30,
          maximum_stock: 200,
          unit_cost: 15.00,
          total_value: 0.00,
          warehouse_id: 'w2',
          warehouse_name: 'Secondary Warehouse',
          last_updated: '2025-10-05T16:45:00Z',
          status: 'out_of_stock'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_stock: { label: 'In Stock', variant: 'success' as const },
      low_stock: { label: 'Low Stock', variant: 'warning' as const },
      out_of_stock: { label: 'Out of Stock', variant: 'error' as const },
      overstock: { label: 'Overstock', variant: 'info' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_stock
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const inventoryStats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + item.total_value, 0),
    lowStockItems: inventory.filter(item => item.status === 'low_stock').length,
    outOfStockItems: inventory.filter(item => item.status === 'out_of_stock').length
  }

  const columns = [
    {
      key: 'product_name',
      label: 'Product',
      render: (item: InventoryItem) => (
        <div>
          <div className="font-medium text-gray-900">{item.product_name}</div>
          <div className="text-sm text-gray-500">SKU: {item.sku}</div>
        </div>
      )
    },
    {
      key: 'current_stock',
      label: 'Current Stock',
      render: (item: InventoryItem) => (
        <div className="text-center">
          <div className="font-medium">{item.current_stock}</div>
          <div className="text-xs text-gray-500">
            Min: {item.minimum_stock} | Max: {item.maximum_stock}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: InventoryItem) => getStatusBadge(item.status)
    },
    {
      key: 'unit_cost',
      label: 'Unit Cost',
      render: (item: InventoryItem) => formatCurrency(item.unit_cost)
    },
    {
      key: 'total_value',
      label: 'Total Value',
      render: (item: InventoryItem) => formatCurrency(item.total_value)
    },
    {
      key: 'warehouse_name',
      label: 'Warehouse',
      render: (item: InventoryItem) => item.warehouse_name
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      render: (item: InventoryItem) => (
        <div className="text-sm text-gray-600">
          {formatDate(item.last_updated)}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your product inventory</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryStats.totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(inventoryStats.totalValue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
            <div className="text-sm text-gray-500">
              Showing {filteredInventory.length} of {inventory.length} items
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchInventory}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          <DataTable
            data={filteredInventory}
            columns={columns}
            loading={loading}
            emptyMessage="No inventory items found"
          />
        </div>
      </Card>
    </div>
  )
}