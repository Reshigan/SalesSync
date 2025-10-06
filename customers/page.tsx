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
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  type: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR' | 'CORPORATE'
  creditLimit: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [type, setCustomerType] = useState('')
  const [city, setCity] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page, pagination.limit, searchTerm, type, city])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        type: type || undefined,
        city: city || undefined
      })

      setCustomers((response as any).customers || [])
      if ((response as any).pagination) {
        setPagination((response as any).pagination)
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch customers')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    try {
      setSubmitting(true)
      const response = await apiClient.createCustomer(customerData)
      handleApiSuccess((response as any).message || 'Customer created successfully')
      setShowCreateModal(false)
      fetchCustomers()
    } catch (error) {
      handleApiError(error, 'Failed to create customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCustomer = async (customerData: Partial<Customer>) => {
    if (!selectedCustomer) return
    
    try {
      setSubmitting(true)
      const response = await apiClient.updateCustomer(selectedCustomer.id, customerData)
      handleApiSuccess((response as any).message || 'Customer updated successfully')
      setShowEditModal(false)
      setSelectedCustomer(null)
      fetchCustomers()
    } catch (error) {
      handleApiError(error, 'Failed to update customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await apiClient.deleteCustomer(customerId)
      handleApiSuccess((response as any).message || 'Customer deleted successfully')
      fetchCustomers()
    } catch (error) {
      handleApiError(error, 'Failed to delete customer')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'type') {
      setCustomerType(value)
    } else if (type === 'city') {
      setCity(value)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (customer: Customer) => (
        <div className="font-mono text-sm">{customer.code}</div>
      )
    },
    {
      key: 'name',
      label: 'Name',
      render: (customer: Customer) => (
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-gray-500">{customer.type}</div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (customer: Customer) => (
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3 text-gray-400" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-gray-400" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (customer: Customer) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span>{customer.city || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'creditLimit',
      label: 'Credit Limit',
      render: (customer: Customer) => (
        <div className="font-medium">${customer.creditLimit.toLocaleString()}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (customer: Customer) => (
        <Badge variant={customer.isActive ? 'success' : 'error'}>
          {customer.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Link href={`/customers/${customer.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCustomer(customer)
              setShowEditModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCustomer(customer.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const activeCustomers = customers.filter(c => c.isActive).length
  const retailCustomers = customers.filter(c => c.type === 'RETAIL').length
  const totalCredit = customers.reduce((sum, c) => sum + c.creditLimit, 0)

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retail</p>
              <p className="text-2xl font-bold text-blue-600">{retailCustomers}</p>
            </div>
            <Badge variant="info">Retail</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credit</p>
              <p className="text-2xl font-bold text-purple-600">
                ${totalCredit.toLocaleString()}
              </p>
            </div>
            <Badge variant="warning">Credit</Badge>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="CORPORATE">Corporate</option>
          </select>

          <input
            type="text"
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Customers ({pagination.total})
            </h3>
            {loading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
        </div>
        
        <SimpleTable
          data={customers}
          columns={columns}
          emptyMessage="No customers found"
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Customer"
      >
        <CustomerForm
          onSubmit={handleCreateCustomer}
          onCancel={() => setShowCreateModal(false)}
          submitting={submitting}
        />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedCustomer(null)
        }}
        title="Edit Customer"
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleEditCustomer}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedCustomer(null)
          }}
          submitting={submitting}
        />
      </Modal>
    </div>
  )
}

interface CustomerFormProps {
  customer?: Customer | null
  onSubmit: (data: Partial<Customer>) => void
  onCancel: () => void
  submitting?: boolean
}

function CustomerForm({ customer, onSubmit, onCancel, submitting = false }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    code: customer?.code || '',
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    type: customer?.type || 'RETAIL',
    creditLimit: customer?.creditLimit || 0,
    isActive: customer?.isActive ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Customer code is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Code *
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.code ? 'border-red-300' : 'border-gray-300'
            }`}
            required
            disabled={submitting}
          />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            required
            disabled={submitting}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={submitting}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          >
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="CORPORATE">Corporate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credit Limit
          </label>
          <input
            type="number"
            value={formData.creditLimit}
            onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.creditLimit ? 'border-red-300' : 'border-gray-300'
            }`}
            min="0"
            disabled={submitting}
          />
          {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={submitting}
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {customer ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {customer ? 'Update' : 'Create'} Customer
            </>
          )}
        </Button>
      </div>
    </form>
  )
}