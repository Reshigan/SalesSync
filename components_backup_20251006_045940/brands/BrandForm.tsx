'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Brand } from '@/services/brands.service'
import toast from 'react-hot-toast'

interface BrandFormProps {
  initialData?: Brand
  onSubmit: (data: Brand) => Promise<void>
  onCancel: () => void
}

export function BrandForm({ initialData, onSubmit, onCancel }: BrandFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Brand>({
    name: '',
    code: '',
    category: 'other',
    active: true,
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) newErrors.name = 'Brand name is required'
    if (!formData.code?.trim()) newErrors.code = 'Brand code is required'

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
      toast.success(initialData ? 'Brand updated successfully' : 'Brand created successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting brand:', error)
      toast.error(error.message || 'Failed to save brand')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Brand, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Safaricom, Airtel, Coca-Cola"
              error={errors.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., SAF, AIR, COKE"
              error={errors.code}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value as Brand['category'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="telecom">Telecom</option>
              <option value="fmcg">FMCG</option>
              <option value="beverage">Beverage</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <Input
              type="url"
              value={formData.logo || ''}
              onChange={(e) => handleChange('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the brand..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => handleChange('active', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Active Brand</span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Brand' : 'Create Brand'}
        </Button>
      </div>
    </form>
  )
}
