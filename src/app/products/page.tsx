'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner, SkeletonTable } from '@/components/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Package, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Barcode,
  DollarSign,
  Weight,
  Image,
  Tag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Grid3X3,
  List
} from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  categoryPath: string
  brand: string
  unitPrice: number
  costPrice: number
  margin: number
  weight: number
  dimensions: string
  barcode: string
  imageUrl: string
  stockLevel: number
  reorderLevel: number
  isActive: boolean
  createdAt: string
  lastSold: string
  totalSold: number
  revenue: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { canCreateIn, canEditIn, canDeleteIn, canExportFrom } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        sku: 'BEV001',
        name: 'Coca-Cola 500ml',
        description: 'Refreshing cola drink in 500ml bottle',
        category: 'Beverages',
        categoryPath: 'Beverages > Soft Drinks > Cola',
        brand: 'Coca-Cola',
        unitPrice: 250,
        costPrice: 180,
        margin: 28,
        weight: 0.5,
        dimensions: '20cm x 6cm x 6cm',
        barcode: '1234567890123',
        imageUrl: '/products/coke-500ml.jpg',
        stockLevel: 1250,
        reorderLevel: 200,
        isActive: true,
        createdAt: '2024-01-15',
        lastSold: '2024-09-30',
        totalSold: 5420,
        revenue: 1355000
      },
      {
        id: '2',
        sku: 'SNK002',
        name: 'Pringles Original 165g',
        description: 'Crispy potato chips in original flavor',
        category: 'Snacks',
        categoryPath: 'Snacks > Chips > Potato Chips',
        brand: 'Pringles',
        unitPrice: 800,
        costPrice: 600,
        margin: 25,
        weight: 0.165,
        dimensions: '25cm x 8cm x 8cm',
        barcode: '2345678901234',
        imageUrl: '/products/pringles-original.jpg',
        stockLevel: 45,
        reorderLevel: 50,
        isActive: true,
        createdAt: '2024-02-10',
        lastSold: '2024-09-29',
        totalSold: 890,
        revenue: 712000
      },
      {
        id: '3',
        sku: 'DRY003',
        name: 'Ariel Washing Powder 1kg',
        description: 'Premium laundry detergent powder',
        category: 'Household',
        categoryPath: 'Household > Cleaning > Laundry',
        brand: 'Ariel',
        unitPrice: 1200,
        costPrice: 900,
        margin: 25,
        weight: 1.0,
        dimensions: '30cm x 20cm x 8cm',
        barcode: '3456789012345',
        imageUrl: '/products/ariel-1kg.jpg',
        stockLevel: 15,
        reorderLevel: 25,
        isActive: true,
        createdAt: '2024-01-20',
        lastSold: '2024-09-28',
        totalSold: 320,
        revenue: 384000
      }
    ]

    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm)
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive)
    
    const matchesStock = filterStock === 'all' ||
                        (filterStock === 'low' && product.stockLevel <= product.reorderLevel) ||
                        (filterStock === 'normal' && product.stockLevel > product.reorderLevel)
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const getStockStatus = (product: Product) => {
    if (product.stockLevel <= product.reorderLevel) {
      return { status: 'Low Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      setProducts(products.filter(p => !selectedProducts.includes(p.id)))
      setSelectedProducts([])
    }
  }

  const columns = [
    {
      header: 'Product',
      accessorKey: 'product',
      cell: (product: Product) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">{product.sku}</div>
            <div className="text-xs text-gray-400">{product.categoryPath}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Brand & Barcode',
      accessorKey: 'brand',
      cell: (product: Product) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">{product.brand}</div>
          <div className="flex items-center text-xs text-gray-500">
            <Barcode className="w-3 h-3 mr-1" />
            {product.barcode}
          </div>
        </div>
      ),
    },
    {
      header: 'Pricing',
      accessorKey: 'pricing',
      cell: (product: Product) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(product.unitPrice)}
          </div>
          <div className="text-xs text-gray-500">
            Cost: {formatCurrency(product.costPrice)}
          </div>
          <div className="text-xs text-green-600">
            Margin: {product.margin}%
          </div>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      accessorKey: 'stock',
      cell: (product: Product) => {
        const stockInfo = getStockStatus(product)
        const Icon = stockInfo.icon
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">
              {product.stockLevel} units
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
              <Icon className="w-3 h-3 mr-1" />
              {stockInfo.status}
            </span>
            <div className="text-xs text-gray-500">
              Reorder: {product.reorderLevel}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Performance',
      accessorKey: 'performance',
      cell: (product: Product) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {product.totalSold} sold
          </div>
          <div className="text-sm text-green-600">
            {formatCurrency(product.revenue)}
          </div>
          <div className="text-xs text-gray-500">
            Last: {new Date(product.lastSold).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Specs',
      accessorKey: 'specs',
      cell: (product: Product) => (
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Weight className="w-3 h-3 mr-1" />
            {product.weight}kg
          </div>
          <div className="text-xs text-gray-500">
            {product.dimensions}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (product: Product) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          product.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (product: Product) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          {canEditIn('products') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteIn('products') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDelete(product.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          </div>
          <SkeletonTable rows={10} cols={8} />
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
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600">Manage your product inventory and pricing</p>
          </div>
          <div className="flex space-x-3">
            {canExportFrom('products') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            {canCreateIn('products') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stockLevel <= p.reorderLevel).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(products.reduce((sum, p) => sum + p.revenue, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Margin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(products.reduce((sum, p) => sum + p.margin, 0) / products.length)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products by name, SKU, brand, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Household">Household</option>
              </select>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="normal">Normal Stock</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none border-r-0"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedProducts.length} product(s) selected
              </span>
              <div className="flex space-x-2">
                {canDeleteIn('products') && (
                  <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button size="sm" variant="outline">
                  <Tag className="w-4 h-4 mr-2" />
                  Bulk Edit
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredProducts}
            columns={columns}
            selectedRows={selectedProducts}
            onSelectionChange={setSelectedProducts}
            searchable={false}
            pagination={true}
            pageSize={25}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}