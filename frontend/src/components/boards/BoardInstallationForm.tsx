'use client'

import { useState, useRef } from 'react'
import { Board } from '@/services/field-agents.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Camera, MapPin, Image as ImageIcon, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface BoardInstallationFormProps {
  initialData?: Board
  onSubmit: (data: Board, proofPhotoFile?: File, wideAnglePhotoFile?: File) => Promise<void>
  onCancel: () => void
  agentBrands?: Array<{ id: string; name: string }>
}

export function BoardInstallationForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  agentBrands = []
}: BoardInstallationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Board>({
    boardNumber: '',
    brandId: '',
    type: 'promotional',
    size: '',
    location: '',
    agentId: '',
    installationDate: new Date().toISOString().split('T')[0],
    gpsLocation: { latitude: 0, longitude: 0 },
    proofPhoto: '',
    wideAnglePhoto: '',
    condition: 'excellent',
    maintenanceRequired: false,
    status: 'active',
    ...initialData
  })

  const [proofPhotoPreview, setProofPhotoPreview] = useState<string>(initialData?.proofPhoto || '')
  const [wideAnglePhotoPreview, setWideAnglePhotoPreview] = useState<string>(initialData?.wideAnglePhoto || '')
  const [proofPhotoFile, setProofPhotoFile] = useState<File | null>(null)
  const [wideAnglePhotoFile, setWideAnglePhotoFile] = useState<File | null>(null)
  
  const [competitorCount, setCompetitorCount] = useState(
    formData.competitiveAnalysis?.competitorBoards?.length || 0
  )
  const [competitors, setCompetitors] = useState(
    formData.competitiveAnalysis?.competitorBoards || []
  )

  const proofPhotoInputRef = useRef<HTMLInputElement>(null)
  const wideAnglePhotoInputRef = useRef<HTMLInputElement>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.boardNumber?.trim()) newErrors.boardNumber = 'Board number is required'
    if (!formData.brandId) newErrors.brandId = 'Brand is required'
    if (!formData.size?.trim()) newErrors.size = 'Size is required'
    if (!formData.location?.trim()) newErrors.location = 'Location is required'
    if (!formData.agentId?.trim()) newErrors.agentId = 'Agent is required'
    if (!formData.gpsLocation || formData.gpsLocation.latitude === 0) {
      newErrors.gpsLocation = 'GPS location is required'
    }
    
    // Photo validation
    if (!initialData && !proofPhotoFile) {
      newErrors.proofPhoto = 'Installation proof photo is required'
    }
    if (!initialData && !wideAnglePhotoFile) {
      newErrors.wideAnglePhoto = 'Wide angle photo is required'
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
      await onSubmit(formData, proofPhotoFile || undefined, wideAnglePhotoFile || undefined)
      toast.success(initialData ? 'Board updated successfully' : 'Board installed successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting board:', error)
      toast.error(error.message || 'Failed to save board')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Board, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePhotoChange = (type: 'proof' | 'wideAngle', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size should be less than 10MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'proof') {
          setProofPhotoPreview(reader.result as string)
          setProofPhotoFile(file)
          setErrors(prev => ({ ...prev, proofPhoto: '' }))
        } else {
          setWideAnglePhotoPreview(reader.result as string)
          setWideAnglePhotoFile(file)
          setErrors(prev => ({ ...prev, wideAnglePhoto: '' }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const captureGPS = () => {
    if (navigator.geolocation) {
      toast.loading('Capturing GPS location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleChange('gpsLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setErrors(prev => ({ ...prev, gpsLocation: '' }))
          toast.dismiss()
          toast.success('GPS location captured successfully')
        },
        (error) => {
          toast.dismiss()
          toast.error('Failed to get GPS location: ' + error.message)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      toast.error('Geolocation is not supported by your browser')
    }
  }

  const addCompetitor = () => {
    setCompetitors([...competitors, { brandName: '', count: 1 }])
    setCompetitorCount(competitorCount + 1)
  }

  const updateCompetitor = (index: number, field: 'brandName' | 'count', value: string | number) => {
    const updated = [...competitors]
    updated[index] = { ...updated[index], [field]: value }
    setCompetitors(updated)
    
    // Calculate share of voice
    const totalCompetitorCount = updated.reduce((sum, c) => sum + (c.count || 0), 0)
    const ourCount = formData.competitiveAnalysis?.ourBrandCount || 1
    const total = totalCompetitorCount + ourCount
    const shareOfVoice = (ourCount / total) * 100

    handleChange('competitiveAnalysis', {
      totalBoardsVisible: total,
      ourBrandCount: ourCount,
      competitorBoards: updated,
      shareOfVoice: Math.round(shareOfVoice * 10) / 10,
      analysisMethod: 'manual' as const
    })
  }

  const removeCompetitor = (index: number) => {
    const updated = competitors.filter((_, i) => i !== index)
    setCompetitors(updated)
    setCompetitorCount(updated.length)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Board Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Board Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Board Number <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.boardNumber}
              onChange={(e) => handleChange('boardNumber', e.target.value)}
              placeholder="e.g., BRD-001"
              error={errors.boardNumber}
            />
          </div>

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
              Board Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as Board['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="promotional">Promotional</option>
              <option value="informational">Informational</option>
              <option value="directional">Directional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.size}
              onChange={(e) => handleChange('size', e.target.value)}
              placeholder="e.g., 4x6 feet, 2x3 meters"
              error={errors.size}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Outside ABC Shop, Main Street"
              error={errors.location}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Date
            </label>
            <Input
              type="date"
              value={formData.installationDate}
              onChange={(e) => handleChange('installationDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Cost
            </label>
            <Input
              type="number"
              value={formData.monthlyCost || ''}
              onChange={(e) => handleChange('monthlyCost', parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* GPS Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          GPS Location <span className="text-red-500 ml-1">*</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              type="number"
              value={formData.gpsLocation.latitude}
              onChange={(e) => handleChange('gpsLocation', {
                ...formData.gpsLocation,
                latitude: parseFloat(e.target.value) || 0
              })}
              step="any"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              type="number"
              value={formData.gpsLocation.longitude}
              onChange={(e) => handleChange('gpsLocation', {
                ...formData.gpsLocation,
                longitude: parseFloat(e.target.value) || 0
              })}
              step="any"
              readOnly
            />
          </div>

          <div className="flex items-end">
            <Button type="button" onClick={captureGPS} className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Capture GPS
            </Button>
          </div>
        </div>
        {errors.gpsLocation && <p className="text-xs text-red-500">{errors.gpsLocation}</p>}
      </div>

      {/* Installation Photos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Installation Photos <span className="text-red-500 ml-1">*</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Proof Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo 1: Installation Proof <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Close-up photo of the board being installed</p>
            
            <div 
              onClick={() => proofPhotoInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {proofPhotoPreview ? (
                <img src={proofPhotoPreview} alt="Proof" className="w-full h-48 object-cover rounded" />
              ) : (
                <div className="flex flex-col items-center py-8">
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to take/upload photo</p>
                </div>
              )}
            </div>
            <input
              ref={proofPhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoChange('proof', e)}
              className="hidden"
            />
            {errors.proofPhoto && <p className="text-xs text-red-500 mt-1">{errors.proofPhoto}</p>}
          </div>

          {/* Wide Angle Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo 2: Wide Angle <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Show all boards on the wall for competitive analysis</p>
            
            <div 
              onClick={() => wideAnglePhotoInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {wideAnglePhotoPreview ? (
                <img src={wideAnglePhotoPreview} alt="Wide Angle" className="w-full h-48 object-cover rounded" />
              ) : (
                <div className="flex flex-col items-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to take/upload photo</p>
                </div>
              )}
            </div>
            <input
              ref={wideAnglePhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoChange('wideAngle', e)}
              className="hidden"
            />
            {errors.wideAnglePhoto && <p className="text-xs text-red-500 mt-1">{errors.wideAnglePhoto}</p>}
          </div>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Competitive Analysis (Optional)
        </h3>
        <p className="text-sm text-gray-600">Based on the wide-angle photo, record competitor boards visible</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Our Brand Boards Count
              </label>
              <Input
                type="number"
                value={formData.competitiveAnalysis?.ourBrandCount || 1}
                onChange={(e) => {
                  const ourCount = parseInt(e.target.value) || 1
                  const totalCompetitorCount = competitors.reduce((sum, c) => sum + (c.count || 0), 0)
                  const total = totalCompetitorCount + ourCount
                  const shareOfVoice = (ourCount / total) * 100
                  
                  handleChange('competitiveAnalysis', {
                    ...formData.competitiveAnalysis,
                    totalBoardsVisible: total,
                    ourBrandCount: ourCount,
                    competitorBoards: competitors,
                    shareOfVoice: Math.round(shareOfVoice * 10) / 10,
                    analysisMethod: 'manual' as const
                  })
                }}
                min="1"
              />
            </div>
            <Button type="button" onClick={addCompetitor} variant="outline">
              Add Competitor
            </Button>
          </div>

          {competitors.map((competitor, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Input
                placeholder="Competitor brand name"
                value={competitor.brandName}
                onChange={(e) => updateCompetitor(index, 'brandName', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Count"
                value={competitor.count}
                onChange={(e) => updateCompetitor(index, 'count', parseInt(e.target.value) || 1)}
                className="w-24"
                min="1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeCompetitor(index)}
              >
                Remove
              </Button>
            </div>
          ))}

          {formData.competitiveAnalysis && formData.competitiveAnalysis.totalBoardsVisible > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Share of Voice</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formData.competitiveAnalysis.shareOfVoice}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Our Boards: {formData.competitiveAnalysis.ourBrandCount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Visible: {formData.competitiveAnalysis.totalBoardsVisible}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Board' : 'Install Board'}
        </Button>
      </div>
    </form>
  )
}
