'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
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
  sku: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  unitPrice: number
  totalValue: number
  lastMovement: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
  location: string
  supplier: string
}

export default function InventoryPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)

  // Mock data
  const inventory: InventoryItem[] = [
    {
      id: '1',
      sku: 'CC-500',
      productName: 'Coca Cola 500ml',
      category: 'Beverages',
      currentStock: 150,
      minStock: 50,
      maxStock: 500,
      unitCost: 1.80,
      unitPrice: 2.50,
      totalValue: 270,
      lastMovement: '2 hours ago',
      status: 'in_stock',
      location: 'A-01-01',
      supplier: 'Coca Cola Company',
    },
    {
      id: '2',
      sku: 'PP-500',
      productName: 'Pepsi 500ml',
      category: 'Beverages',
      currentStock: 25,
      minStock: 50,
      maxStock: 400,
      unitCost: 1.75,
      unitPrice: 2.45,
      totalValue: 43.75,
      lastMovement: '4 hours ago',
      status: 'low_stock',
      location: 'A-01-02',
      supplier: 'PepsiCo',
    },
    {
      id: '3',
      sku: 'SP-500',
      productName: 'Sprite 500ml',
      category: 'Beverages',
      currentStock: 0,
      minStock: 40,
      maxStock: 300,
      unitCost: 1.70,
      unitPrice: 2.40,
      totalValue: 0,
      lastMovement: '1 day ago',
      status: 'out_of_stock',
      location: 'A-01-03',
      supplier: 'Coca Cola Company',
    },
    {
      id: '4',
      sku: 'FO-500',
      productName: 'Fanta Orange 500ml',
      category: 'Beverages',
      currentStock: 520,
      minStock: 60,
      maxStock: 350,
      unitCost: 1.70,
      unitPrice: 2.40,
      totalValue: 884,
      lastMovement: '6 hours ago',
      status: 'overstock',
      location: 'A-01-04',
      supplier: 'Coca Cola Company',
    },
  ]

  const warehouseStats = {
    totalItems: 1247,
    totalValue: 125000,
    lowStockItems: 23,
    outOfStockItems: 8,
    overstockItems: 12,
    reorderRequired: 31,
  }

  const categories = ['All Categories', 'Beverages', 'Snacks', 'Personal Care', 'Household']

  const filteredInventory = inventory.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
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
                <p className="text-2xl font-bold">{warehouseStats.totalItems.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${warehouseStats.totalValue.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{warehouseStats.lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{warehouseStats.outOfStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overstock</p>
                <p className="text-2xl font-bold text-blue-600">{warehouseStats.overstockItems}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reorder Required</p>
                <p className="text-2xl font-bold text-orange-600">{warehouseStats.reorderRequired}</p>
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
            <h3 className="text-lg font-semibold">Inventory Items</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'Product', 
                  accessor: 'productName',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.productName}</p>
                      <p className="text-sm text-gray-500">SKU: {row.sku}</p>
                    </div>
                  )
                },
                { 
                  header: 'Category', 
                  accessor: 'category',
                  cell: ({ value }) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {value}
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
                  cell: ({ row }) => (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{row.currentStock}</span>
                        {getStatusIcon(row.status)}
                      </div>
                      {getStockLevel(row.currentStock, row.minStock, row.maxStock)}
                      <div className="text-xs text-gray-500">
                        Min: {row.minStock} | Max: {row.maxStock}
                      </div>
                    </div>
                  )
                },
                { 
                  header: 'Unit Cost', 
                  accessor: 'unitCost',
                  cell: ({ value }) => `$${value.toFixed(2)}`
                },
                { 
                  header: 'Unit Price', 
                  accessor: 'unitPrice',
                  cell: ({ value }) => `$${value.toFixed(2)}`
                },
                { 
                  header: 'Total Value', 
                  accessor: 'totalValue',
                  cell: ({ value }) => (
                    <span className="font-medium">${value.toFixed(2)}</span>
                  )
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                      {value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}
                    </span>
                  )
                },
                { 
                  header: 'Last Movement', 
                  accessor: 'lastMovement',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {(row.status === 'low_stock' || row.status === 'out_of_stock') && (
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={filteredInventory}
            />
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