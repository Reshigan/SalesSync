'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ProductForm } from '@/components/products/ProductForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { productsService, Product } from '@/services/products.service'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  BarChart3,
  RefreshCw,
  Filter,
  Tag
} from 'lucide-react'

export default function ProductsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  // Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.reorderLevel && p.reorderLevel > 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.basePrice * (p.reorderLevel || 0)), 0),
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.basePrice, 0) / products.length : 0
  }

  useEffect(() => {
    loadProducts()
  }, [filterCategory, filterStatus])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterCategory !== 'all') filters.category = filterCategory
      if (filterStatus !== 'all') filters.status = filterStatus
      if (searchTerm) filters.search = searchTerm
      
      const response = await productsService.getAll(filters)
      setProducts(response.products || [])
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error(error.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadProducts()
  }

  const handleCreateProduct = async (data: Product) => {
    try {
      await productsService.create(data)
      toast.success('Product created successfully')
      setShowCreateModal(false)
      loadProducts()
    } catch (error: any) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  const handleEditProduct = async (data: Product) => {
    if (!editingProduct?.id) return
    
    try {
      await productsService.update(editingProduct.id, data)
      toast.success('Product updated successfully')
      setShowEditModal(false)
      setEditingProduct(null)
      loadProducts()
    } catch (error: any) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await productsService.delete(id)
      toast.success('Product deleted successfully')
      loadProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Failed to delete product')
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  const getStatusBadge = (status: Product['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      discontinued: 'bg-red-100 text-red-800'
    }
    return (<ErrorBoundary>

      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    
</ErrorBoundary>)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold">KES {stats.totalValue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-xl font-bold">KES {stats.avgPrice.toFixed(0)}</p>
              </div>
              <Tag className="w-8 h-8 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU / Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading products...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Package className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No products found</p>
                        <p className="text-sm">Get started by creating your first product</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          {product.brand && (
                            <span className="text-xs text-gray-500">{product.brand}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{product.sku}</span>
                          {product.barcode && (
                            <span className="text-xs text-gray-500">{product.barcode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{product.category || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            KES {product.basePrice.toLocaleString()}
                          </span>
                          {product.retailPrice && product.retailPrice > 0 && (
                            <span className="text-xs text-gray-500">
                              Retail: KES {product.retailPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {product.reorderLevel && product.reorderLevel > 0 ? (
                            <>
                              <span className="text-sm text-gray-900">Reorder: {product.reorderLevel}</span>
                              {product.maxStockLevel && product.maxStockLevel > 0 && (
                                <span className="text-xs text-gray-500">Max: {product.maxStockLevel}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Not set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => product.id && handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        title="Create New Product"
        onClose={() => setShowCreateModal(false)}
      >
        <ProductForm
          onSubmit={handleCreateProduct}
          onCancel={() => setShowCreateModal(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Product"
        onClose={() => {
          setShowEditModal(false)
          setEditingProduct(null)
        }}
      >
        {editingProduct && (
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleEditProduct}
            onCancel={() => {
              setShowEditModal(false)
              setEditingProduct(null)
            }}
          />
        )}
      </FormModal>
    </DashboardLayout>
  )
}
