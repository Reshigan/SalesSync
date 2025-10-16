'use client';
import { useState } from 'react';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Truck, MapPin, DollarSign, Package, Clock, CheckCircle, User, Navigation } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import vanSalesService from '@/services/van-sales.service';

import { useCurrency } from '@/hooks/useCurrency';
export default function RouteDetailPage() {
    const { formatCurrency } = useCurrency();
const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const routeId = params.id;

  const route = {
    id: routeId,
    name: 'Lagos North Route',
    code: 'RTE-LOS-N-001',
    date: '2024-10-01',
    agent: { name: 'John Doe', phone: '+234-801-234-5678' },
    vehicle: 'VAN-LOS-001 (Toyota Hiace)',
    status: 'in-progress',
    startTime: '08:00 AM',
    estimatedEnd: '05:00 PM',
    totalCustomers: 12,
    visitedCustomers: 7,
    totalOrders: 5,
    totalRevenue: 450000,
    cashCollected: 280000,
  };

  const customers = [
    { name: 'Shoprite Lagos', status: 'completed', order: 125000, time: '09:30 AM', sequence: 1 },
    { name: 'Game Stores', status: 'completed', order: 98000, time: '11:00 AM', sequence: 2 },
    { name: 'Spar Supermarket', status: 'completed', order: 85000, time: '12:30 PM', sequence: 3 },
    { name: 'Jumia Food', status: 'completed', order: 72000, time: '02:00 PM', sequence: 4 },
    { name: 'Konga Retail', status: 'completed', order: 70000, time: '03:30 PM', sequence: 5 },
    { name: 'Circle Mall', status: 'pending', order: 0, time: '', sequence: 6 },
    { name: 'Mega Plaza', status: 'pending', order: 0, time: '', sequence: 7 },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{route.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{route.status}</span>
            </div>
            <p className="text-gray-600 mt-1">{route.code} • {route.date}</p>
          </div>
          <Button><Navigation className="h-4 w-4 mr-2" />Track Route</Button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600 font-medium">Progress</p>
                <p className="text-2xl font-bold text-blue-900">{route.visitedCustomers}/{route.totalCustomers}</p></div>
              <CheckCircle className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600 font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-green-900">{route.totalOrders}</p></div>
              <Package className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-600 font-medium">Revenue</p>
                <p className="text-2xl font-bold text-purple-900">₦{(route.totalRevenue/1000).toFixed(0)}K</p></div>
              <DollarSign className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-orange-600 font-medium">Cash Collected</p>
                <p className="text-2xl font-bold text-orange-900">₦{(route.cashCollected/1000).toFixed(0)}K</p></div>
              <DollarSign className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Route Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><User className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Sales Agent</div><div className="font-medium">{route.agent.name}</div><div className="text-sm text-gray-500">{route.agent.phone}</div></div></div>
              <div className="flex items-start gap-3"><Truck className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Vehicle</div><div className="font-medium">{route.vehicle}</div></div></div>
              <div className="flex items-start gap-3"><Clock className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Start Time</div><div className="font-medium">{route.startTime}</div></div></div>
              <div className="flex items-start gap-3"><Clock className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Estimated End</div><div className="font-medium">{route.estimatedEnd}</div></div></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Route Progress</h2>
            <div className="space-y-4">
              <div><div className="flex justify-between text-sm mb-2"><span>Customers Visited</span><span className="font-medium">{route.visitedCustomers} / {route.totalCustomers}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(route.visitedCustomers / route.totalCustomers) * 100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div><div className="text-sm text-gray-600">Orders</div><div className="text-xl font-bold">{route.totalOrders}</div></div>
                <div><div className="text-sm text-gray-600">Success Rate</div><div className="text-xl font-bold text-green-600">{((route.totalOrders / route.visitedCustomers) * 100).toFixed(0)}%</div></div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Stops</h2>
          <div className="space-y-3">{customers.map((customer) => (<div key={customer.sequence} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${customer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{customer.sequence}</div><div><div className="font-medium">{customer.name}</div>{customer.time && <div className="text-sm text-gray-600">{customer.time}</div>}</div></div><div className="flex items-center gap-4">{customer.order > 0 && <div className="text-right"><div className="font-semibold">₦{customer.order.toLocaleString()}</div><div className="text-xs text-gray-500">Order Value</div></div>}<span className={`px-3 py-1 rounded-full text-sm font-medium ${customer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{customer.status}</span></div></div>))}</div>
        </Card>

        <Card className="p-6">
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center"><MapPin className="h-16 w-16 text-gray-400" /><span className="ml-4 text-gray-500">Route Map View</span></div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}
