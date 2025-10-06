'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Camera, Upload, X } from 'lucide-react'
import { ComprehensiveShelfAudit } from '@/types/merchandising'

interface ShelfAuditFormProps {
  initialData?: ComprehensiveShelfAudit
  onSubmit: (data: ComprehensiveShelfAudit) => Promise<void>
  onCancel: () => void
}

export function ShelfAuditForm({ initialData, onSubmit, onCancel }: ShelfAuditFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ComprehensiveShelfAudit>({
    storeId: '',
    agentId: '',
    auditDate: new Date().toISOString().split('T')[0],
    category: 'beverages',
    brand: '',
    photos: [],
    metrics: {
      totalFacings: 0,
      brandFacings: 0,
      shelfShare: 0,
      stockLevel: 'medium',
      planogramCompliance: 100,
      priceTagPresent: true,
      promoMaterialPresent: false
    },
    competitors: [],
    issues: [],
    ...initialData
  })
  const [newCompetitor, setNewCompetitor] = useState({ brand: '', facings: 0 })
  const [newIssue, setNewIssue] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.storeId) newErrors.storeId = 'Store is required'
    if (!formData.brand) newErrors.brand = 'Brand is required'
    if (formData.metrics.totalFacings <= 0) newErrors.totalFacings = 'Total facings must be greater than 0'
    if (formData.metrics.brandFacings > formData.metrics.totalFacings) {
      newErrors.brandFacings = 'Brand facings cannot exceed total facings'
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

    // Calculate shelf share
    const shelfShare = formData.metrics.totalFacings > 0
      ? Math.round((formData.metrics.brandFacings / formData.metrics.totalFacings) * 100)
      : 0
    
    const dataToSubmit = {
      ...formData,
      metrics: {
        ...formData.metrics,
        shelfShare
      }
    }

    setLoading(true)
    try {
      await onSubmit(dataToSubmit)
      toast.success(initialData ? 'Audit updated successfully' : 'Audit saved successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting audit:', error)
      toast.error(error.message || 'Failed to save audit')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ComprehensiveShelfAudit, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleMetricChange = (field: keyof ComprehensiveShelfAudit['metrics'], value: any) => {
    setFormData(prev => ({
      ...prev,
      metrics: { ...prev.metrics, [field]: value }
    }))
  }

  const addCompetitor = () => {
    if (!newCompetitor.brand || newCompetitor.facings <= 0) {
      toast.error('Enter competitor brand and facings')
      return
    }
    setFormData(prev => ({
      ...prev,
      competitors: [...prev.competitors, newCompetitor]
    }))
    setNewCompetitor({ brand: '', facings: 0 })
  }

  const removeCompetitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }))
  }

  const addIssue = () => {
    if (!newIssue.trim()) {
      toast.error('Enter issue description')
      return
    }
    setFormData(prev => ({
      ...prev,
      issues: [...prev.issues, newIssue]
    }))
    setNewIssue('')
  }

  const removeIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Audit Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store ID <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.storeId}
              onChange={(e) => handleChange('storeId', e.target.value)}
              placeholder="Store identifier"
              error={errors.storeId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audit Date</label>
            <Input
              type="date"
              value={formData.auditDate}
              onChange={(e) => handleChange('auditDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks</option>
              <option value="dairy">Dairy</option>
              <option value="personal-care">Personal Care</option>
              <option value="household">Household</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="Brand name"
              error={errors.brand}
            />
          </div>
        </div>
      </div>

      {/* Shelf Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Shelf Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Facings <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={formData.metrics.totalFacings}
              onChange={(e) => handleMetricChange('totalFacings', parseInt(e.target.value) || 0)}
              error={errors.totalFacings}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Facings <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={formData.metrics.brandFacings}
              onChange={(e) => handleMetricChange('brandFacings', parseInt(e.target.value) || 0)}
              error={errors.brandFacings}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
            <select
              value={formData.metrics.stockLevel}
              onChange={(e) => handleMetricChange('stockLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Full</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Planogram Compliance (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.metrics.planogramCompliance}
              onChange={(e) => handleMetricChange('planogramCompliance', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.metrics.priceTagPresent}
              onChange={(e) => handleMetricChange('priceTagPresent', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Price Tag Present</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.metrics.promoMaterialPresent}
              onChange={(e) => handleMetricChange('promoMaterialPresent', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Promo Material Present</span>
          </label>
        </div>
      </div>

      {/* Competitors */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Competitor Analysis</h3>
        
        <div className="flex gap-2">
          <Input
            placeholder="Competitor brand"
            value={newCompetitor.brand}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, brand: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Facings"
            value={newCompetitor.facings || ''}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, facings: parseInt(e.target.value) || 0 })}
            className="w-32"
          />
          <Button type="button" onClick={addCompetitor}>Add</Button>
        </div>

        {formData.competitors.length > 0 && (
          <div className="space-y-2">
            {formData.competitors.map((comp, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{comp.brand}: {comp.facings} facings</span>
                <button
                  type="button"
                  onClick={() => removeCompetitor(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issues */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Issues Found</h3>
        
        <div className="flex gap-2">
          <Input
            placeholder="Describe issue..."
            value={newIssue}
            onChange={(e) => setNewIssue(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={addIssue}>Add</Button>
        </div>

        {formData.issues.length > 0 && (
          <div className="space-y-2">
            {formData.issues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                <span className="text-sm text-red-800">{issue}</span>
                <button
                  type="button"
                  onClick={() => removeIssue(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any additional observations..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Audit' : 'Save Audit'}
        </Button>
      </div>
    </form>
  )
}
