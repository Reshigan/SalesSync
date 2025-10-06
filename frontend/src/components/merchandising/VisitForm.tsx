'use client'

import { useState } from 'react'
import { Visit } from '@/services/merchandising.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MapPin, Calendar, Clock, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface VisitFormProps {
  initialData?: Visit
  onSubmit: (data: Visit) => Promise<void>
  onCancel: () => void
}

export function VisitForm({ initialData, onSubmit, onCancel }: VisitFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Visit>({
    customerId: '',
    agentId: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'planned',
    purpose: '',
    status: 'scheduled',
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId?.trim()) {
      newErrors.customerId = 'Customer is required'
    }
    if (!formData.agentId?.trim()) {
      newErrors.agentId = 'Agent is required'
    }
    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required'
    }
    if (!formData.purpose?.trim()) {
      newErrors.purpose = 'Purpose is required'
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
      toast.success(initialData ? 'Visit updated successfully' : 'Visit created successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting visit:', error)
      toast.error(error.message || 'Failed to save visit')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Visit, value: any) => {
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
          <Calendar className="w-5 h-5 mr-2" />
          Visit Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.customerId}
              onChange={(e) => handleChange('customerId', e.target.value)}
              placeholder="Search customer..."
              error={errors.customerId}
            />
            <p className="text-xs text-gray-500 mt-1">Type to search customers</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent ID <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.agentId}
              onChange={(e) => handleChange('agentId', e.target.value)}
              placeholder="Select agent..."
              error={errors.agentId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visit Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.visitDate}
              onChange={(e) => handleChange('visitDate', e.target.value)}
              error={errors.visitDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visit Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.visitType}
              onChange={(e) => handleChange('visitType', e.target.value as Visit['visitType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planned">Planned</option>
              <option value="unplanned">Unplanned</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="e.g., Stock audit, Promotion setup, Customer follow-up"
              error={errors.purpose}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <Input
              type="number"
              value={formData.duration || ''}
              onChange={(e) => handleChange('duration', parseInt(e.target.value) || undefined)}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as Visit['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* GPS Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          GPS Location
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <Input
              type="number"
              value={formData.gpsLocation?.latitude || ''}
              onChange={(e) => handleChange('gpsLocation', {
                ...formData.gpsLocation,
                latitude: parseFloat(e.target.value) || 0
              })}
              placeholder="e.g., -1.286389"
              step="any"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <Input
              type="number"
              value={formData.gpsLocation?.longitude || ''}
              onChange={(e) => handleChange('gpsLocation', {
                latitude: formData.gpsLocation?.latitude || 0,
                longitude: parseFloat(e.target.value) || 0
              })}
              placeholder="e.g., 36.817223"
              step="any"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  handleChange('gpsLocation', {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  })
                  toast.success('Location captured successfully')
                },
                (error) => {
                  toast.error('Failed to get location: ' + error.message)
                }
              )
            } else {
              toast.error('Geolocation is not supported by your browser')
            }
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Get Current Location
        </Button>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Additional Notes
        </h3>
        
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Enter visit notes, observations, or follow-up actions..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          {loading ? 'Saving...' : initialData ? 'Update Visit' : 'Create Visit'}
        </Button>
      </div>
    </form>
  )
}
