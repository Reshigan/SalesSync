import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Truck, MapPin, Package, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

interface VanSalesMetrics {
  totalVans: number
  activeRoutes: number
  todaySales: number
  totalInventory: number
  averageDeliveryTime: number
  routeEfficiency: number
}

interface VanPerformance {
  id: string
  vanNumber: string
  driver: string
  route: string
  status: 'active' | 'inactive' | 'maintenance'
  todaySales: number
  deliveries: number
  efficiency: number
  location: string
}

export default function VanSalesPage() {
  const [metrics, setMetrics] = useState<VanSalesMetrics>({
    totalVans: 0,
    activeRoutes: 0,
    todaySales: 0,
    totalInventory: 0,
    averageDeliveryTime: 0,
    routeEfficiency: 0
  })
  
  const [vanPerformance, setVanPerformance] = useState<VanPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVanSalesData()
  }, [])

  const fetchVanSalesData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with real API calls
      // Simulated data for now
      setMetrics({
        totalVans: 25,
        activeRoutes: 18,
        todaySales: 45750,
        totalInventory: 125000,
        averageDeliveryTime: 32,
        routeEfficiency: 87
      })

      setVanPerformance([
        {
          id: '1',
          vanNumber: 'VAN-001',
          driver: 'John Smith',
          route: 'North District',
          status: 'active',
          todaySales: 3250,
          deliveries: 12,
          efficiency: 92,
          location: 'Downtown Area'
        },
        {
          id: '2',
          vanNumber: 'VAN-002',
          driver: 'Sarah Johnson',
          route: 'South District',
          status: 'active',
          todaySales: 2890,
          deliveries: 8,
          efficiency: 85,
          location: 'Industrial Zone'
        },
        {
          id: '3',
          vanNumber: 'VAN-003',
          driver: 'Mike Davis',
          route: 'East District',
          status: 'maintenance',
          todaySales: 0,
          deliveries: 0,
          efficiency: 0,
          location: 'Service Center'
        }
      ])
    } catch (error) {
      console.error('Error fetching van sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'maintenance': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Van Sales Management</h1>
          <p className="text-gray-600">Monitor and manage your van sales operations</p>
        </div>
        <Button>
          <Truck className="h-4 w-4 mr-2" />
          Add New Van
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vans</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalVans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeRoutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.todaySales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inventory</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalInventory)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageDeliveryTime}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Route Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.routeEfficiency}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Van Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Van Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Van Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Today's Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deliveries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vanPerformance.map((van) => (
                  <tr key={van.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{van.vanNumber}</div>
                        <div className="text-sm text-gray-500">{van.driver}</div>
                        <div className="text-sm text-gray-500">{van.route}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(van.status)}`}>
                        {van.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(van.todaySales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {van.deliveries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {van.efficiency}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {van.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}