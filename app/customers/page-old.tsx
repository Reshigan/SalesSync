'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, MapPin, Phone, Mail, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { apiClient, handleApiError, handleApiSuccess } from '@/lib/api-client'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  customerType: 'individual' | 'business'
  status: 'active' | 'inactive' | 'blocked'
  creditLimit: number
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  rating: number
  tags: string[]
  assignedAgent?: string
  createdAt: string
  updatedAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

  const customerTypes = ['individual', 'business']
  const statuses = ['active', 'inactive', 'blocked']

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+234-801-234-5678',
          company: 'Acme Corporation',
          address: {
            street: '123 Business District',
            city: 'Lagos',
            state: 'Lagos',
            zipCode: '100001',
            country: 'Nigeria'
          },
          customerType: 'business',
          status: 'active',
          creditLimit: 500000,
          totalOrders: 45,
          totalSpent: 2850000,
          lastOrderDate: '2025-01-05',
          rating: 5,
          tags: ['VIP', 'Enterprise'],
          assignedAgent: 'John Smith',
          createdAt: '2024-06-15',
          updatedAt: '2025-01-06',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+234-802-345-6789',
          address: {
            street: '456 Residential Ave',
            city: 'Abuja',
            state: 'FCT',
            zipCode: '900001',
            country: 'Nigeria'
          },
          customerType: 'individual',
          status: 'active',
          creditLimit: 50000,
          totalOrders: 12,
          totalSpent: 185000,
          lastOrderDate: '2025-01-04',
          rating: 4,
          tags: ['Regular'],
          assignedAgent: 'Mike Wilson',
          createdAt: '2024-08-20',
          updatedAt: '2025-01-04',
        },
        {
          id: '3',
          name: 'Tech Solutions Ltd',
          email: 'info@techsolutions.com',
          phone: '+234-803-456-7890',
          company: 'Tech Solutions Ltd',
          address: {
            street: '789 Tech Hub',
            city: 'Port Harcourt',
            state: 'Rivers',
            zipCode: '500001',
            country: 'Nigeria'
          },
          customerType: 'business',
          status: 'active',
          creditLimit: 300000,
          totalOrders: 28,
          totalSpent: 1650000,
          lastOrderDate: '2025-01-03',
          rating: 4,
          tags: ['Technology', 'B2B'],
          assignedAgent: 'Sarah Johnson',
          createdAt: '2024-09-10',
          updatedAt: '2025-01-03',
        },
        {
          id: '4',
          name: 'David Brown',
          email: 'david.brown@email.com',
          phone: '+234-804-567-8901',
          address: {
            street: '321 Suburb Street',
            city: 'Kano',
            state: 'Kano',
            zipCode: '700001',
            country: 'Nigeria'
          },
          customerType: 'individual',
          status: 'inactive',
          creditLimit: 25000,
          totalOrders: 3,
          totalSpent: 45000,
          lastOrderDate: '2024-12-15',
          rating: 3,
          tags: ['New'],
          assignedAgent: 'Lisa Brown',
          createdAt: '2024-11-05',
          updatedAt: '2024-12-15',
        },
        {
          id: '5',
          name: 'Global Industries',
          email: 'procurement@global.com',
          phone: '+234-805-678-9012',
          company: 'Global Industries',
          address: {
            street: '555 Industrial Zone',
            city: 'Ibadan',
            state: 'Oyo',
            zipCode: '200001',
            country: 'Nigeria'
          },
          customerType: 'business',
          status: 'blocked',
          creditLimit: 1000000,
          totalOrders: 67,
          totalSpent: 4200000,
          lastOrderDate: '2024-11-20',
          rating: 2,
          tags: ['High Volume', 'Payment Issues'],
          assignedAgent: 'David Lee',
          createdAt: '2024-03-12',
          updatedAt: '2024-11-20',
        },
      ]
      
      setCustomers(mockCustomers)
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || customer.customerType === selectedType
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof Customer]
    const bValue = b[sortBy as keyof Customer]
    
    if (!aValue || !bValue) return 0
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleCreateCustomer = () => {
    toast.success('Create customer functionality coming soon!')
  }

  const handleEditCustomer = (customerId: string) => {
    toast.success(`Edit customer ${customerId} functionality coming soon!`)
  }

  const handleDeleteCustomer = (customerId: string) => {
    toast.success(`Delete customer ${customerId} functionality coming soon!`)
  }

  const handleViewCustomer = (customerId: string) => {
    toast.success(`View customer ${customerId} details functionality coming soon!`)
  }

  const handleBulkAction = (action: string) => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers first')
      return
    }
    toast.success(`${action} ${selectedCustomers.length} customers functionality coming soon!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-yellow-100 text-yellow-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'business': return 'bg-blue-100 text-blue-800'
      case 'individual': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading customers..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage your customer relationships and data
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Export')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Import')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={handleCreateCustomer}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-600 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Business Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.customerType === 'business').length}
                  </p>
                </div>
                <Building className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search customers by name, email, phone, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {customerTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="totalSpent-desc">Highest Spender</option>
                  <option value="totalSpent-asc">Lowest Spender</option>
                  <option value="totalOrders-desc">Most Orders</option>
                  <option value="totalOrders-asc">Least Orders</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCustomers.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedCustomers.length} customers selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Activate')}
                  >
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Export')}
                  >
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleBulkAction('Delete')}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers(filteredCustomers.map(c => c.id))
                          } else {
                            setSelectedCustomers([])
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Orders</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Total Spent</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Rating</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomers([...selectedCustomers, customer.id])
                            } else {
                              setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          {customer.company && (
                            <p className="text-sm text-gray-600">{customer.company}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {customer.address.city}, {customer.address.state}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-900">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-900">{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getTypeColor(customer.customerType)}>
                          {customer.customerType === 'business' ? (
                            <Building className="w-3 h-3 mr-1" />
                          ) : (
                            <Users className="w-3 h-3 mr-1" />
                          )}
                          {customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{customer.totalOrders}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          {renderStars(customer.rating)}
                          <span className="text-sm text-gray-600 ml-1">({customer.rating})</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewCustomer(customer.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCustomer(customer.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first customer'
                  }
                </p>
                <Button onClick={handleCreateCustomer}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}