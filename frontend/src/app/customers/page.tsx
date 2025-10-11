'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { customersService, Customer } from '@/services/customers.service'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  RefreshCw,
  Filter
} from 'lucide-react'

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    retail: customers.filter(c => c.type === 'retail').length,
    wholesale: customers.filter(c => c.type === 'wholesale').length,
    totalCreditLimit: customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0),
    avgCreditLimit: customers.length > 0 ? customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0) / customers.length : 0
  }

  useEffect(() => {
    loadCustomers()
  }, [filterType, filterStatus])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterType !== 'all') filters.type = filterType
      if (filterStatus !== 'all') filters.status = filterStatus
      if (searchTerm) filters.search = searchTerm
      
      const response = await customersService.getAll(filters)
      setCustomers(response.customers || [])
    } catch (error: any) {
      console.error('Error loading customers:', error)
      toast.error(error.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadCustomers()
  }

  const handleCreateCustomer = async (data: Customer) => {
    try {
      await customersService.create(data)
      toast.success('Customer created successfully')
      setShowCreateModal(false)
      loadCustomers()
    } catch (error: any) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  const handleEditCustomer = async (data: Customer) => {
    if (!editingCustomer?.id) return
    
    try {
      await customersService.update(editingCustomer.id, data)
      toast.success('Customer updated successfully')
      setShowEditModal(false)
      setEditingCustomer(null)
      loadCustomers()
    } catch (error: any) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      await customersService.delete(id)
      toast.success('Customer deleted successfully')
      loadCustomers()
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      toast.error(error.message || 'Failed to delete customer')
    }
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowEditModal(true)
  }

  const getStatusBadge = (status: Customer['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    }
    return (<ErrorBoundary>

      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    
</ErrorBoundary>)
  }

  const getTypeBadge = (type: Customer['type']) => {
    const colors = {
      retail: 'bg-blue-100 text-blue-800',
      wholesale: 'bg-purple-100 text-purple-800',
      distributor: 'bg-indigo-100 text-indigo-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage your customer database</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadCustomers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Retail</p>
                <p className="text-2xl font-bold text-blue-600">{stats.retail}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wholesale</p>
                <p className="text-2xl font-bold text-purple-600">{stats.wholesale}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Credit</p>
                <p className="text-xl font-bold">KES {stats.totalCreditLimit.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Credit</p>
                <p className="text-xl font-bold">KES {stats.avgCreditLimit.toFixed(0)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="distributor">Distributor</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>

            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading customers...
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-lg font-medium">No customers found</p>
                        <p className="text-sm">Get started by creating your first customer</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                          {customer.businessName && (
                            <span className="text-xs text-gray-500">{customer.businessName}</span>
                          )}
                          {customer.customerCode && (
                            <span className="text-xs text-gray-400">{customer.customerCode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {customer.city}{customer.region && `, ${customer.region}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(customer.type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            KES {customer.creditLimit.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">{customer.paymentTerms}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => customer.id && handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        title="Create New Customer"
        onClose={() => setShowCreateModal(false)}
      >
        <CustomerForm
          onSubmit={handleCreateCustomer}
          onCancel={() => setShowCreateModal(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Customer"
        onClose={() => {
          setShowEditModal(false)
          setEditingCustomer(null)
        }}
      >
        {editingCustomer && (
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={handleEditCustomer}
            onCancel={() => {
              setShowEditModal(false)
              setEditingCustomer(null)
            }}
          />
        )}
      </FormModal>
    </DashboardLayout>
  )
}
