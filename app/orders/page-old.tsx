'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  ShoppingCart, 
  Calendar,
  User,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Download,
  Upload,
  MoreHorizontal,
  FileText,
  Printer
} from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  agentId: string
  agentName: string
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  orderDate: string
  deliveryDate?: string
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed' | 'refunded'
  paymentMethod?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [sortBy, setSortBy] = useState('orderDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const statuses = ['draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
  const priorities = ['low', 'medium', 'high', 'urgent']
  const paymentStatuses = ['pending', 'paid', 'partial', 'failed', 'refunded']

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-2025-001',
          customerId: '1',
          customerName: 'Acme Corporation',
          customerEmail: 'contact@acme.com',
          agentId: '1',
          agentName: 'John Smith',
          status: 'confirmed',
          priority: 'high',
          orderDate: '2025-01-06',
          deliveryDate: '2025-01-10',
          shippingAddress: {
            street: '123 Business District',
            city: 'Lagos',
            state: 'Lagos',
            zipCode: '100001',
            country: 'Nigeria'
          },
          items: [
            {
              id: '1',
              productId: '1',
              productName: 'Premium Wireless Headphones',
              sku: 'PWH-001',
              quantity: 10,
              unitPrice: 15999,
              totalPrice: 159990
            },
            {
              id: '2',
              productId: '2',
              productName: 'Organic Coffee Beans',
              sku: 'OCB-002',
              quantity: 20,
              unitPrice: 2499,
              totalPrice: 49980
            }
          ],
          subtotal: 209970,
          tax: 15748,
          shipping: 5000,
          discount: 10000,
          total: 220718,
          paymentStatus: 'paid',
          paymentMethod: 'Bank Transfer',
          notes: 'Urgent delivery required for corporate event',
          createdAt: '2025-01-06T08:00:00Z',
          updatedAt: '2025-01-06T10:30:00Z',
        },
        {
          id: '2',
          orderNumber: 'ORD-2025-002',
          customerId: '2',
          customerName: 'Sarah Johnson',
          customerEmail: 'sarah.johnson@email.com',
          agentId: '2',
          agentName: 'Mike Wilson',
          status: 'processing',
          priority: 'medium',
          orderDate: '2025-01-05',
          deliveryDate: '2025-01-08',
          shippingAddress: {
            street: '456 Residential Ave',
            city: 'Abuja',
            state: 'FCT',
            zipCode: '900001',
            country: 'Nigeria'
          },
          items: [
            {
              id: '3',
              productId: '3',
              productName: 'Cotton T-Shirt',
              sku: 'CTS-003',
              quantity: 5,
              unitPrice: 1999,
              totalPrice: 9995
            }
          ],
          subtotal: 9995,
          tax: 750,
          shipping: 2000,
          discount: 0,
          total: 12745,
          paymentStatus: 'pending',
          notes: 'Customer prefers morning delivery',
          createdAt: '2025-01-05T14:20:00Z',
          updatedAt: '2025-01-05T16:45:00Z',
        },
        {
          id: '3',
          orderNumber: 'ORD-2025-003',
          customerId: '3',
          customerName: 'Tech Solutions Ltd',
          customerEmail: 'info@techsolutions.com',
          agentId: '3',
          agentName: 'Sarah Johnson',
          status: 'shipped',
          priority: 'medium',
          orderDate: '2025-01-04',
          deliveryDate: '2025-01-07',
          shippingAddress: {
            street: '789 Tech Hub',
            city: 'Port Harcourt',
            state: 'Rivers',
            zipCode: '500001',
            country: 'Nigeria'
          },
          items: [
            {
              id: '4',
              productId: '4',
              productName: 'Smart Watch',
              sku: 'SW-004',
              quantity: 3,
              unitPrice: 25999,
              totalPrice: 77997
            },
            {
              id: '5',
              productId: '5',
              productName: 'Yoga Mat',
              sku: 'YM-005',
              quantity: 15,
              unitPrice: 3999,
              totalPrice: 59985
            }
          ],
          subtotal: 137982,
          tax: 10349,
          shipping: 3000,
          discount: 5000,
          total: 146331,
          paymentStatus: 'paid',
          paymentMethod: 'Credit Card',
          createdAt: '2025-01-04T11:15:00Z',
          updatedAt: '2025-01-06T09:20:00Z',
        },
        {
          id: '4',
          orderNumber: 'ORD-2025-004',
          customerId: '4',
          customerName: 'David Brown',
          customerEmail: 'david.brown@email.com',
          agentId: '4',
          agentName: 'Lisa Brown',
          status: 'cancelled',
          priority: 'low',
          orderDate: '2025-01-03',
          shippingAddress: {
            street: '321 Suburb Street',
            city: 'Kano',
            state: 'Kano',
            zipCode: '700001',
            country: 'Nigeria'
          },
          items: [
            {
              id: '6',
              productId: '2',
              productName: 'Organic Coffee Beans',
              sku: 'OCB-002',
              quantity: 2,
              unitPrice: 2499,
              totalPrice: 4998
            }
          ],
          subtotal: 4998,
          tax: 375,
          shipping: 1500,
          discount: 0,
          total: 6873,
          paymentStatus: 'failed',
          notes: 'Customer cancelled due to payment issues',
          createdAt: '2025-01-03T16:30:00Z',
          updatedAt: '2025-01-03T18:45:00Z',
        },
        {
          id: '5',
          orderNumber: 'ORD-2025-005',
          customerId: '5',
          customerName: 'Global Industries',
          customerEmail: 'procurement@global.com',
          agentId: '5',
          agentName: 'David Lee',
          status: 'draft',
          priority: 'urgent',
          orderDate: '2025-01-06',
          deliveryDate: '2025-01-09',
          shippingAddress: {
            street: '555 Industrial Zone',
            city: 'Ibadan',
            state: 'Oyo',
            zipCode: '200001',
            country: 'Nigeria'
          },
          items: [
            {
              id: '7',
              productId: '1',
              productName: 'Premium Wireless Headphones',
              sku: 'PWH-001',
              quantity: 50,
              unitPrice: 15999,
              totalPrice: 799950
            }
          ],
          subtotal: 799950,
          tax: 59996,
          shipping: 10000,
          discount: 40000,
          total: 829946,
          paymentStatus: 'pending',
          notes: 'Large corporate order - requires approval',
          createdAt: '2025-01-06T13:00:00Z',
          updatedAt: '2025-01-06T13:00:00Z',
        },
      ]
      
      setOrders(mockOrders)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus
    
    return matchesSearch && matchesStatus && matchesPriority && matchesPaymentStatus
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof Order]
    const bValue = b[sortBy as keyof Order]
    
    if (!aValue || !bValue) return 0
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleCreateOrder = () => {
    toast.success('Create order functionality coming soon!')
  }

  const handleEditOrder = (orderId: string) => {
    toast.success(`Edit order ${orderId} functionality coming soon!`)
  }

  const handleDeleteOrder = (orderId: string) => {
    toast.success(`Delete order ${orderId} functionality coming soon!`)
  }

  const handleViewOrder = (orderId: string) => {
    toast.success(`View order ${orderId} details functionality coming soon!`)
  }

  const handlePrintOrder = (orderId: string) => {
    toast.success(`Print order ${orderId} functionality coming soon!`)
  }

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders first')
      return
    }
    toast.success(`${action} ${selectedOrders.length} orders functionality coming soon!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'shipped': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'returned': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'returned': return <AlertCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading orders..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all customer orders
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
            <Button onClick={handleCreateOrder}>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0))}
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
                    placeholder="Search orders by number, customer, or agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
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
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Payment Status</option>
                  {paymentStatuses.map(status => (
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
                  <option value="orderDate-desc">Newest First</option>
                  <option value="orderDate-asc">Oldest First</option>
                  <option value="total-desc">Highest Value</option>
                  <option value="total-asc">Lowest Value</option>
                  <option value="customerName-asc">Customer A-Z</option>
                  <option value="customerName-desc">Customer Z-A</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedOrders.length} orders selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Confirm')}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('Ship')}
                  >
                    Ship
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
                    onClick={() => handleBulkAction('Cancel')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(filteredOrders.map(o => o.id))
                          } else {
                            setSelectedOrders([])
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Order</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Agent</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Priority</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Total</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Payment</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id])
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.items.length} items</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{order.agentName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-gray-900">{formatDate(order.orderDate)}</p>
                          {order.deliveryDate && (
                            <p className="text-sm text-gray-600">
                              Due: {formatDate(order.deliveryDate)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditOrder(order.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintOrder(order.id)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteOrder(order.id)}
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

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedPaymentStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first order'
                  }
                </p>
                <Button onClick={handleCreateOrder}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}