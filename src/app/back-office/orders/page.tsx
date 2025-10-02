'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { 
  ShoppingBag, 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Printer,
  Download,
  Truck,
  DollarSign,
  User,
  Calendar
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerCode: string
  salesAgent: string
  orderDate: string
  deliveryDate: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
  itemCount: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export default function OrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'SuperMart Downtown',
      customerCode: 'SM-001',
      salesAgent: 'John Doe',
      orderDate: '2024-10-01',
      deliveryDate: '2024-10-03',
      totalAmount: 2500.00,
      status: 'confirmed',
      paymentStatus: 'pending',
      itemCount: 15,
      priority: 'high',
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'MegaMall Central',
      customerCode: 'MM-002',
      salesAgent: 'Sarah Wilson',
      orderDate: '2024-10-01',
      deliveryDate: '2024-10-02',
      totalAmount: 3200.00,
      status: 'processing',
      paymentStatus: 'paid',
      itemCount: 22,
      priority: 'medium',
    },
  ]

  const orderStats = {
    totalOrders: 156,
    pendingOrders: 23,
    processingOrders: 18,
    shippedOrders: 12,
    totalValue: 125000,
    avgOrderValue: 801,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Process and track customer orders</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Orders
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{orderStats.pendingOrders}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.processingOrders}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-purple-600">{orderStats.shippedOrders}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${orderStats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">${orderStats.avgOrderValue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Recent Orders</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'Order', 
                  accessor: 'orderNumber',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.orderNumber}</p>
                      <p className="text-sm text-gray-500">{row.orderDate}</p>
                    </div>
                  )
                },
                { 
                  header: 'Customer', 
                  accessor: 'customerName',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.customerName}</p>
                      <p className="text-sm text-gray-500">{row.customerCode}</p>
                    </div>
                  )
                },
                { 
                  header: 'Amount', 
                  accessor: 'totalAmount',
                  cell: ({ value }) => (
                    <span className="font-medium">${value.toFixed(2)}</span>
                  )
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={orders}
            />
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  )
}