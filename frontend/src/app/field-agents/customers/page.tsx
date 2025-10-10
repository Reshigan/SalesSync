'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem, MobileButton, MobileInput, MobileFloatingActionButton } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { fieldAgentsService, Customer } from '@/services/field-agents.service'

import { 
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  User,
  Calendar,
  Eye,
  Edit,
  Navigation,
  Users,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react'

interface NearbyCustomer extends Customer {
  distance?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [nearbyCustomers, setNearbyCustomers] = useState<NearbyCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'code'>('name')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'nearby' | 'recent'>('all')
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [searchRadius, setSearchRadius] = useState(5) // km
  
  const { success, error } = useToast()
  const router = useRouter()

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadCustomers()
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (activeTab === 'nearby' && currentLocation) {
      loadNearbyCustomers()
    }
  }, [activeTab, currentLocation, searchRadius])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get current location')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser')
    }
  }

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await fieldAgentsService.getCustomers()
      setCustomers(response.data || [])
    } catch (err) {
      error('Failed to load customers')
      console.error('Error loading customers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNearbyCustomers = async () => {
    if (!currentLocation) return
    
    try {
      setIsLoading(true)
      const response = await fieldAgentsService.getNearbyCustomers(
        currentLocation.latitude,
        currentLocation.longitude,
        searchRadius
      )
      setNearbyCustomers(response || [])
    } catch (err) {
      error('Failed to load nearby customers')
      console.error('Error loading nearby customers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCustomers()
      return
    }

    try {
      setIsLoading(true)
      const response = await fieldAgentsService.searchCustomers(searchTerm)
      setCustomers(response.data || [])
    } catch (err) {
      error('Failed to search customers')
      console.error('Error searching customers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    try {
      // Add current location if available
      if (currentLocation) {
        (customerData as any).latitude = currentLocation.latitude
        ;(customerData as any).longitude = currentLocation.longitude
      }
      
      await fieldAgentsService.createCustomer(customerData)
      success('Customer created successfully')
      setShowCreateModal(false)
      loadCustomers()
    } catch (err) {
      error('Failed to create customer')
      console.error('Error creating customer:', err)
    }
  }

  const getDisplayCustomers = () => {
    switch (activeTab) {
      case 'nearby':
        return nearbyCustomers
      case 'recent':
        return customers
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 20)
      default:
        return customers
    }
  }

  const filteredCustomers = getDisplayCustomers().filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.customerCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCustomers = customers.length
  const nearbyCount = nearbyCustomers.length
  const recentCount = customers.filter(c => {
    const createdDate = new Date(c.createdAt || 0)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdDate > weekAgo
  }).length

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Customers" showBackButton>
          <div className="space-y-6">
            {/* Tab Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                All ({totalCustomers})
              </button>
              <button
                onClick={() => setActiveTab('nearby')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'nearby'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Nearby ({nearbyCount})
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'recent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Recent ({recentCount})
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <MobileCard className="text-center">
                <div className="text-xl font-bold text-blue-600">{totalCustomers}</div>
                <div className="text-xs text-gray-600">Total</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-xl font-bold text-green-600">{nearbyCount}</div>
                <div className="text-xs text-gray-600">Nearby</div>
              </MobileCard>
              <MobileCard className="text-center">
                <div className="text-xl font-bold text-purple-600">{recentCount}</div>
                <div className="text-xs text-gray-600">Recent</div>
              </MobileCard>
            </div>

            {/* Search */}
            <div className="space-y-3">
              <MobileInput
                placeholder={`Search by ${searchType}...`}
                value={searchTerm}
                onChange={setSearchTerm}
                icon={<Search className="w-5 h-5" />}
              />
              
              {/* Search Type Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'code', label: 'Code' }
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setSearchType(type.key as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
                      searchType === type.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Status */}
            {activeTab === 'nearby' && (
              <MobileCard className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">
                      {currentLocation ? 'Location Active' : 'Getting Location...'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {searchRadius}km radius
                  </div>
                </div>
              </MobileCard>
            )}

            {/* Customers List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <MobileList>
                {(activeTab === 'all' ? filteredCustomers : 
                  activeTab === 'nearby' ? nearbyCustomers :
                  customers.filter(c => {
                    const createdDate = new Date(c.createdAt || 0)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return createdDate > weekAgo
                  })).map((customer) => (
                  <MobileListItem
                    key={customer.id}
                    title={customer.name}
                    subtitle={customer.phone || 'No phone'}
                    description={`${customer.customerCode || 'No code'} | ${customer.address || 'No address'}`}
                    badge={customer.distance ? {
                      text: `${customer.distance.toFixed(1)}km`,
                      color: 'blue'
                    } : undefined}
                    rightText={customer.latitude && customer.longitude ? '📍' : ''}
                    onClick={() => router.push(`/field-agents/customers/${customer.id}`)}
                  />
                ))}
              </MobileList>
            )}

            {/* Empty State */}
            {!isLoading && (
              (activeTab === 'all' && filteredCustomers.length === 0) ||
              (activeTab === 'nearby' && nearbyCustomers.length === 0) ||
              (activeTab === 'recent' && customers.filter(c => {
                const createdDate = new Date(c.createdAt || 0)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return createdDate > weekAgo
              }).length === 0)
            ) && (
              <MobileCard className="text-center py-8">
                <div className="text-gray-500">
                  {activeTab === 'nearby' && !currentLocation 
                    ? 'Enable location to find nearby customers'
                    : `No ${activeTab} customers found`}
                </div>
              </MobileCard>
            )}

            {/* Quick Actions */}
            {activeTab === 'nearby' && currentLocation && (
              <MobileCard className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Search Radius</span>
                  <div className="flex gap-2">
                    {[1, 5, 10, 20].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setSearchRadius(radius)}
                        className={`px-3 py-1 rounded-full text-xs font-medium touch-manipulation ${
                          searchRadius === radius
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {radius}km
                      </button>
                    ))}
                  </div>
                </div>
              </MobileCard>
            )}
          </div>

          {/* Floating Action Button */}
          <MobileFloatingActionButton
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-6 h-6" />}
          />
        </MobileLayout>
      </ErrorBoundary>
    );
  }

  // Desktop version
  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="mt-2 text-gray-600">
                Search, identify, and manage customer relationships
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={getCurrentLocation}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Update Location
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Customers
                </div>
              </button>
              <button
                onClick={() => setActiveTab('nearby')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nearby'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Nearby ({nearbyCount})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </div>
              </button>
            </nav>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nearby Customers</p>
                  <p className="text-2xl font-bold text-green-600">{nearbyCount}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold text-purple-600">{recentCount}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Search Radius</p>
                  <p className="text-2xl font-bold text-orange-600">{searchRadius} km</p>
                </div>
                <Navigation className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder={`Search by ${searchType}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'name' | 'phone' | 'code')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="phone">Phone</option>
                  <option value="code">Customer Code</option>
                </select>
                {activeTab === 'nearby' && (
                  <select
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 km</option>
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={20}>20 km</option>
                  </select>
                )}
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Location Status */}
          {currentLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Location Active</span>
                <span className="text-green-600">
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {!currentLocation && activeTab === 'nearby' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">Location Required</span>
                <span className="text-yellow-600">
                  Enable location access to find nearby customers
                </span>
              </div>
            </div>
          )}

          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      {activeTab === 'nearby' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distance
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name || 'Unnamed Customer'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {customer.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone || 'No phone'}
                          </div>
                          {customer.email && (
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {customer.latitude && customer.longitude ? 
                              `${customer.latitude.toFixed(4)}, ${customer.longitude.toFixed(4)}` : 
                              customer.address || 'Not specified'}
                          </div>
                        </td>
                        {activeTab === 'nearby' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {(customer as NearbyCustomer).distance ? 
                                `${(customer as NearbyCustomer).distance?.toFixed(2)} km` : 
                                'Unknown'}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.customerCode || 'Not assigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/field-agents/customers/${customer.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/field-agents/customers/${customer.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/field-agents/visits/new?customerId=${customer.id}`)}
                              className="text-green-600 hover:text-green-900"
                              title="Schedule Visit"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredCustomers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    {activeTab === 'nearby' && !currentLocation ? 
                      'Enable location access to find nearby customers' :
                      'No customers found matching your criteria.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}