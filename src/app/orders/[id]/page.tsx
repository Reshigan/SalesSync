'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ShoppingCart, 
  User, 
  MapPin, 
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  FileText,
  Download,
  Printer,
  Edit,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;

  // Mock order data
  const order = {
    id: orderId,
    orderNumber: 'ORD-2024-001',
    date: '2024-10-01 14:30',
    status: 'delivered',
    customer: {
      name: 'Shoprite Lagos Mall',
      code: 'CUST-001',
      phone: '+234-800-123-4567',
      email: 'procurement@shoprite-lagos.com',
    },
    delivery: {
      address: '123 Mall Road, Victoria Island, Lagos',
      date: '2024-10-03',
      time: '10:00 AM - 2:00 PM',
      contact: 'John Receiving Manager',
      phone: '+234-801-234-5678',
    },
    payment: {
      terms: 'Net 30',
      dueDate: '2024-10-31',
      status: 'pending',
      method: 'Bank Transfer',
    },
    items: [
      { id: '1', sku: 'COL-500ML', name: 'Coca Cola 500ml', quantity: 100, price: 250, discount: 0, total: 25000 },
      { id: '2', sku: 'PEP-500ML', name: 'Pepsi 500ml', quantity: 80, price: 240, discount: 5, total: 18240 },
      { id: '3', sku: 'SPR-500ML', name: 'Sprite 500ml', quantity: 60, price: 230, discount: 0, total: 13800 },
      { id: '4', sku: 'FAN-500ML', name: 'Fanta 500ml', quantity: 50, price: 230, discount: 0, total: 11500 },
      { id: '5', sku: 'WAT-1L', name: 'Bottled Water 1L', quantity: 200, price: 100, discount: 10, total: 18000 },
    ],
    subtotal: 86540,
    tax: 6936, // 8% VAT
    discount: 2596,
    total: 90880,
    agent: 'John Doe',
    warehouse: 'Lagos Main Warehouse',
    notes: 'Please deliver between 10 AM - 2 PM. Contact receiving manager upon arrival.',
  };

  const timeline = [
    { date: '2024-10-01 14:30', status: 'Order Created', icon: ShoppingCart, color: 'blue' },
    { date: '2024-10-01 15:00', status: 'Order Confirmed', icon: CheckCircle, color: 'green' },
    { date: '2024-10-02 09:00', status: 'Items Picked', icon: Package, color: 'blue' },
    { date: '2024-10-02 14:00', status: 'Out for Delivery', icon: Truck, color: 'blue' },
    { date: '2024-10-03 11:30', status: 'Delivered', icon: CheckCircle, color: 'green' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{order.date}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">₦{order.total.toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Items</p>
                <p className="text-2xl font-bold text-green-900">{order.items.length}</p>
              </div>
              <Package className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Quantity</p>
                <p className="text-2xl font-bold text-purple-900">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <ShoppingCart className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Payment Due</p>
                <p className="text-lg font-bold text-orange-900">{order.payment.dueDate}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Customer & Delivery Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Customer Name</div>
                <div className="font-medium">{order.customer.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Customer Code</div>
                <div className="font-mono text-sm">{order.customer.code}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div>{order.customer.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div>{order.customer.email}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Customer Profile
              </Button>
            </div>
          </Card>

          {/* Delivery Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Delivery Information
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Delivery Address</div>
                <div className="font-medium flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  {order.delivery.address}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Delivery Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {order.delivery.date}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Delivery Time</div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {order.delivery.time}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Contact Person</div>
                <div>{order.delivery.contact}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Contact Phone</div>
                <div>{order.delivery.phone}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{item.sku}</td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">₦{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{item.discount}%</td>
                    <td className="px-4 py-3 text-right font-semibold">₦{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-medium">Subtotal:</td>
                  <td className="px-4 py-3 text-right font-semibold">₦{order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-medium">Discount:</td>
                  <td className="px-4 py-3 text-right text-green-600">-₦{order.discount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-medium">Tax (8% VAT):</td>
                  <td className="px-4 py-3 text-right">₦{order.tax.toLocaleString()}</td>
                </tr>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={5} className="px-4 py-3 text-right font-bold text-lg">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">₦{order.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Payment & Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-medium">{order.payment.terms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{order.payment.dueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.payment.status}
                </span>
              </div>
              <Button className="w-full mt-4">
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </div>
          </Card>

          {/* Additional Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Sales Agent</div>
                <div className="font-medium">{order.agent}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Warehouse</div>
                <div className="font-medium">{order.warehouse}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Order Notes</div>
                <div className="text-sm bg-gray-50 p-3 rounded-lg mt-1">
                  {order.notes}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Timeline */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
          <div className="space-y-4">
            {timeline.map((event, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  event.color === 'green' ? 'bg-green-100' :
                  event.color === 'blue' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <event.icon className={`h-5 w-5 ${
                    event.color === 'green' ? 'text-green-600' :
                    event.color === 'blue' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{event.status}</div>
                  <div className="text-sm text-gray-600">{event.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Order Actions</h3>
              <p className="text-sm text-gray-600">Manage this order</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Return/Exchange
              </Button>
              {order.status !== 'cancelled' && (
                <Button variant="outline">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
