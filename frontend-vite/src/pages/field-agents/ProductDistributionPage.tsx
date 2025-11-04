import { useState, useEffect } from 'react'
import { Search, Truck, Package, MapPin, Calendar, CheckCircle, XCircle, Clock, Download, Plus, Eye, Edit2 } from 'lucide-react'
import { vanSalesService } from '../../services/van-sales.service'

interface Distribution {
  id: string
  distributionNumber: string
  vanId: string
  vanNumber: string
  driverId: string
  driverName: string
  routeName: string
  distributionDate: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  totalProducts: number
  totalQuantity: number
  deliveredQuantity: number
  startTime?: string
  endTime?: string
}

interface DistributionItem {
  id: string
  productId: string
  productName: string
  sku: string
  loadedQuantity: number
  deliveredQuantity: number
  remainingQuantity: number
}

export default function ProductDistributionPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null)
  const [distributionItems, setDistributionItems] = useState<DistributionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('today')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchDistributions()
  }, [filterStatus, filterDate])

  const fetchDistributions = async () => {
    try {
      setLoading(true)
      const routesResponse = await vanSalesService.getVanRoutes({
        status: filterStatus === 'all' ? undefined : filterStatus
      })

      const mappedDistributions: Distribution[] = (routesResponse.data || []).map((route: any) => {
        const totalQuantity = route.total_quantity || route.loaded_quantity || 0
        const deliveredQuantity = route.delivered_quantity || route.sold_quantity || 0
        
        return {
          id: route.id,
          distributionNumber: route.code || route.name || `DIST-${route.id}`,
          vanId: route.van_id || 'unknown',
          vanNumber: route.van_code || route.van_number || 'N/A',
          driverId: route.driver_id || 'unknown',
          driverName: route.driver_name || route.current_driver_name || 'Unknown Driver',
          routeName: route.name || 'Unknown Route',
          distributionDate: route.start_time || route.created_at || new Date().toISOString(),
          status: route.status === 'active' ? 'in_progress' : route.status === 'completed' ? 'completed' : route.status === 'inactive' ? 'scheduled' : 'scheduled',
          totalProducts: route.total_products || route.product_count || 0,
          totalQuantity: totalQuantity,
          deliveredQuantity: deliveredQuantity,
          startTime: route.start_time,
          endTime: route.end_time
        }
      })

      setDistributions(mappedDistributions)
    } catch (error) {
      console.error('Failed to fetch distributions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDistributionItems = async (distributionId: string) => {
    try {
      const distribution = distributions.find(d => d.id === distributionId)
      if (!distribution) return

      const inventoryResponse = await vanSalesService.getVanInventory(distribution.vanId)

      const mappedItems: DistributionItem[] = (inventoryResponse.data || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name || 'Unknown Product',
        sku: item.product_code || item.sku || 'N/A',
        loadedQuantity: item.loaded_stock || item.current_stock || 0,
        deliveredQuantity: item.sold_stock || 0,
        remainingQuantity: item.current_stock || (item.loaded_stock || 0) - (item.sold_stock || 0)
      }))

      setDistributionItems(mappedItems)
    } catch (error) {
      console.error('Failed to fetch distribution items:', error)
      setDistributionItems([])
    }
  }

  const filteredDistributions = distributions.filter(dist => {
    const matchesSearch = 
      dist.distributionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dist.vanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dist.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dist.routeName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || dist.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const totalStats = {
    totalDistributions: distributions.length,
    inProgress: distributions.filter(d => d.status === 'in_progress').length,
    completed: distributions.filter(d => d.status === 'completed').length,
    scheduled: distributions.filter(d => d.status === 'scheduled').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Truck className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleViewDetails = (distribution: Distribution) => {
    setSelectedDistribution(distribution)
    fetchDistributionItems(distribution.id)
    setShowModal(true)
  }

  const getCompletionPercentage = (dist: Distribution) => {
    if (dist.totalQuantity === 0) return 0
    return Math.round((dist.deliveredQuantity / dist.totalQuantity) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Distribution</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage van loading and product distribution to routes
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Distribution
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Distributions</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalDistributions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search distributions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Distributions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No distributions found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No distribution data available'}
            </p>
          </div>
        ) : (
          filteredDistributions.map((dist) => (
            <div key={dist.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{dist.distributionNumber}</h3>
                  <p className="text-sm text-gray-600">{dist.routeName}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dist.status)}`}>
                  {getStatusIcon(dist.status)}
                  {dist.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Van:</span>
                  <span className="text-sm font-medium text-gray-900">{dist.vanNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Driver:</span>
                  <span className="text-sm font-medium text-gray-900">{dist.driverName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(dist.distributionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Products:</span>
                  <span className="text-sm font-medium text-gray-900">{dist.totalProducts} items</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Delivery Progress</span>
                  <span className="font-medium text-gray-900">
                    {dist.deliveredQuantity} / {dist.totalQuantity} ({getCompletionPercentage(dist)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${getCompletionPercentage(dist)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(dist)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Manage
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedDistribution.distributionNumber}</h2>
                <p className="text-sm text-gray-600">{selectedDistribution.routeName}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Distribution Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Van Number</p>
                <p className="text-lg font-semibold text-gray-900">{selectedDistribution.vanNumber}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Driver</p>
                <p className="text-lg font-semibold text-gray-900">{selectedDistribution.driverName}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Start Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedDistribution.startTime ? new Date(selectedDistribution.startTime).toLocaleTimeString() : 'Not started'}
                </p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">End Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedDistribution.endTime ? new Date(selectedDistribution.endTime).toLocaleTimeString() : 'In progress'}
                </p>
              </div>
            </div>

            {/* Products Table */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Loaded</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {distributionItems.map((item) => {
                    const progress = Math.round((item.deliveredQuantity / item.loadedQuantity) * 100)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.loadedQuantity}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 text-right">{item.deliveredQuantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.remainingQuantity}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-gray-900 font-medium">{progress}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
