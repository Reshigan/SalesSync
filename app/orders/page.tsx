'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, RefreshCw, User, Calendar, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { apiClient, handleApiError, handleApiSuccess } from '@/lib/api-client'
import Link from 'next/link'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount: number
  product: {
    id: string
    name: string
    sku: string
    unitPrice: number
  }
}

interface Order {
  id: string
  orderNumber: string
  orderDate: string
  deliveryDate?: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  notes?: string
  customerId: string
  userId: string
  customer: {
    id: string
    name: string
    code: string
    customerType: string
  }
  user: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  items: OrderItem[]
  _count: {
    items: number
  }
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'info' },
  { value: 'PROCESSING', label: 'Processing', color: 'info' },
  { value: 'SHIPPED', label: 'Shipped', color: 'info' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' }
] as const

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderStats, setOrderStats] = useState<any>(null)

  useEffect(() => {
    fetchOrders()
    fetchOrderStats()
  }, [pagination.page, pagination.limit, searchTerm, status, customerId, userId, startDate, endDate])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: status || undefined,
        customerId: customerId || undefined,
        userId: userId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })

      setOrders(response.orders || [])
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderStats = async () => {
    try {
      const response = await apiClient.getOrderStats()
      setOrderStats(response)
    } catch (error) {
      console.error('Failed to fetch order stats:', error)
    }
  }

  const handleCreateOrder = async (orderData: any) => {
    try {
      setSubmitting(true)
      const response = await apiClient.createOrder(orderData)
      handleApiSuccess(response.message || 'Order created successfully')
      setShowCreateModal(false)
      fetchOrders()
      fetchOrderStats()
    } catch (error) {
      handleApiError(error, 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiClient.updateOrderStatus(orderId, newStatus)
      handleApiSuccess(response.message || 'Order status updated successfully')
      fetchOrders()
      fetchOrderStats()
    } catch (error) {
      handleApiError(error, 'Failed to update order status')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') {
      setStatus(value)
    } else if (type === 'customerId') {
      setCustomerId(value)
    } else if (type === 'userId') {
      setUserId(value)
    } else if (type === 'startDate') {
      setStartDate(value)
    } else if (type === 'endDate') {
      setEndDate(value)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status)
    return (
      <Badge variant={statusConfig?.color as any || 'default'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order: Order) => (
        <div className="font-mono text-sm">{order.orderNumber}</div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order: Order) => (
        <div>
          <div className="font-medium">{order.customer.name}</div>
          <div className="text-sm text-gray-500">{order.customer.code}</div>
        </div>
      )
    },
    {
      key: 'agent',
      label: 'Agent',
      render: (order: Order) => (
        <div className="flex items-center gap-1 text-sm">
          <User className="h-3 w-3 text-gray-400" />
          <span>{order.user.firstName} {order.user.lastName}</span>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Order Date',
      render: (order: Order) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span>{new Date(order.orderDate).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (order: Order) => (
        <div className="flex items-center gap-1 text-sm">
          <Package className="h-3 w-3 text-gray-400" />
          <span>{order._count.items} items</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Total',
      render: (order: Order) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-gray-400" />
          <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          <select
            value={order.status}
            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {ORDER_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <Link href={`/orders/${order.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOrder(order)
              setShowEditModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length
  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  if (loading && orders.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and track fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats?.totalOrders || pagination.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{orderStats?.pendingOrders || pendingOrders}</p>
            </div>
            <Badge variant="warning">Pending</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{orderStats?.completedOrders || deliveredOrders}</p>
            </div>
            <Badge variant="success">Delivered</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(orderStats?.totalRevenue || totalRevenue).toLocaleString()}
              </p>
            </div>
            <Badge variant="info">Revenue</Badge>
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
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {ORDER_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="End Date"
          />

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Orders ({pagination.total})
            </h3>
            {loading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
        </div>
        
        <SimpleTable
          data={orders}
          columns={columns}
          emptyMessage="No orders found"
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

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Order"
      >
        <OrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setShowCreateModal(false)}
          submitting={submitting}
        />
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedOrder(null)
        }}
        title="Edit Order"
      >
        <div className="p-4">
          <p className="text-gray-600">Order editing functionality will be implemented here.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setSelectedOrder(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface OrderFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  submitting?: boolean
}

function OrderForm({ onSubmit, onCancel, submitting = false }: OrderFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    deliveryDate: '',
    notes: '',
    items: [
      {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0
      }
    ]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }
    formData.items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`item_${index}_product`] = 'Product is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_price`] = 'Price must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0
        }
      ]
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setFormData({ ...formData, items: updatedItems })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer *
          </label>
          <input
            type="text"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.customerId ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter customer ID or search..."
            required
            disabled={submitting}
          />
          {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Order Items *
          </label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={submitting}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        
        {formData.items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Item {index + 1}</h4>
              {formData.items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700"
                  disabled={submitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <input
                  type="text"
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors[`item_${index}_product`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Product ID"
                  disabled={submitting}
                />
                {errors[`item_${index}_product`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_product`]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="1"
                  disabled={submitting}
                />
                {errors[`item_${index}_quantity`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unit Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors[`item_${index}_price`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="0"
                  disabled={submitting}
                />
                {errors[`item_${index}_price`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_price`]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.discount}
                  onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        ))}
        
        {errors.items && <p className="text-red-500 text-xs mt-1">{errors.items}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Creating...
            </>
          ) : (
            'Create Order'
          )}
        </Button>
      </div>
    </form>
  )
}