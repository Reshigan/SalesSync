'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Warehouse, 
  Package, 
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Phone,
  Mail,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function WarehouseDetailPage() {
    const { formatCurrency } = useCurrency();
const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const warehouseId = params.id;

  const warehouse = {
    id: warehouseId,
    name: 'Lagos Main Warehouse',
    code: 'WH-LOS-001',
    address: 'Plot 45, Industrial Road, Ikeja, Lagos',
    phone: '+234-800-456-7890',
    email: 'lagos.warehouse@vantax.com',
    manager: 'Michael Johnson',
    managerPhone: '+234-801-345-6789',
    status: 'active',
    capacity: 50000,
    currentStock: 35420,
    utilizationRate: 70.84,
    totalValue: 28500000,
    productCategories: 12,
    activeProducts: 245,
    staff: 18,
    created: '2023-06-15',
  };

  const stockStats = {
    inStock: 35420,
    reserved: 2850,
    available: 32570,
    lowStock: 12,
    outOfStock: 5,
  };

  const recentMovements = [
    { id: '1', date: '2024-10-01 14:30', type: 'In', product: 'Coca Cola 500ml', quantity: 500, reference: 'PO-001' },
    { id: '2', date: '2024-10-01 13:15', type: 'Out', product: 'Pepsi 500ml', quantity: 300, reference: 'ORD-045' },
    { id: '3', date: '2024-10-01 11:00', type: 'In', product: 'Sprite 500ml', quantity: 400, reference: 'PO-002' },
    { id: '4', date: '2024-10-01 09:30', type: 'Out', product: 'Fanta 500ml', quantity: 200, reference: 'ORD-046' },
  ];

  const topProducts = [
    { name: 'Coca Cola 500ml', stock: 1200, value: 300000, movement: 'high' },
    { name: 'Pepsi 500ml', stock: 800, value: 192000, movement: 'high' },
    { name: 'Sprite 500ml', stock: 600, value: 138000, movement: 'medium' },
    { name: 'Fanta 500ml', stock: 500, value: 115000, movement: 'medium' },
    { name: 'Water 1L', stock: 2000, value: 200000, movement: 'high' },
  ];

  const staffList = [
    { name: 'Michael Johnson', role: 'Warehouse Manager', status: 'active' },
    { name: 'Sarah Williams', role: 'Supervisor', status: 'active' },
    { name: 'David Brown', role: 'Inventory Clerk', status: 'active' },
    { name: 'Lisa Garcia', role: 'Forklift Operator', status: 'active' },
    { name: 'James Wilson', role: 'Stock Keeper', status: 'active' },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{warehouse.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                warehouse.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {warehouse.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Code: {warehouse.code}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Manage Inventory
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Stock</p>
                <p className="text-2xl font-bold text-blue-900">{warehouse.currentStock.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">units</p>
              </div>
              <Package className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Stock Value</p>
                <p className="text-2xl font-bold text-green-900">₦{(warehouse.totalValue / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Utilization</p>
                <p className="text-2xl font-bold text-purple-900">{warehouse.utilizationRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Staff</p>
                <p className="text-2xl font-bold text-orange-900">{warehouse.staff}</p>
              </div>
              <Users className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Warehouse Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Warehouse Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium">{warehouse.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{warehouse.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{warehouse.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Manager</div>
                  <div className="font-medium">{warehouse.manager}</div>
                  <div className="text-sm text-gray-500">{warehouse.managerPhone}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Capacity Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Capacity & Utilization</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Capacity</span>
                  <span className="font-medium">{warehouse.capacity.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Current Stock</span>
                  <span className="font-medium">{warehouse.currentStock.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Available Space</span>
                  <span className="font-medium text-green-600">
                    {(warehouse.capacity - warehouse.currentStock).toLocaleString()} units
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mt-3">
                  <div 
                    className={`h-4 rounded-full ${
                      warehouse.utilizationRate > 90 ? 'bg-red-600' :
                      warehouse.utilizationRate > 75 ? 'bg-orange-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${warehouse.utilizationRate}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                  {warehouse.utilizationRate.toFixed(1)}% Utilized
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Product Categories</div>
                    <div className="text-xl font-bold">{warehouse.productCategories}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Products</div>
                    <div className="text-xl font-bold">{warehouse.activeProducts}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stock Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stock Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Total Items</div>
              <div className="text-2xl font-bold text-blue-900">{stockStats.inStock.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Available</div>
              <div className="text-2xl font-bold text-green-900">{stockStats.available.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-600 mb-1">Reserved</div>
              <div className="text-2xl font-bold text-yellow-900">{stockStats.reserved.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Low Stock
              </div>
              <div className="text-2xl font-bold text-orange-900">{stockStats.lowStock}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600 mb-1">Out of Stock</div>
              <div className="text-2xl font-bold text-red-900">{stockStats.outOfStock}</div>
            </div>
          </div>
        </Card>

        {/* Recent Movements & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Movements */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Movements</h2>
            <div className="space-y-3">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      movement.type === 'In' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {movement.type === 'In' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{movement.product}</div>
                      <div className="text-xs text-gray-500">{movement.date} • {movement.reference}</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    movement.type === 'In' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {movement.type === 'In' ? '+' : '-'}{movement.quantity}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              View All Movements
            </Button>
          </Card>

          {/* Top Products */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Top Products by Stock Value</h2>
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-600">{product.stock} units</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₦{product.value.toLocaleString()}</div>
                    <div className={`text-xs ${
                      product.movement === 'high' ? 'text-green-600' :
                      product.movement === 'medium' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {product.movement} movement
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Staff */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Warehouse Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {staffList.map((staff, idx) => (
              <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{staff.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{staff.role}</div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                    staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {staff.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}
