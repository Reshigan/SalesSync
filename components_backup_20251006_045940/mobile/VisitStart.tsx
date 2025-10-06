'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { visitWorkflowService, VisitValidation } from '@/services/visit-workflow.service'
import toast from 'react-hot-toast'
import { 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  UserPlus,
  Navigation,
  Info,
  Clock,
  FileText
} from 'lucide-react'

interface VisitStartProps {
  agentId: string
  agentType: string
  onVisitStarted: (visitData: any) => void
}

export function VisitStart({ agentId, agentType, onVisitStarted }: VisitStartProps) {
  const [step, setStep] = useState<'type' | 'customer' | 'validation'>('type')
  const [visitType, setVisitType] = useState<'new_customer' | 'existing_customer' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [gpsError, setGpsError] = useState<string>('')
  const [validation, setValidation] = useState<VisitValidation | null>(null)
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('❌ GPS not available on this device')
      toast.error('GPS not supported by your browser')
      return
    }

    setGettingLocation(true)
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setGettingLocation(false)
        toast.success('✅ Location obtained')
      },
      (error) => {
        let errorMsg = ''
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '❌ Location permission denied. Please enable location services in your phone settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = '❌ Location unavailable. Please check if GPS is enabled on your phone.'
            break
          case error.TIMEOUT:
            errorMsg = '❌ Location request timed out. Please try again.'
            break
          default:
            errorMsg = '❌ Unable to get location. Please try again.'
        }
        setGpsError(errorMsg)
        setGettingLocation(false)
        toast.error(errorMsg)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleVisitTypeSelect = (type: 'new_customer' | 'existing_customer') => {
    if (!gpsLocation) {
      toast.error('⚠️ Please wait for GPS location first')
      return
    }
    setVisitType(type)
    setStep('customer')
  }

  const handleSearchCustomer = async () => {
    if (!searchQuery.trim()) {
      toast.error('⚠️ Please enter customer name or phone number')
      return
    }

    setLoading(true)
    try {
      // Mock search - replace with actual API call
      const results = [
        { id: '1', name: 'Shop A', phone: '+254712345678', lastVisit: '2024-01-15' },
        { id: '2', name: 'Shop B', phone: '+254712345679', lastVisit: '2024-01-20' }
      ]
      setSearchResults(results)
      if (results.length === 0) {
        toast.error('❌ No customers found. Create a new customer instead.')
      }
    } catch (error: any) {
      toast.error('❌ Search failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = async (customer: any) => {
    setSelectedCustomer(customer)
    setSearchResults([])
    await validateVisit(customer.id)
  }

  const validateVisit = async (customerId: string) => {
    if (!gpsLocation) {
      toast.error('❌ GPS location required')
      return
    }

    setLoading(true)
    try {
      const validationResult = await visitWorkflowService.initiateVisit({
        visitType: 'existing_customer',
        customerId,
        currentLocation: gpsLocation,
        agentId,
        agentType
      })

      setValidation(validationResult)
      setStep('validation')

      if (validationResult.skipSurveys) {
        toast.success('✅ ' + validationResult.message)
      } else if (validationResult.locationMatch) {
        toast.success('✅ ' + validationResult.message, { duration: 5000 })
      } else {
        toast.error('⚠️ ' + validationResult.message, { duration: 5000 })
      }
    } catch (error: any) {
      toast.error('❌ Validation failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNewCustomerStart = () => {
    if (!gpsLocation) {
      toast.error('❌ GPS location required')
      return
    }

    setLoading(true)
    try {
      const validationResult: VisitValidation = {
        isValid: true,
        requiresNewVisit: true,
        locationMatch: false,
        pendingSurveys: [],
        completedSurveys: [],
        skipSurveys: false,
        message: 'New customer - capture details and complete mandatory surveys'
      }
      setValidation(validationResult)
      setStep('validation')
      toast.success('✅ Ready to create new customer')
    } catch (error: any) {
      toast.error('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProceed = () => {
    onVisitStarted({
      visitType,
      customer: selectedCustomer,
      gpsLocation,
      validation,
      agentId,
      agentType
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* GPS Status Bar - Always visible */}
      <div className={`mb-4 p-4 rounded-lg shadow-sm ${gpsLocation ? 'bg-green-50 border-2 border-green-300' : 'bg-yellow-50 border-2 border-yellow-300'}`}>
        <div className="flex items-start">
          {gpsLocation ? (
            <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-base">
              {gpsLocation ? '✅ GPS Location Ready' : '📍 Getting GPS Location...'}
            </p>
            {gpsLocation ? (
              <p className="text-sm text-gray-700 mt-1 font-mono">
                {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
              </p>
            ) : gpsError ? (
              <div className="mt-2">
                <p className="text-sm text-red-700 font-semibold">{gpsError}</p>
                <p className="text-xs text-red-600 mt-2">
                  📱 <strong>How to fix:</strong><br/>
                  1. Go to Settings → Privacy → Location<br/>
                  2. Enable Location Services<br/>
                  3. Allow this app to use location
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mt-1">⏳ Please wait...</p>
            )}
            {gpsError && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={getCurrentLocation} 
                className="mt-3 w-full"
                disabled={gettingLocation}
              >
                <Navigation className="w-5 h-5 mr-2" />
                {gettingLocation ? 'Getting Location...' : 'Try Again'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Step 1: Visit Type Selection */}
      {step === 'type' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-start">
              <Info className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-base text-blue-900">📋 Instructions</p>
                <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                  Choose if this is a <strong>new customer</strong> (first time) or an <strong>existing customer</strong> (returning visit).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-blue-600" />
              Start Visit
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={() => handleVisitTypeSelect('new_customer')}
                disabled={!gpsLocation}
                className="w-full p-5 border-3 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <div className="flex items-start">
                  <UserPlus className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-lg text-gray-900">🆕 New Customer</p>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      First time visiting this shop.<br/>
                      You'll capture details and complete surveys.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleVisitTypeSelect('existing_customer')}
                disabled={!gpsLocation}
                className="w-full p-5 border-3 border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <div className="flex items-start">
                  <Search className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-lg text-gray-900">🔄 Existing Customer</p>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      Returning to a previous customer.<br/>
                      System checks if surveys are needed.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Customer Selection/Creation */}
      {step === 'customer' && (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => { setStep('type'); setVisitType(null) }}
            size="lg"
            className="w-full sm:w-auto"
          >
            ← Back
          </Button>

          {visitType === 'existing_customer' ? (
            <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Search className="w-6 h-6 mr-2 text-green-600" />
                Find Customer
              </h2>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-semibold">
                  💡 Tip: Search by shop name or phone number
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter shop name or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomer()}
                  className="text-base p-6"
                />
                <Button 
                  onClick={handleSearchCustomer} 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {loading ? 'Searching...' : 'Search Customer'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-base font-bold text-gray-900">Select Customer:</p>
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 text-left active:scale-95 transition-all shadow-sm"
                    >
                      <p className="font-bold text-base text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Last visit: {customer.lastVisit}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
                New Customer
              </h2>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-semibold">
                  💡 Next: You'll fill out the customer form
                </p>
              </div>

              <Button onClick={handleNewCustomerStart} className="w-full" size="lg">
                Continue to Customer Form →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Validation Results */}
      {step === 'validation' && validation && (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setStep('customer')}
            size="lg"
            className="w-full sm:w-auto"
          >
            ← Back
          </Button>

          {/* Location Status */}
          <div className={`rounded-lg p-5 shadow-md ${validation.locationMatch ? 'bg-green-50 border-2 border-green-300' : 'bg-yellow-50 border-2 border-yellow-300'}`}>
            <div className="flex items-start">
              {validation.locationMatch ? (
                <CheckCircle className="w-7 h-7 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-7 h-7 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-base">
                  {validation.locationMatch ? '✅ Location Verified' : '⚠️ Location Different'}
                </p>
                <p className="text-sm mt-2 leading-relaxed">{validation.message}</p>
                {validation.distanceFromPrevious !== undefined && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold">
                      📏 Distance: {validation.distanceFromPrevious}m from last visit
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Survey Status */}
          {validation.skipSurveys ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 shadow-md">
              <div className="flex items-start">
                <CheckCircle className="w-7 h-7 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base text-green-900">✅ All Surveys Complete!</p>
                  <p className="text-sm text-green-800 mt-2 leading-relaxed">
                    This customer completed all surveys at this location. You can proceed with other activities.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-5">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                Surveys Required
              </h3>

              {validation.pendingSurveys.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-3">
                    <p className="text-sm text-red-900 font-bold">
                      ⚠️ IMPORTANT: Complete {validation.pendingSurveys.filter(s => s.isMandatory).length} mandatory survey(s)
                    </p>
                  </div>

                  {validation.pendingSurveys.map((survey) => (
                    <div 
                      key={survey.surveyId} 
                      className={`p-4 rounded-lg border-2 shadow-sm ${survey.isMandatory ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}
                    >
                      <div className="flex items-start">
                        <FileText className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${survey.isMandatory ? 'text-red-600' : 'text-blue-600'}`} />
                        <div className="flex-1">
                          <p className="font-bold text-base text-gray-900">{survey.surveyTitle}</p>
                          <p className="text-sm font-semibold mt-2">
                            {survey.isMandatory ? '🔴 MANDATORY - Must complete' : '🔵 OPTIONAL'}
                          </p>
                          {survey.dueDate && (
                            <p className="text-sm text-gray-600 mt-2">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Due: {new Date(survey.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No surveys required</p>
              )}

              {validation.completedSurveys.length > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <p className="text-sm font-bold text-gray-900 mb-3">✅ Already Completed:</p>
                  <div className="space-y-2">
                    {validation.completedSurveys.map((survey) => (
                      <div key={survey.surveyId} className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">{survey.surveyTitle}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Completed: {new Date(survey.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-5">
            <Button onClick={handleProceed} className="w-full text-lg py-6" size="lg">
              {validation.skipSurveys 
                ? '✅ Continue Visit'
                : visitType === 'new_customer'
                ? '📝 Capture Customer Details'
                : '📋 Start Surveys'}
            </Button>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm font-bold text-blue-900 mb-2">📱 Next Steps:</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                {validation.skipSurveys 
                  ? 'Complete other activities: orders, board installation, merchandising, etc.'
                  : visitType === 'new_customer'
                  ? '1️⃣ Fill customer form\n2️⃣ Complete mandatory surveys\n3️⃣ Proceed with visit activities'
                  : '1️⃣ Complete pending surveys\n2️⃣ Proceed with visit activities'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
