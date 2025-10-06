'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Edit, Phone, Mail, MapPin } from 'lucide-react'

export default function CustomerDetailPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      // Mock data
      setTimeout(() => {
        setCustomer({
          id: params.id,
          code: 'CUST001',
          name: 'ABC Store',
          email: 'contact@abcstore.com',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          customerType: 'RETAIL',
          creditLimit: 5000,
          isActive: true,
          orders: [
            { id: '1', orderNumber: 'ORD001', totalAmount: 250, status: 'DELIVERED' },
            { id: '2', orderNumber: 'ORD002', totalAmount: 180, status: 'PENDING' }
          ]
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching customer:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600">Customer Details</p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Customer Code</label>
                <p className="font-mono">{customer.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p><Badge>{customer.customerType}</Badge></p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Credit Limit</label>
                <p>${customer.creditLimit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p><Badge variant={customer.isActive ? 'success' : 'error'}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge></p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {customer.orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">${order.totalAmount}</p>
                  </div>
                  <Badge variant={order.status === 'DELIVERED' ? 'success' : 'warning'}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <span>{customer.address}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
