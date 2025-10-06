'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  BarChart3,
  Download,
  Upload,
  Grid,
  List,
  SortAsc,
  SortDesc,
  MoreHorizontal
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  category: string
  price: number
  cost: number
  stock: number
  minStock: number
  status: 'active' | 'inactive' | 'discontinued'
  image?: string
  createdAt: string
  updatedAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const categories = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books']
  const statuses = ['active', 'inactive', 'discontinued']

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Wireless Headphones',
          sku: 'PWH-001',
          description: 'High-quality wireless headphones with noise cancellation',
          category: 'Electronics',
          price: 15999,
          cost: 8000,
          stock: 45,
          minStock: 10,
          status: 'active',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-06',
        },
        {
          id: '2',
          name: 'Organic Coffee Beans',
          sku: 'OCB-002',
          description: 'Premium organic coffee beans from Ethiopia',
          category: 'Food & Beverage',
          price: 2499,
          cost: 1200,
          stock: 120,
          minStock: 20,
          status: 'active',
          createdAt: '2025-01-02',
          updatedAt: '2025-01-05',
        },
        {
          id: '3',
          name: 'Cotton T-Shirt',
          sku: 'CTS-003',
          description: '100% cotton comfortable t-shirt',
          category: 'Clothing',
          price: 1999,
          cost: 800,
          stock: 5,
          minStock: 15,
          status: 'active',
          createdAt: '2025-01-03',
          updatedAt: '2025-01-04',
        },
        {
          id: '4',
          name: 'Smart Watch',
          sku: 'SW-004',
          description: 'Advanced smartwatch with health monitoring',
          category: 'Electronics',
          price: 25999,
          cost: 15000,
          stock: 0,
          minStock: 5,
          status: 'inactive',
          createdAt: '2025-01-04',
          updatedAt: '2025-01-03',
        },
        {
          id: '5',
          name: 'Yoga Mat',
          sku: 'YM-005',
          description: 'Non-slip yoga mat for all fitness levels',
          category: 'Sports',
          price: 3999,
          cost: 2000,
          stock: 30,
          minStock: 10,
          status: 'active',
          createdAt: '2025-01-05',
          updatedAt: '2025-01-02',
        },
      ]
      
      setProducts(mockProducts)
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof Product]
    const bValue = b[sortBy as keyof Product]
    
    if (!aValue || !bValue) return 0
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleCreateProduct = () => {
    toast.success('Create product functionality coming soon!')
  }

  const handleEditProduct = (productId: string) => {
    toast.success(`Edit product ${productId} functionality coming soon!`)
  }

  const handleDeleteProduct = (productId: string) => {
    toast.success(`Delete product ${productId} functionality coming soon!`)
  }

  const handleBulkAction = (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first')
      return
    }
    toast.success(`${action} ${selectedProducts.length} products functionality coming soon!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-yellow-100 text-yellow-800'
      case 'discontinued': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (stock <= minStock) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">
              Manage your product catalog and inventory
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Export')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Import')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={handleCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-600 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.stock <= p.minStock).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-600 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name, SKU, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="stock-asc">Stock Low-High</option>
                  <option value="stock-desc">Stock High-Low</option>
                </select>

                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedProducts.length} products selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Activate')}
                  >
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Deactivate')}
                  >
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleBulkAction('Delete')}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products List/Grid */}
        <Card>
          <CardContent className="p-0">
            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === filteredProducts.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(filteredProducts.map(p => p.id))
                            } else {
                              setSelectedProducts([])
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Product</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">SKU</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Price</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Stock</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock, product.minStock)
                      return (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([...selectedProducts, product.id])
                                } else {
                                  setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {product.description}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-sm">{product.sku}</td>
                          <td className="py-4 px-6 text-gray-900">{product.category}</td>
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{product.stock}</span>
                              <Badge className={stockStatus.color}>
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusColor(product.status)}>
                              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditProduct(product.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock)
                  return (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product.id])
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </div>
                        
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 truncate">{product.description}</p>
                        <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          <Badge className={stockStatus.color}>
                            {product.stock} in stock
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first product'
                  }
                </p>
                <Button onClick={handleCreateProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}