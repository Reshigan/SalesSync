'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, FolderTree } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'

interface ProductCategory {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
  parentId?: string
  parent?: ProductCategory
  children?: ProductCategory[]
  createdAt: string
  updatedAt: string
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Mock data for development
  const mockCategories: ProductCategory[] = [
    {
      id: '1',
      code: 'BEV',
      name: 'Beverages',
      description: 'All beverage products',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      children: [
        {
          id: '2',
          code: 'BEV-SOFT',
          name: 'Soft Drinks',
          description: 'Carbonated and non-carbonated soft drinks',
          isActive: true,
          parentId: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          code: 'BEV-JUICE',
          name: 'Juices',
          description: 'Fruit and vegetable juices',
          isActive: true,
          parentId: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
    },
    {
      id: '4',
      code: 'SNACKS',
      name: 'Snacks',
      description: 'Snack products',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      children: [
        {
          id: '5',
          code: 'SNACKS-CHIPS',
          name: 'Chips',
          description: 'Potato and corn chips',
          isActive: true,
          parentId: '4',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
    },
    {
      id: '6',
      code: 'DAIRY',
      name: 'Dairy Products',
      description: 'Milk and dairy products',
      isActive: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/product-categories')
      // const data = await response.json()
      
      // Using mock data for now
      setTimeout(() => {
        setCategories(mockCategories)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(mockCategories)
      setLoading(false)
    }
  }

  const handleCreateCategory = async (categoryData: Partial<ProductCategory>) => {
    try {
      // TODO: Replace with actual API call
      console.log('Creating category:', categoryData)
      setShowCreateModal(false)
      fetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const handleEditCategory = async (categoryData: Partial<ProductCategory>) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating category:', categoryData)
      setShowEditModal(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        // TODO: Replace with actual API call
        console.log('Deleting category:', categoryId)
        fetchCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (category: ProductCategory) => (
        <div className="font-mono text-sm">{category.code}</div>
      )
    },
    {
      key: 'name',
      label: 'Name',
      render: (category: ProductCategory) => (
        <div className="flex items-center gap-2">
          {category.parentId && <span className="text-gray-400">└─</span>}
          <span className="font-medium">{category.name}</span>
          {category.children && category.children.length > 0 && (
            <FolderTree className="h-4 w-4 text-blue-500" />
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (category: ProductCategory) => (
        <span className="text-gray-600">{category.description || '-'}</span>
      )
    },
    {
      key: 'parent',
      label: 'Parent Category',
      render: (category: ProductCategory) => (
        <span className="text-sm text-gray-500">
          {category.parent?.name || '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (category: ProductCategory) => (
        <Badge variant={category.isActive ? 'success' : 'error'}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (category: ProductCategory) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory(category)
              setShowEditModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCategory(category.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-gray-600">Manage product category hierarchy</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Categories Table */}
      <Card>
        <SimpleTable
          data={filteredCategories}
          columns={columns}
          emptyMessage="No categories found"
        />
      </Card>

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Product Category"
      >
        <CategoryForm
          onSubmit={handleCreateCategory}
          onCancel={() => setShowCreateModal(false)}
          categories={categories}
        />
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedCategory(null)
        }}
        title="Edit Product Category"
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={handleEditCategory}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedCategory(null)
          }}
          categories={categories}
        />
      </Modal>
    </div>
  )
}

interface CategoryFormProps {
  category?: ProductCategory | null
  onSubmit: (data: Partial<ProductCategory>) => void
  onCancel: () => void
  categories: ProductCategory[]
}

function CategoryForm({ category, onSubmit, onCancel, categories }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    code: category?.code || '',
    name: category?.name || '',
    description: category?.description || '',
    parentId: category?.parentId || '',
    isActive: category?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const parentCategories = categories.filter(cat => !cat.parentId && cat.id !== category?.id)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Code *
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
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
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Category
        </label>
        <select
          value={formData.parentId}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No Parent (Root Category)</option>
          {parentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {category ? 'Update' : 'Create'} Category
        </Button>
      </div>
    </form>
  )
}