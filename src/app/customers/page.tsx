'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner, SkeletonTable } from '@/components/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Users, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Building,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'

interface Customer {
  id: string
  code: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR' | 'CORPORATE'
  creditLimit: number
  paymentTerms: string
  routeName: string
  areaName: string
  regionName: string
  isActive: boolean
  lastOrderDate: string
  totalOrders: number
  totalValue: number
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const { canCreateIn, canEditIn, canDeleteIn, canExportFrom } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        code: 'CUST001',
        name: 'Shoprite Lagos',
        email: 'contact@shoprite.ng',
        phone: '+234-801-234-5678',
        address: '123 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        customerType: 'RETAIL',
        creditLimit: 500000,
        paymentTerms: 'Net 30',
        routeName: 'Lagos Central',
        areaName: 'Lagos Metro',
        regionName: 'South West',
        isActive: true,
        lastOrderDate: '2024-09-28',
        totalOrders: 45,
        totalValue: 2500000,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        code: 'CUST002',
        name: 'Konga Distribution Center',
        email: 'orders@konga.com',
        phone: '+234-802-345-6789',
        address: '456 Ikeja Industrial Estate',
        city: 'Lagos',
        state: 'Lagos',
        customerType: 'DISTRIBUTOR',
        creditLimit: 2000000,
        paymentTerms: 'Net 15',
        routeName: 'Lagos West',
        areaName: 'Lagos Metro',
        regionName: 'South West',
        isActive: true,
        lastOrderDate: '2024-09-30',
        totalOrders: 128,
        totalValue: 15600000,
        createdAt: '2023-11-20'
      }
    ]

    setTimeout(() => {
      setCustomers(mockCustomers)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || customer.customerType === filterType
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && customer.isActive) ||
                         (filterStatus === 'inactive' && !customer.isActive)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeColor = (type: string) => {
    const colors = {
      RETAIL: 'bg-blue-100 text-blue-800',
      WHOLESALE: 'bg-green-100 text-green-800',
      DISTRIBUTOR: 'bg-purple-100 text-purple-800',
      CORPORATE: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowEditModal(true)
  }

  const handleDelete = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== customerId))
    }
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) {
      setCustomers(customers.filter(c => !selectedCustomers.includes(c.id)))
      setSelectedCustomers([])
    }
  }

  const columns = [
    {
      header: 'Customer',
      accessorKey: 'customer',
      cell: (customer: Customer) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessorKey: 'contact',
      cell: (customer: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            {customer.email}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            {customer.phone}
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: (customer: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            {customer.city}, {customer.state}
          </div>
          <div className="text-xs text-gray-500">
            {customer.regionName} → {customer.areaName} → {customer.routeName}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'customerType',
      cell: (customer: Customer) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(customer.customerType)}`}>
          {customer.customerType}
        </span>
      ),
    },
    {
      header: 'Credit Info',
      accessorKey: 'credit',
      cell: (customer: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
            {formatCurrency(customer.creditLimit)}
          </div>
          <div className="text-xs text-gray-500">{customer.paymentTerms}</div>
        </div>
      ),
    },
    {
      header: 'Performance',
      accessorKey: 'performance',
      cell: (customer: Customer) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {customer.totalOrders} orders
          </div>
          <div className="text-sm text-gray-500">
            {formatCurrency(customer.totalValue)}
          </div>
          <div className="text-xs text-gray-400">
            Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (customer: Customer) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          customer.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (customer: Customer) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          {canEditIn('customers') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(customer)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteIn('customers') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDelete(customer.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          </div>
          <SkeletonTable rows={10} cols={8} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage your customer database and relationships</p>
          </div>
          <div className="flex space-x-3">
            {canExportFrom('customers') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            {canCreateIn('customers') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.isActive).length}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.creditLimit, 0))}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.totalValue, 0))}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search customers by name, code, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="CORPORATE">Corporate</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {selectedCustomers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedCustomers.length} customer(s) selected
              </span>
              <div className="flex space-x-2">
                {canDeleteIn('customers') && (
                  <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredCustomers}
            columns={columns}
            selectedRows={selectedCustomers}
            onSelectionChange={setSelectedCustomers}
            searchable={false}
            pagination={true}
            pageSize={25}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}