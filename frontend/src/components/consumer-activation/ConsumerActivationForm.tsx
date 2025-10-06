'use client'

import { useState } from 'react'
import { ConsumerActivation, KYCLite } from '@/services/consumer-activation.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Phone, MapPin, Camera, CreditCard, Gift, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConsumerActivationFormProps {
  initialData?: ConsumerActivation
  onSubmit: (data: ConsumerActivation) => Promise<void>
  onCancel: () => void
  agentBrands?: Array<{ id: string; name: string; permissions: any }>
}

export function ConsumerActivationForm({ initialData, onSubmit, onCancel, agentBrands = [] }: ConsumerActivationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ConsumerActivation>({
    agentId: '',
    brandId: '',
    activationType: 'sim_distribution',
    activationDate: new Date().toISOString().split('T')[0],
    location: '',
    kyc: {
      fullName: '',
      idType: 'national_id',
      idNumber: '',
      phoneNumber: ''
    },
    consumerConsent: false,
    marketingConsent: false,
    status: 'pending',
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedBrand = agentBrands.find(b => b.id === formData.brandId)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.agentId?.trim()) newErrors.agentId = 'Agent is required'
    if (!formData.brandId?.trim()) newErrors.brandId = 'Brand is required'
    if (!formData.location?.trim()) newErrors.location = 'Location is required'
    if (!formData.kyc.fullName?.trim()) newErrors.fullName = 'Consumer name is required'
    if (!formData.kyc.idNumber?.trim()) newErrors.idNumber = 'ID number is required'
    if (!formData.kyc.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required'
    if (!formData.consumerConsent) newErrors.consent = 'Consumer consent is required'

    // Validate based on activation type
    if (formData.activationType === 'sim_distribution' && !formData.simCard?.simNumber) {
      newErrors.simNumber = 'SIM number is required for SIM distribution'
    }
    if (formData.activationType === 'voucher_distribution' && !formData.voucher?.voucherCode) {
      newErrors.voucherCode = 'Voucher code is required for voucher distribution'
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
      toast.success('Consumer activation recorded successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting activation:', error)
      toast.error(error.message || 'Failed to save activation')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('kyc.')) {
      const kycField = field.replace('kyc.', '')
      setFormData(prev => ({
        ...prev,
        kyc: { ...prev.kyc, [kycField]: value }
      }))
    } else if (field.startsWith('simCard.')) {
      const simField = field.replace('simCard.', '')
      setFormData(prev => ({
        ...prev,
        simCard: { ...prev.simCard, [simField]: value } as any
      }))
    } else if (field.startsWith('voucher.')) {
      const voucherField = field.replace('voucher.', '')
      setFormData(prev => ({
        ...prev,
        voucher: { ...prev.voucher, [voucherField]: value } as any
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Activation Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Activation Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.brandId}
              onChange={(e) => handleChange('brandId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Brand</option>
              {agentBrands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            {errors.brandId && <p className="text-xs text-red-500 mt-1">{errors.brandId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activation Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.activationType}
              onChange={(e) => handleChange('activationType', e.target.value as ConsumerActivation['activationType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sim_distribution">SIM Distribution</option>
              <option value="voucher_distribution">Voucher Distribution</option>
              <option value="survey">Survey Only</option>
              <option value="registration">Registration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activation Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.activationDate}
              onChange={(e) => handleChange('activationDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Nairobi CBD, outside ABC Shop"
              error={errors.location}
            />
          </div>
        </div>
      </div>

      {/* KYC Lite Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Consumer KYC Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.kyc.fullName}
              onChange={(e) => handleChange('kyc.fullName', e.target.value)}
              placeholder="John Doe"
              error={errors.fullName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.kyc.phoneNumber}
              onChange={(e) => handleChange('kyc.phoneNumber', e.target.value)}
              placeholder="+254712345678"
              error={errors.phoneNumber}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.kyc.idType}
              onChange={(e) => handleChange('kyc.idType', e.target.value as KYCLite['idType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="voter_id">Voter ID</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.kyc.idNumber}
              onChange={(e) => handleChange('kyc.idNumber', e.target.value)}
              placeholder="12345678"
              error={errors.idNumber}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={formData.kyc.gender || ''}
              onChange={(e) => handleChange('kyc.gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <Input
              type="date"
              value={formData.kyc.dateOfBirth || ''}
              onChange={(e) => handleChange('kyc.dateOfBirth', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <Input
              value={formData.kyc.address || ''}
              onChange={(e) => handleChange('kyc.address', e.target.value)}
              placeholder="Street address or landmark"
            />
          </div>
        </div>
      </div>

      {/* SIM Distribution Details */}
      {formData.activationType === 'sim_distribution' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            SIM Card Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SIM Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.simCard?.simNumber || ''}
                onChange={(e) => handleChange('simCard.simNumber', e.target.value)}
                placeholder="89254..."
                error={errors.simNumber}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.simCard?.mobileNumber || ''}
                onChange={(e) => handleChange('simCard.mobileNumber', e.target.value)}
                placeholder="+254712345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carrier <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.simCard?.carrier || ''}
                onChange={(e) => handleChange('simCard.carrier', e.target.value)}
                placeholder="e.g., Safaricom"
              />
            </div>
          </div>
        </div>
      )}

      {/* Voucher Distribution Details */}
      {formData.activationType === 'voucher_distribution' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            Voucher Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.voucher?.voucherCode || ''}
                onChange={(e) => handleChange('voucher.voucherCode', e.target.value)}
                placeholder="VOUCHER123"
                error={errors.voucherCode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Type
              </label>
              <Input
                value={formData.voucher?.type || ''}
                onChange={(e) => handleChange('voucher.type', e.target.value)}
                placeholder="e.g., Airtime"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <Input
                type="number"
                value={formData.voucher?.value || ''}
                onChange={(e) => handleChange('voucher.value', parseFloat(e.target.value))}
                placeholder="100"
              />
            </div>
          </div>
        </div>
      )}

      {/* GPS Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          GPS Location (Optional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              type="number"
              value={formData.gpsLocation?.latitude || ''}
              onChange={(e) => handleChange('gpsLocation', {
                ...formData.gpsLocation,
                latitude: parseFloat(e.target.value) || 0,
                longitude: formData.gpsLocation?.longitude || 0
              })}
              step="any"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              type="number"
              value={formData.gpsLocation?.longitude || ''}
              onChange={(e) => handleChange('gpsLocation', {
                latitude: formData.gpsLocation?.latitude || 0,
                longitude: parseFloat(e.target.value) || 0
              })}
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
                  toast.success('Location captured')
                },
                () => toast.error('Failed to get location')
              )
            }
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Capture Current Location
        </Button>
      </div>

      {/* Consent */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Consent</h3>
        
        <div className="space-y-3">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.consumerConsent}
              onChange={(e) => handleChange('consumerConsent', e.target.checked)}
              className="mt-1 mr-3"
            />
            <span className="text-sm text-gray-700">
              Consumer has provided consent for data collection and processing <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consent && <p className="text-xs text-red-500">{errors.consent}</p>}

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.marketingConsent}
              onChange={(e) => handleChange('marketingConsent', e.target.checked)}
              className="mt-1 mr-3"
            />
            <span className="text-sm text-gray-700">
              Consumer has consented to receive marketing communications
            </span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes or observations..."
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
          {loading ? 'Saving...' : initialData ? 'Update Activation' : 'Record Activation'}
        </Button>
      </div>
    </form>
  )
}
