'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SimpleTable as DataTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  Warehouse, 
  Plus, 
  Search, 
  Filter, 
  Download,
  MapPin,
  Phone,
  Mail,
  Package,
  TrendingUp,
  AlertTriangle,
  Building
} from 'lucide-react'

interface WarehouseData {
  id: string
  name: string
  code: string
  address: string
  city: string
  province: string
  postal_code: string
  manager_name: string
  manager_email: string
  manager_phone: string
  capacity: number
  current_stock: number
  utilization_rate: number
  status: 'active' | 'inactive' | 'maintenance'
  total_products: number
  low_stock_items: number
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const tenantCode = localStorage.getItem('tenantCode') || 'DEMO'
      
      const response = await fetch('http://localhost:3001/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Code': tenantCode,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch warehouses')
      }

      const result = await response.json()
      setWarehouses(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mock data for development
      setWarehouses([
        {
          id: '1',
          name: 'Main Distribution Center',
          code: 'MDC001',
          address: '123 Industrial Road',
          city: 'Johannesburg',
          province: 'Gauteng',
          postal_code: '2001',
          manager_name: 'John Manager',
          manager_email: 'john.manager@company.com',
          manager_phone: '+27 11 123 4567',
          capacity: 10000,
          current_stock: 7500,
          utilization_rate: 75,
          status: 'active',
          total_products: 150,
          low_stock_items: 12
        },
        {
          id: '2',
          name: 'Cape Town Regional Hub',
          code: 'CTH002',
          address: '456 Warehouse Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postal_code: '8001',
          manager_name: 'Sarah Regional',
          manager_email: 'sarah.regional@company.com',
          manager_phone: '+27 21 987 6543',
          capacity: 8000,
          current_stock: 6200,
          utilization_rate: 78,
          status: 'active',
          total_products: 120,
          low_stock_items: 8
        },
        {
          id: '3',
          name: 'Durban Coastal Depot',
          code: 'DCD003',
          address: '789 Port Avenue',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postal_code: '4001',
          manager_name: 'Mike Coastal',
          manager_email: 'mike.coastal@company.com',
          manager_phone: '+27 31 555 7890',
          capacity: 6000,
          current_stock: 3800,
          utilization_rate: 63,
          status: 'maintenance',
          total_products: 95,
          low_stock_items: 15
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'success' as const },
      inactive: { label: 'Inactive', variant: 'warning' as const },
      maintenance: { label: 'Maintenance', variant: 'error' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600'
    if (rate >= 75) return 'text-orange-600'
    if (rate >= 50) return 'text-green-600'
    return 'text-blue-600'
  }

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = 
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const warehouseStats = {
    totalWarehouses: warehouses.length,
    activeWarehouses: warehouses.filter(w => w.status === 'active').length,
    totalCapacity: warehouses.reduce((sum, w) => sum + w.capacity, 0),
    totalStock: warehouses.reduce((sum, w) => sum + w.current_stock, 0),
    avgUtilization: warehouses.length > 0 
      ? Math.round(warehouses.reduce((sum, w) => sum + w.utilization_rate, 0) / warehouses.length)
      : 0
  }

  const columns = [
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (warehouse: WarehouseData) => (
        <div>
          <div className="font-medium text-gray-900">{warehouse.name}</div>
          <div className="text-sm text-gray-500">{warehouse.code}</div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {warehouse.city}, {warehouse.province}
          </div>
        </div>
      )
    },
    {
      key: 'manager',
      label: 'Manager',
      render: (warehouse: WarehouseData) => (
        <div>
          <div className="font-medium text-gray-900">{warehouse.manager_name}</div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="w-4 h-4 mr-1" />
            {warehouse.manager_email}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="w-4 h-4 mr-1" />
            {warehouse.manager_phone}
          </div>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (warehouse: WarehouseData) => (
        <div>
          <div className="font-medium text-gray-900">
            {warehouse.current_stock.toLocaleString()} / {warehouse.capacity.toLocaleString()}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${
                warehouse.utilization_rate >= 90 ? 'bg-red-500' :
                warehouse.utilization_rate >= 75 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${warehouse.utilization_rate}%` }}
            />
          </div>
          <div className={`text-sm mt-1 ${getUtilizationColor(warehouse.utilization_rate)}`}>
            {warehouse.utilization_rate}% utilized
          </div>
        </div>
      )
    },
    {
      key: 'products',
      label: 'Products',
      render: (warehouse: WarehouseData) => (
        <div>
          <div className="font-medium text-gray-900">{warehouse.total_products}</div>
          {warehouse.low_stock_items > 0 && (
            <div className="flex items-center text-sm text-orange-600 mt-1">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {warehouse.low_stock_items} low stock
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (warehouse: WarehouseData) => getStatusBadge(warehouse.status)
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-600">Manage warehouses and distribution centers</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Warehouses</p>
              <p className="text-2xl font-bold text-gray-900">{warehouseStats.totalWarehouses}</p>
              <p className="text-sm text-green-600">{warehouseStats.activeWarehouses} active</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{warehouseStats.totalCapacity.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Units</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Building className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Stock</p>
              <p className="text-2xl font-bold text-gray-900">{warehouseStats.totalStock.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Units stored</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{warehouseStats.avgUtilization}%</p>
              <p className="text-sm text-gray-500">Capacity used</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Warehouses</h3>
            <div className="text-sm text-gray-500">
              Showing {filteredWarehouses.length} of {warehouses.length} warehouses
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchWarehouses}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          <DataTable
            data={filteredWarehouses}
            columns={columns}
            loading={loading}
            emptyMessage="No warehouses found"
          />
        </div>
      </Card>

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Warehouse"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter warehouse name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter warehouse code"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Province"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Postal code"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button>
              Add Warehouse
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}