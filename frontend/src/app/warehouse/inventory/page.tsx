'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import apiService from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import inventoryService from '@/services/inventory.service';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Minus,
  BarChart3,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react'

interface InventoryItem {
  id: string
  productId: string
  currentStock: number
  minStock: number
  maxStock: number
  location: string
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    sku: string
    category?: {
      id: string
      name: string
    }
  }
}

interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalStockUnits: number
  stockStatus: {
    healthy: number
    lowStock: number
    outOfStock: number
  }
}

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();
  const { _hasHydrated, isAuthenticated } = useAuthStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load inventory data
  useEffect(() => {
    // Only load data after hydration is complete and user is authenticated
    if (_hasHydrated && isAuthenticated) {
      loadInventoryData()
      loadInventoryStats()
    } else if (_hasHydrated && !isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login'
    }
  }, [_hasHydrated, isAuthenticated, page, filterStatus, filterCategory, searchTerm])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      
      if (filterStatus === 'low_stock') {
        params.lowStock = true
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await apiService.getInventory(params)
      if (response.success) {
        setInventory(response.data.data)
        setTotalPages(response.data.pagination.totalPages)
      } else {
        setError('Failed to load inventory data')
      }
    } catch (err) {
      setError('Failed to load inventory data')
      console.error('Inventory load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventoryStats = async () => {
    try {
      const response = await apiService.getInventoryStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Stats load error:', err)
    }
  }

  const categories = ['All Categories', 'Beverages', 'Snacks', 'Personal Care', 'Household']

  const getItemStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock'
    if (item.currentStock <= item.minStock) return 'low_stock'
    if (item.currentStock >= item.maxStock) return 'overstock'
    return 'in_stock'
  }

  const filteredInventory = inventory.filter(item => {
    const status = getItemStatus(item)
    const matchesStatus = filterStatus === 'all' || status === filterStatus
    const matchesCategory = filterCategory === 'all' || item.product.category?.name === filterCategory
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800'
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      case 'overstock':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'out_of_stock':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'overstock':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getStockLevel = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100
    let color = 'bg-green-500'
    
    if (current === 0) color = 'bg-red-500'
    else if (current <= min) color = 'bg-yellow-500'
    else if (current >= max) color = 'bg-blue-500'
    
    return (<ErrorBoundary>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    
</ErrorBoundary>)
  }

  // Show loading while waiting for hydration
  if (!_hasHydrated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Monitor stock levels and manage warehouse inventory</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Stock
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Stock Report
            </Button>
            <Button onClick={() => setShowAdjustmentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Stock Adjustment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats?.totalProducts.toLocaleString() || '0'}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock Units</p>
                <p className="text-2xl font-bold">{stats?.totalStockUnits.toLocaleString() || '0'}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.lowStockCount || '0'}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats?.outOfStockCount || '0'}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healthy Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats?.stockStatus.healthy || '0'}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reorder Required</p>
                <p className="text-2xl font-bold text-orange-600">{(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)}</p>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="overstock">Overstock</option>
                </select>
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(category => (
                  <option key={category} value={category === 'All Categories' ? 'all' : category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </Card>

        {/* Inventory Table */}
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Inventory Items</h3>
              {loading && (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              )}
            </div>
          </Card.Header>
          <Card.Content>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setError(null)
                    loadInventoryData()
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
            
            {!loading && !error && inventory.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first inventory item.</p>
                <Button onClick={() => setShowAdjustmentModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Inventory Item
                </Button>
              </div>
            )}
            
            {!loading && !error && inventory.length > 0 && (
              <DataTable
              columns={[
                { 
                  header: 'Product', 
                  accessor: 'product',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {row.product.sku}</p>
                    </div>
                  )
                },
                { 
                  header: 'Category', 
                  accessor: 'product',
                  cell: ({ row }) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {row.product.category?.name || 'Uncategorized'}
                    </span>
                  )
                },
                { 
                  header: 'Location', 
                  accessor: 'location',
                  cell: ({ value }) => (
                    <span className="font-mono text-sm">{value}</span>
                  )
                },
                { 
                  header: 'Current Stock', 
                  accessor: 'currentStock',
                  cell: ({ row }) => {
                    const status = getItemStatus(row)
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{row.currentStock}</span>
                          {getStatusIcon(status)}
                        </div>
                        {getStockLevel(row.currentStock, row.minStock, row.maxStock)}
                        <div className="text-xs text-gray-500">
                          Min: {row.minStock} | Max: {row.maxStock}
                        </div>
                      </div>
                    )
                  }
                },
                { 
                  header: 'Status', 
                  accessor: 'currentStock',
                  cell: ({ row }) => {
                    const status = getItemStatus(row)
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </span>
                    )
                  }
                },
                { 
                  header: 'Last Updated', 
                  accessor: 'updatedAt',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
                    </div>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => {
                    const status = getItemStatus(row)
                    return (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(status === 'low_stock' || status === 'out_of_stock') && (
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )
                  },
                },
              ]}
              data={filteredInventory}
            />
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <Plus className="w-12 h-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-lg font-semibold mb-2">Stock Adjustment</h3>
              <p className="text-gray-600 mb-4">Adjust inventory levels</p>
              <Button fullWidth>Make Adjustment</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Create Purchase Order</h3>
              <p className="text-gray-600 mb-4">Reorder low stock items</p>
              <Button variant="outline" fullWidth>Create PO</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Stock Count</h3>
              <p className="text-gray-600 mb-4">Physical inventory count</p>
              <Button variant="outline" fullWidth>Start Count</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2">Inventory Report</h3>
              <p className="text-gray-600 mb-4">Generate detailed report</p>
              <Button variant="outline" fullWidth>Generate Report</Button>
            </div>
          </Card>
        </div>

        {/* Critical Alerts */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-red-500">
            <Card.Content className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Critical Stock Levels</h4>
                  <p className="text-gray-600 mt-1">
                    8 items are out of stock and 23 items are below minimum levels. 
                    Immediate reordering required to avoid stockouts.
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline">View Critical Items</Button>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <Card.Content className="p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Overstock Alert</h4>
                  <p className="text-gray-600 mt-1">
                    12 items are overstocked, tying up $15,000 in excess inventory. 
                    Consider promotional activities to move stock.
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline">View Overstock Items</Button>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}