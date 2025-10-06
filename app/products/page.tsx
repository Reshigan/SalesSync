'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, RefreshCw, Tag, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { apiClient, handleApiError, handleApiSuccess } from '@/lib/api-client'
import Link from 'next/link'

interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  brand?: string
  unitPrice: number
  costPrice?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  priceHistories?: PriceHistory[]
  inventories?: Inventory[]
}

interface PriceHistory {
  id: string
  price: number
  reason?: string
  createdAt: string
}

interface Inventory {
  currentStock: number
  minStock: number
  maxStock: number
  location: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBrands()
  }, [pagination.page, pagination.limit, searchTerm, category, brand, isActive])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        category: category || undefined,
        brand: brand || undefined,
        isActive: isActive
      })

      setProducts(response.products || [])
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getProductCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await apiClient.getProductBrands()
      setBrands(response.brands || [])
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    }
  }

  const handleCreateProduct = async (productData: Partial<Product>) => {
    try {
      setSubmitting(true)
      const response = await apiClient.createProduct(productData)
      handleApiSuccess(response.message || 'Product created successfully')
      setShowCreateModal(false)
      fetchProducts()
      fetchCategories()
      fetchBrands()
    } catch (error) {
      handleApiError(error, 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = async (productData: Partial<Product>) => {
    if (!selectedProduct) return
    
    try {
      setSubmitting(true)
      const response = await apiClient.updateProduct(selectedProduct.id, productData)
      handleApiSuccess(response.message || 'Product updated successfully')
      setShowEditModal(false)
      setSelectedProduct(null)
      fetchProducts()
      fetchCategories()
      fetchBrands()
    } catch (error) {
      handleApiError(error, 'Failed to update product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await apiClient.deleteProduct(productId)
      handleApiSuccess(response.message || 'Product deleted successfully')
      fetchProducts()
    } catch (error) {
      handleApiError(error, 'Failed to delete product')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (type: string, value: string | boolean | undefined) => {
    if (type === 'category') {
      setCategory(value as string)
    } else if (type === 'brand') {
      setBrand(value as string)
    } else if (type === 'isActive') {
      setIsActive(value as boolean | undefined)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (product: Product) => (
        <div className="font-mono text-sm">{product.sku}</div>
      )
    },
    {
      key: 'name',
      label: 'Product',
      render: (product: Product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-sm text-gray-500">{product.category}</div>
        </div>
      )
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (product: Product) => (
        <div className="flex items-center gap-1 text-sm">
          <Tag className="h-3 w-3 text-gray-400" />
          <span>{product.brand || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-gray-400" />
          <span className="font-medium">${product.unitPrice.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (product: Product) => {
        const totalStock = product.inventories?.reduce((sum, inv) => sum + inv.currentStock, 0) || 0
        const minStock = product.inventories?.[0]?.minStock || 0
        const isLowStock = totalStock <= minStock
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
              {totalStock}
            </span>
            {isLowStock && (
              <Badge variant="error" size="sm">Low</Badge>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: Product) => (
        <Badge variant={product.isActive ? 'success' : 'error'}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Link href={`/products/${product.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProduct(product)
              setShowEditModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(product.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const activeProducts = products.filter(p => p.isActive).length
  const lowStockProducts = products.filter(p => {
    const totalStock = p.inventories?.reduce((sum, inv) => sum + inv.currentStock, 0) || 0
    const minStock = p.inventories?.[0]?.minStock || 0
    return totalStock <= minStock
  }).length
  const totalValue = products.reduce((sum, p) => {
    const stock = p.inventories?.reduce((s, inv) => s + inv.currentStock, 0) || 0
    return sum + (stock * p.unitPrice)
  }, 0)

  if (loading && products.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{lowStockProducts}</p>
            </div>
            <Badge variant="error">Low Stock</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <Badge variant="warning">Value</Badge>
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
            value={category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Brands</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={isActive === undefined ? '' : isActive.toString()}
            onChange={(e) => {
              const value = e.target.value
              handleFilterChange('isActive', value === '' ? undefined : value === 'true')
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Products ({pagination.total})
            </h3>
            {loading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
        </div>
        
        <SimpleTable
          data={products}
          columns={columns}
          emptyMessage="No products found"
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

      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Product"
      >
        <ProductForm
          onSubmit={handleCreateProduct}
          onCancel={() => setShowCreateModal(false)}
          submitting={submitting}
          categories={categories}
          brands={brands}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedProduct(null)
        }}
        title="Edit Product"
      >
        <ProductForm
          product={selectedProduct}
          onSubmit={handleEditProduct}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedProduct(null)
          }}
          submitting={submitting}
          categories={categories}
          brands={brands}
        />
      </Modal>
    </div>
  )
}

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: Partial<Product>) => void
  onCancel: () => void
  submitting?: boolean
  categories: string[]
  brands: string[]
}

function ProductForm({ product, onSubmit, onCancel, submitting = false, categories, brands }: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    brand: product?.brand || '',
    unitPrice: product?.unitPrice || 0,
    costPrice: product?.costPrice || 0,
    isActive: product?.isActive ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (formData.unitPrice <= 0) {
      newErrors.unitPrice = 'Unit price must be greater than 0'
    }
    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative'
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU *
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.sku ? 'border-red-300' : 'border-gray-300'
            }`}
            required
            disabled={submitting}
          />
          {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            required
            disabled={submitting}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            list="categories"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
          <datalist id="categories">
            {categories.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            list="brands"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
          <datalist id="brands">
            {brands.map(brand => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Price *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.unitPrice ? 'border-red-300' : 'border-gray-300'
            }`}
            min="0"
            disabled={submitting}
          />
          {errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Price
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.costPrice ? 'border-red-300' : 'border-gray-300'
            }`}
            min="0"
            disabled={submitting}
          />
          {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={submitting}
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {product ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {product ? 'Update' : 'Create'} Product
            </>
          )}
        </Button>
      </div>
    </form>
  )
}