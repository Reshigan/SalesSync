'use client'

import { useState } from 'react'
import { Product } from '@/services/products.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Package, DollarSign, BarChart3, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProductFormProps {
  initialData?: Product
  onSubmit: (data: Product) => Promise<void>
  onCancel: () => void
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Product>({
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    unitOfMeasure: 'PCS',
    basePrice: 0,
    costPrice: 0,
    wholesalePrice: 0,
    retailPrice: 0,
    taxRate: 0,
    barcode: '',
    weight: 0,
    volume: 0,
    reorderLevel: 0,
    maxStockLevel: 0,
    status: 'active',
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required'
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!formData.unitOfMeasure?.trim()) {
      newErrors.unitOfMeasure = 'Unit of measure is required'
    }
    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Base price must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      toast.success(initialData ? 'Product updated successfully' : 'Product created successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting product:', error)
      toast.error(error.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="e.g., PRD-001"
              error={errors.sku}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Coca Cola 500ml"
              error={errors.name}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Product description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Input
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="e.g., Beverages"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <Input
              value={formData.brand || ''}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="e.g., Coca Cola"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unitOfMeasure}
              onChange={(e) => handleChange('unitOfMeasure', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PCS">Pieces (PCS)</option>
              <option value="BOX">Box</option>
              <option value="CASE">Case</option>
              <option value="KG">Kilogram (KG)</option>
              <option value="LITER">Liter</option>
              <option value="PACK">Pack</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <Input
              value={formData.barcode || ''}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="e.g., 123456789012"
            />
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Pricing Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price (KES) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.basePrice}
              onChange={(e) => handleChange('basePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              error={errors.basePrice}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price (KES)
            </label>
            <Input
              type="number"
              value={formData.costPrice || 0}
              onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wholesale Price (KES)
            </label>
            <Input
              type="number"
              value={formData.wholesalePrice || 0}
              onChange={(e) => handleChange('wholesalePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Retail Price (KES)
            </label>
            <Input
              type="number"
              value={formData.retailPrice || 0}
              onChange={(e) => handleChange('retailPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <Input
              type="number"
              value={formData.taxRate}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Tag className="w-5 h-5 mr-2" />
          Physical Properties
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (KG)
            </label>
            <Input
              type="number"
              value={formData.weight || 0}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume (Liters)
            </label>
            <Input
              type="number"
              value={formData.volume || 0}
              onChange={(e) => handleChange('volume', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Inventory Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Inventory Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Level
            </label>
            <Input
              type="number"
              value={formData.reorderLevel || 0}
              onChange={(e) => handleChange('reorderLevel', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Stock Level
            </label>
            <Input
              type="number"
              value={formData.maxStockLevel || 0}
              onChange={(e) => handleChange('maxStockLevel', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum stock to maintain</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as Product['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
