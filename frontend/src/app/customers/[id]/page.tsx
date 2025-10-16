'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import customersService from '@/services/customers.service';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  ShoppingCart,
  FileText,
  DollarSign,
  Calendar,
  Edit,
  Activity,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function CustomerDetailPage() {
    const { formatCurrency } = useCurrency();
const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const customerId = params.id;

  // Mock customer data
  const customer = {
    id: customerId,
    name: 'Shoprite Lagos Mall',
    code: 'CUST-001',
    email: 'procurement@shoprite-lagos.com',
    phone: '+234-800-123-4567',
    address: '123 Mall Road, Victoria Island, Lagos',
    category: 'Modern Trade',
    creditLimit: 5000000,
    creditUsed: 2500000,
    outstandingBalance: 850000,
    paymentTerms: 'Net 30',
    taxId: 'TIN-12345678',
    status: 'active',
    since: '2023-01-15',
    lastOrder: '2024-10-01',
    totalOrders: 234,
    totalRevenue: 45600000,
  };

  const recentOrders = [
    { id: 'ORD-001', date: '2024-10-01', amount: 125000, status: 'delivered', items: 15 },
    { id: 'ORD-002', date: '2024-09-28', amount: 98000, status: 'delivered', items: 12 },
    { id: 'ORD-003', date: '2024-09-25', amount: 156000, status: 'pending', items: 18 },
    { id: 'ORD-004', date: '2024-09-20', amount: 89000, status: 'delivered', items: 10 },
  ];

  const recentPayments = [
    { id: 'PAY-001', date: '2024-09-30', amount: 125000, method: 'Bank Transfer', invoice: 'INV-001' },
    { id: 'PAY-002', date: '2024-09-25', amount: 98000, method: 'Cheque', invoice: 'INV-002' },
    { id: 'PAY-003', date: '2024-09-20', amount: 75000, method: 'Cash', invoice: 'INV-003' },
  ];

  const recentVisits = [
    { id: 'VIS-001', date: '2024-10-01', agent: 'John Doe', duration: '45 min', orders: 1 },
    { id: 'VIS-002', date: '2024-09-28', agent: 'Jane Smith', duration: '30 min', orders: 1 },
    { id: 'VIS-003', date: '2024-09-25', agent: 'John Doe', duration: '50 min', orders: 1 },
  ];

  const creditUtilization = (customer.creditUsed / customer.creditLimit) * 100;

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {customer.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Customer Code: {customer.code}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">₦{(customer.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-green-900">{customer.totalOrders}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                <p className="text-2xl font-bold text-orange-900">₦{(customer.outstandingBalance / 1000).toFixed(0)}K</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Credit Used</p>
                <p className="text-2xl font-bold text-purple-900">{creditUtilization.toFixed(0)}%</p>
              </div>
              <CreditCard className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Customer Information & Credit Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{customer.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{customer.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium">{customer.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Customer Since</div>
                  <div className="font-medium">{customer.since}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Credit Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Credit Information</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Credit Limit</span>
                  <span className="font-medium">₦{(customer.creditLimit / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Credit Used</span>
                  <span className="font-medium">₦{(customer.creditUsed / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Available Credit</span>
                  <span className="font-medium text-green-600">
                    ₦{((customer.creditLimit - customer.creditUsed) / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                  <div 
                    className={`h-3 rounded-full ${
                      creditUtilization > 80 ? 'bg-red-600' :
                      creditUtilization > 60 ? 'bg-orange-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${creditUtilization}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outstanding Balance</span>
                  <span className="font-semibold text-orange-600">
                    ₦{(customer.outstandingBalance / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Payment Terms</span>
                  <span className="font-medium">{customer.paymentTerms}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Tax ID</span>
                  <span className="font-medium font-mono text-sm">{customer.taxId}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Button variant="outline" size="sm">View All Orders</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium">{order.id}</td>
                    <td className="px-4 py-3 text-sm">{order.date}</td>
                    <td className="px-4 py-3 text-sm">{order.items}</td>
                    <td className="px-4 py-3 text-sm font-medium">₦{order.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Payments & Visits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Payments</h2>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-1" />
                Record Payment
              </Button>
            </div>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.invoice}</div>
                      <div className="text-xs text-gray-500">{payment.date} • {payment.method}</div>
                    </div>
                  </div>
                  <div className="font-semibold">₦{payment.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Visits */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Visits</h2>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{visit.agent}</div>
                      <div className="text-xs text-gray-500">{visit.date} • {visit.duration}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">{visit.orders} order(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}
