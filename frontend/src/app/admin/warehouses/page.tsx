'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import apiService from '@/lib/api'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Warehouse, 
  MapPin,
  Phone,
  Mail,
  Filter,
  Download,
  Upload,
  Package,
  Truck,
  Users,
  AlertTriangle
} from 'lucide-react'

interface WarehouseData {
  id: string
  code: string
  name: string
  type: 'main' | 'regional' | 'distribution' | 'cold_storage'
  address: string
  city: string
  province: string
  postal_code: string
  manager_id?: string | null
  manager_name?: string | null
  contact_person: string
  phone: string
  email: string
  capacity: number
  current_stock?: number | null
  status: 'active' | 'inactive' | 'maintenance'
  operating_hours: string
  coordinates?: {
    lat: number
    lng: number
  } | null
  created_at: string
  updated_at: string
}

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function WarehousesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const { hasPermission } = usePermissions()
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'main' as 'main' | 'regional' | 'distribution' | 'cold_storage',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    manager_id: '',
    contact_person: '',
    phone: '',
    email: '',
    capacity: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    operating_hours: '',
    coordinates_lat: '',
    coordinates_lng: ''
  })

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    setTimeout(() => {
      setWarehouses([
        {
          id: '1',
          code: 'WH001',
          name: 'Johannesburg Main Warehouse',
          type: 'main',
          address: '123 Industrial Road, Germiston',
          city: 'Johannesburg',
          province: 'Gauteng',
          postal_code: '1401',
          manager_id: 'mgr1',
          manager_name: 'David Wilson',
          contact_person: 'David Wilson',
          phone: '+27 11 123 4567',
          email: 'jburg.warehouse@pepsi.com',
          capacity: 50000,
          current_stock: 32500,
          status: 'active',
          operating_hours: '06:00 - 18:00',
          coordinates: { lat: -26.2041, lng: 28.0473 },
          created_at: '2023-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          code: 'WH002',
          name: 'Cape Town Regional Warehouse',
          type: 'regional',
          address: '456 Distribution Avenue, Bellville',
          city: 'Cape Town',
          province: 'Western Cape',
          postal_code: '7530',
          manager_id: 'mgr2',
          manager_name: 'Sarah Johnson',
          contact_person: 'Sarah Johnson',
          phone: '+27 21 234 5678',
          email: 'cpt.warehouse@pepsi.com',
          capacity: 25000,
          current_stock: 18750,
          status: 'active',
          operating_hours: '07:00 - 17:00',
          coordinates: { lat: -33.9249, lng: 18.4241 },
          created_at: '2023-02-20',
          updated_at: '2024-01-14'
        },
        {
          id: '3',
          code: 'WH003',
          name: 'Durban Distribution Center',
          type: 'distribution',
          address: '789 Logistics Street, Pinetown',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postal_code: '3610',
          manager_id: 'mgr3',
          manager_name: 'Mike Brown',
          contact_person: 'Mike Brown',
          phone: '+27 31 345 6789',
          email: 'durban.warehouse@pepsi.com',
          capacity: 15000,
          current_stock: 12300,
          status: 'active',
          operating_hours: '06:30 - 17:30',
          coordinates: { lat: -29.8587, lng: 31.0218 },
          created_at: '2023-03-10',
          updated_at: '2024-01-13'
        },
        {
          id: '4',
          code: 'WH004',
          name: 'Pretoria Cold Storage',
          type: 'cold_storage',
          address: '321 Cold Chain Road, Centurion',
          city: 'Pretoria',
          province: 'Gauteng',
          postal_code: '0157',
          manager_id: null,
          manager_name: null,
          contact_person: 'Lisa Smith',
          phone: '+27 12 456 7890',
          email: 'pretoria.cold@pepsi.com',
          capacity: 8000,
          current_stock: 6400,
          status: 'maintenance',
          operating_hours: '24/7',
          coordinates: { lat: -25.7479, lng: 28.1893 },
          created_at: '2023-04-05',
          updated_at: '2024-01-12'
        }
      ])
      
      setManagers([
        { id: 'mgr1', firstName: 'David', lastName: 'Wilson', email: 'david.wilson@pepsi.com' },
        { id: 'mgr2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@pepsi.com' },
        { id: 'mgr3', firstName: 'Mike', lastName: 'Brown', email: 'mike.brown@pepsi.com' },
        { id: 'mgr4', firstName: 'Lisa', lastName: 'Smith', email: 'lisa.smith@pepsi.com' }
      ])
      
      setLoading(false)
    }, 1000)
  }, [])

  // Get unique provinces for filter
  const provinces = Array.from(new Set(warehouses.map(w => w.province)))

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter
    const matchesType = typeFilter === 'all' || warehouse.type === typeFilter
    const matchesProvince = provinceFilter === 'all' || warehouse.province === provinceFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesProvince
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Saving warehouse:', formData)
    setShowModal(false)
    resetForm()
  }

  // Handle delete
  const handleDelete = async (warehouse: WarehouseData) => {
    if (confirm(`Are you sure you want to delete warehouse "${warehouse.name}"?`)) {
      console.log('Deleting warehouse:', warehouse.id)
      setWarehouses(warehouses.filter(w => w.id !== warehouse.id))
    }
  }

  // Handle edit
  const handleEdit = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse)
    setFormData({
      code: warehouse.code,
      name: warehouse.name,
      type: warehouse.type,
      address: warehouse.address,
      city: warehouse.city,
      province: warehouse.province,
      postal_code: warehouse.postal_code,
      manager_id: warehouse.manager_id || '',
      contact_person: warehouse.contact_person,
      phone: warehouse.phone,
      email: warehouse.email,
      capacity: warehouse.capacity.toString(),
      status: warehouse.status,
      operating_hours: warehouse.operating_hours,
      coordinates_lat: warehouse.coordinates?.lat.toString() || '',
      coordinates_lng: warehouse.coordinates?.lng.toString() || ''
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setEditingWarehouse(null)
    setFormData({
      code: '',
      name: '',
      type: 'main',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      manager_id: '',
      contact_person: '',
      phone: '',
      email: '',
      capacity: '',
      status: 'active',
      operating_hours: '',
      coordinates_lat: '',
      coordinates_lng: ''
    })
  }

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-blue-100 text-blue-800'
      case 'regional': return 'bg-green-100 text-green-800'
      case 'distribution': return 'bg-purple-100 text-purple-800'
      case 'cold_storage': return 'bg-cyan-100 text-cyan-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate capacity utilization
  const getCapacityUtilization = (current?: number | null, capacity?: number) => {
    if (!current || !capacity) return 0
    return Math.round((current / capacity) * 100)
  }

  // Get utilization color
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Table columns
  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      sortable: true,
      cell: ({ row }: { row: WarehouseData }) => (
        <div className="font-medium text-gray-900">{row.code}</div>
      )
    },
    {
      header: 'Warehouse Name',
      accessor: 'name',
      sortable: true,
      cell: ({ row }: { row: WarehouseData }) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">
            <MapPin className="inline h-3 w-3 mr-1" />
            {row.city}, {row.province}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: ({ row }: { row: WarehouseData }) => (
        <Badge className={getTypeColor(row.type)}>
          {row.type.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Contact',
      accessor: 'contact_person',
      cell: ({ row }: { row: WarehouseData }) => (
        <div className="text-sm">
          <div className="font-medium">{row.contact_person}</div>
          <div className="flex items-center text-gray-500">
            <Phone className="h-3 w-3 mr-1" />
            {row.phone}
          </div>
          <div className="flex items-center text-gray-500">
            <Mail className="h-3 w-3 mr-1" />
            {row.email}
          </div>
        </div>
      )
    },
    {
      header: 'Capacity',
      accessor: 'capacity',
      cell: ({ row }: { row: WarehouseData }) => {
        const utilization = getCapacityUtilization(row.current_stock, row.capacity)
        return (<ErrorBoundary>

          <div className="text-sm">
            <div className="flex items-center">
              <Package className="h-3 w-3 mr-1 text-gray-400" />
              <span className="font-medium">{row.capacity.toLocaleString()}</span>
            </div>
            <div className={`text-xs ${getUtilizationColor(utilization)}`}>
              {row.current_stock?.toLocaleString() || 0} ({utilization}%)
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full ${
                  utilization >= 90 ? 'bg-red-500' : 
                  utilization >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>
        
</ErrorBoundary>)
      }
    },
    {
      header: 'Manager',
      accessor: 'manager_name',
      cell: ({ row }: { row: WarehouseData }) => (
        <div className="flex items-center text-sm">
          <Users className="h-3 w-3 mr-1 text-gray-400" />
          <span>{row.manager_name || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Hours',
      accessor: 'operating_hours',
      cell: ({ row }: { row: WarehouseData }) => (
        <div className="text-sm text-gray-600">{row.operating_hours}</div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }: { row: WarehouseData }) => (
        <Badge variant={
          row.status === 'active' ? 'success' : 
          row.status === 'maintenance' ? 'warning' : 'secondary'
        }>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: ({ row }: { row: WarehouseData }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warehouses Management</h1>
            <p className="text-gray-600">Manage warehouse locations, capacity, and operations</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Warehouse className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouses.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouses.reduce((sum, w) => sum + w.capacity, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(warehouses.reduce((sum, w) => 
                    sum + getCapacityUtilization(w.current_stock, w.capacity), 0
                  ) / warehouses.length)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' }
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'main', label: 'Main' },
                { value: 'regional', label: 'Regional' },
                { value: 'distribution', label: 'Distribution' },
                { value: 'cold_storage', label: 'Cold Storage' }
              ]}
            />
            <Select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Provinces' },
                ...provinces.map(province => ({ value: province, label: province }))
              ]}
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
                setProvinceFilter('all')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredWarehouses}
            columns={columns}
            loading={loading}
            emptyMessage="No warehouses found"
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            resetForm()
          }}
          title={editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., WH001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Distribution Center"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  options={[
                    { value: 'main', label: 'Main' },
                    { value: 'regional', label: 'Regional' },
                    { value: 'distribution', label: 'Distribution' },
                    { value: 'cold_storage', label: 'Cold Storage' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 50000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Industrial Road"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Johannesburg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province *
                </label>
                <Select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  required
                  options={[
                    { value: '', label: 'Select Province' },
                    { value: 'Gauteng', label: 'Gauteng' },
                    { value: 'Western Cape', label: 'Western Cape' },
                    { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
                    { value: 'Eastern Cape', label: 'Eastern Cape' },
                    { value: 'Free State', label: 'Free State' },
                    { value: 'Limpopo', label: 'Limpopo' },
                    { value: 'Mpumalanga', label: 'Mpumalanga' },
                    { value: 'North West', label: 'North West' },
                    { value: 'Northern Cape', label: 'Northern Cape' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="e.g., 1401"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </label>
                <Select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Manager' },
                    ...managers.map(manager => ({
                      value: manager.id,
                      label: `${manager.firstName} ${manager.lastName}`
                    }))
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +27 11 123 4567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., warehouse@pepsi.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating Hours
                </label>
                <Input
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  placeholder="e.g., 06:00 - 18:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.coordinates_lat}
                  onChange={(e) => setFormData({ ...formData, coordinates_lat: e.target.value })}
                  placeholder="e.g., -26.2041"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.coordinates_lng}
                  onChange={(e) => setFormData({ ...formData, coordinates_lng: e.target.value })}
                  placeholder="e.g., 28.0473"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' }
                ]}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}