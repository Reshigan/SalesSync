import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Search, Filter } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api.service'

interface InventoryItem {
  id: string
  productName: string
  sku: string
  vanId: string
  vanNumber: string
  currentStock: number
  maxCapacity: number
  reorderLevel: number
  unitPrice: number
  totalValue: number
  lastRestocked: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export default function InventoryTrackingPage() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/inventory/stock')
      const items = (res.data?.data || (Array.isArray(res.data) ? res.data : [])).map((item: Record<string, unknown>) => ({
        id: item.id as string || '',
        productName: item.product_name as string || item.name as string || 'Unknown',
        sku: item.sku as string || '',
        vanId: item.warehouse_id as string || '',
        vanNumber: item.warehouse_name as string || '',
        currentStock: Number(item.quantity_on_hand) || 0,
        maxCapacity: Number(item.max_capacity) || 100,
        reorderLevel: Number(item.reorder_level) || 10,
        unitPrice: Number(item.unit_price) || 0,
        totalValue: (Number(item.quantity_on_hand) || 0) * (Number(item.unit_price) || 0),
        lastRestocked: item.updated_at as string || '',
        status: Number(item.quantity_on_hand) === 0 ? 'out_of_stock' : Number(item.quantity_on_hand) <= Number(item.reorder_level || 10) ? 'low_stock' : 'in_stock'
      }))
      setInventory(items)
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-100'
      case 'low_stock': return 'text-yellow-600 bg-yellow-100'
      case 'out_of_stock': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.vanNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventory.filter(item => item.status === 'low_stock').length
  const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Tracking</h1>
          <p className="text-gray-600">Monitor stock levels across all vans</p>
        </div>
        <Button onClick={() => navigate('/van-sales/van-loads/create')}>
          <Package className="h-4 w-4 mr-2" />
          Restock Van
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Items In Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{inventory.filter(i => i.status === 'in_stock').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, or van..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Van
                  </th>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm text-gray-900">
                      {item.vanNumber}
                    </td>
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.currentStock} / {item.maxCapacity}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            getStockPercentage(item.currentStock, item.maxCapacity) > 50 
                              ? 'bg-green-600' 
                              : getStockPercentage(item.currentStock, item.maxCapacity) > 25 
                                ? 'bg-yellow-600' 
                                : 'bg-red-600'
                          }`}
                          style={{ width: `${getStockPercentage(item.currentStock, item.maxCapacity)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/van-sales/van-loads/create')}>
                          Restock
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/inventory/transfers')}>
                          Transfer
                        </Button>
                      </div>
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
