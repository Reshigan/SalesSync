/**
 * Mobile-First Agent Workflow Page
 * 
 * Flow:
 * 1. Customer Selection (existing/new)
 * 2. GPS Validation (10m radius)
 * 3. Brand Selection
 * 4. Visit Task List (surveys, boards, distributions)
 * 5. Task Completion
 * 6. Commission Summary
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Store, 
  MapPin, 
  Package, 
  CheckCircle, 
  DollarSign,
  Plus,
  Search,
  AlertCircle
} from 'lucide-react'
import { apiClient } from '../../services/api.service'
import MobileWorkflowLayout from '../../components/mobile/MobileWorkflowLayout'
import MobileCard from '../../components/mobile/MobileCard'
import MobileButton from '../../components/mobile/MobileButton'
import MobileInput from '../../components/mobile/MobileInput'
import GPSCapture from '../../components/mobile/GPSCapture'
import CameraCapture from '../../components/mobile/CameraCapture'

interface Customer {
  id: string
  name: string
  latitude: number
  longitude: number
  address?: string
}

interface Brand {
  id: string
  name: string
}

interface VisitTask {
  id: string
  task_type: 'survey' | 'board' | 'distribution'
  task_ref_id: string
  is_mandatory: boolean
  status: 'pending' | 'in_progress' | 'completed'
  sequence_order: number
  description?: string
}

const steps = [
  'Customer Selection',
  'GPS Validation',
  'Brand Selection',
  'Visit Tasks',
  'Complete Visit',
]

export default function AgentWorkflowPageMobile() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsValidated, setGpsValidated] = useState(false)

  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  const [visitTasks, setVisitTasks] = useState<VisitTask[]>([])
  const [visitId, setVisitId] = useState<string | null>(null)

  const [totalCommission, setTotalCommission] = useState(0)

  useEffect(() => {
    loadCustomers()
    loadBrands()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await apiClient.get('/customers?limit=100')
      const data = response.data.data?.customers || response.data.data || response.data || []
      setCustomers(data)
    } catch (err) {
      console.error('Error loading customers:', err)
      setError('Failed to load customers')
    }
  }

  const loadBrands = async () => {
    try {
      const response = await apiClient.get('/brands?limit=100')
      const data = response.data.data?.brands || response.data.data || response.data || []
      setBrands(data)
    } catch (err) {
      console.error('Error loading brands:', err)
      setError('Failed to load brands')
    }
  }

  const handleNext = async () => {
    setError(null)

    if (activeStep === 0) {
      if (!isNewCustomer && !selectedCustomer) {
        setError('Please select a customer')
        return
      }
      if (isNewCustomer && !newCustomerName.trim()) {
        setError('Please enter customer name')
        return
      }
    }

    if (activeStep === 1) {
      if (!gpsValidated) {
        setError('Please capture and validate your GPS location')
        return
      }
    }

    if (activeStep === 2) {
      if (selectedBrands.length === 0) {
        setError('Please select at least one brand')
        return
      }
      await createVisit()
    }

    if (activeStep === 3) {
      const incompleteMandatory = visitTasks.some(
        task => task.is_mandatory && task.status !== 'completed'
      )
      if (incompleteMandatory) {
        setError('Please complete all mandatory tasks')
        return
      }
    }

    if (activeStep === 4) {
      await completeVisit()
      navigate('/field-operations/dashboard')
      return
    }

    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError(null)
    setActiveStep(prev => prev - 1)
  }

  const handleLocationCaptured = (latitude: number, longitude: number) => {
    setCurrentLocation({ lat: latitude, lng: longitude })
    
    if (selectedCustomer && selectedCustomer.latitude && selectedCustomer.longitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        selectedCustomer.latitude,
        selectedCustomer.longitude
      )
      
      if (distance <= 10) {
        setGpsValidated(true)
        setError(null)
      } else {
        setGpsValidated(false)
        setError(`You are ${Math.round(distance)}m away. Please move within 10m of the customer.`)
      }
    } else {
      setGpsValidated(true)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const createVisit = async () => {
    setLoading(true)
    try {
      let customerId = selectedCustomer?.id

      if (isNewCustomer && currentLocation) {
        const customerResponse = await apiClient.post('/customers', {
          name: newCustomerName,
          address: newCustomerAddress,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        })
        customerId = customerResponse.data.data?.id || customerResponse.data.id
      }

      const visitResponse = await apiClient.post('/visits', {
        customer_id: customerId,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng,
        brands: selectedBrands,
      })

      const newVisitId = visitResponse.data.data?.id || visitResponse.data.id
      setVisitId(newVisitId)

      const tasksResponse = await apiClient.get(`/visits/${newVisitId}/tasks`)
      setVisitTasks(tasksResponse.data.data || tasksResponse.data || [])
    } catch (err) {
      console.error('Error creating visit:', err)
      setError('Failed to create visit')
    } finally {
      setLoading(false)
    }
  }

  const completeVisit = async () => {
    if (!visitId) return

    setLoading(true)
    try {
      await apiClient.patch(`/visits/${visitId}`, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

      const boardsCompleted = visitTasks.filter(
        t => t.task_type === 'board' && t.status === 'completed'
      ).length
      const distributionsCompleted = visitTasks.filter(
        t => t.task_type === 'distribution' && t.status === 'completed'
      ).length

      const commission = boardsCompleted * 10 + distributionsCompleted * 5
      setTotalCommission(commission)
    } catch (err) {
      console.error('Error completing visit:', err)
      setError('Failed to complete visit')
    } finally {
      setLoading(false)
    }
  }

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    )
  }

  const toggleTaskComplete = async (taskId: string) => {
    setVisitTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
          : task
      )
    )

    try {
      const task = visitTasks.find(t => t.id === taskId)
      if (task) {
        await apiClient.patch(`/visits/${visitId}/tasks/${taskId}`, {
          status: task.status === 'completed' ? 'pending' : 'completed',
        })
      }
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <MobileButton
                variant={!isNewCustomer ? 'primary' : 'outline'}
                onClick={() => setIsNewCustomer(false)}
                fullWidth
              >
                Existing Customer
              </MobileButton>
              <MobileButton
                variant={isNewCustomer ? 'primary' : 'outline'}
                onClick={() => setIsNewCustomer(true)}
                fullWidth
              >
                New Customer
              </MobileButton>
            </div>

            {!isNewCustomer ? (
              <>
                <MobileInput
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-5 w-5" />}
                />
                <div className="space-y-2">
                  {filteredCustomers.map(customer => (
                    <MobileCard
                      key={customer.id}
                      selected={selectedCustomer?.id === customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          {customer.address && (
                            <p className="text-sm text-gray-600">{customer.address}</p>
                          )}
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <MobileInput
                  label="Customer Name"
                  placeholder="Enter customer name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  icon={<Store className="h-5 w-5" />}
                />
                <MobileInput
                  label="Address"
                  placeholder="Enter address"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  icon={<MapPin className="h-5 w-5" />}
                />
              </div>
            )}
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <GPSCapture
              onLocationCaptured={handleLocationCaptured}
              targetLatitude={selectedCustomer?.latitude}
              targetLongitude={selectedCustomer?.longitude}
              radiusMeters={10}
              showValidation={!isNewCustomer && !!selectedCustomer}
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select the brands you'll be working with during this visit
            </p>
            <div className="space-y-2">
              {brands.map(brand => (
                <MobileCard
                  key={brand.id}
                  selected={selectedBrands.includes(brand.id)}
                  onClick={() => toggleBrand(brand.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{brand.name}</span>
                    </div>
                    {selectedBrands.includes(brand.id) && (
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Complete the following tasks for this visit
            </p>
            <div className="space-y-2">
              {visitTasks.map(task => (
                <MobileCard
                  key={task.id}
                  selected={task.status === 'completed'}
                  onClick={() => toggleTaskComplete(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        task.status === 'completed' 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                      }`}>
                        {task.task_type === 'board' && <Package className="h-5 w-5" />}
                        {task.task_type === 'distribution' && <Package className="h-5 w-5" />}
                        {task.task_type === 'survey' && <CheckCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {task.task_type}
                          {task.is_mandatory && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                    </div>
                    {task.status === 'completed' && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <MobileCard>
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Visit Complete!</h3>
                  <p className="text-gray-600 mt-1">Great work on completing this visit</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
                    <DollarSign className="h-8 w-8" />
                    <span>${totalCommission.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Commission Earned</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {visitTasks.filter(t => t.task_type === 'board' && t.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Boards Placed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {visitTasks.filter(t => t.task_type === 'distribution' && t.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Products Distributed</p>
                  </div>
                </div>
              </div>
            </MobileCard>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <MobileWorkflowLayout
      title="Field Agent Workflow"
      currentStep={activeStep}
      totalSteps={steps.length}
      onBack={activeStep > 0 ? handleBack : undefined}
      onNext={handleNext}
      nextLabel={activeStep === 4 ? 'Finish' : 'Next'}
      nextDisabled={loading}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {renderStepContent()}
      </div>
    </MobileWorkflowLayout>
  )
}
