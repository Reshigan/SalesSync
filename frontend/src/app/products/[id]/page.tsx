'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import productsService from '@/services/products.service';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Package, 
  DollarSign, 
  BarChart3,
  Edit,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Tag,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function ProductDetailPage() {
    const { formatCurrency } = useCurrency();
const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const productId = params.id;

  const product = {
    id: productId,
    sku: 'COL-500ML',
    name: 'Coca Cola 500ml',
    category: 'Beverages',
    brand: 'Coca-Cola',
    description: 'Refreshing Coca-Cola carbonated soft drink in 500ml PET bottle',
    barcode: '5449000000996',
    status: 'active',
    basePrice: 250,
    retailPrice: 300,
    wholesalePrice: 220,
    costPrice: 180,
    taxRate: 8,
    unit: 'Bottle',
    weight: 0.5,
    dimensions: '20cm x 6cm x 6cm',
    minOrderQty: 24,
    reorderLevel: 100,
    totalStock: 2450,
    totalValue: 612500,
    supplier: 'NBC Bottling Company',
    created: '2024-01-15',
    lastUpdated: '2024-10-01',
  };

  const stockByWarehouse = [
    { warehouse: 'Lagos Main', available: 1200, reserved: 50, inTransit: 100, value: 300000 },
    { warehouse: 'Abuja Central', available: 800, reserved: 30, inTransit: 50, value: 200000 },
    { warehouse: 'Port Harcourt', available: 350, reserved: 20, inTransit: 0, value: 87500 },
    { warehouse: 'Kano North', available: 100, reserved: 0, inTransit: 50, value: 25000 },
  ];

  const salesData = {
    thisMonth: { quantity: 1250, revenue: 312500, growth: 15.5 },
    lastMonth: { quantity: 1080, revenue: 270000 },
    thisYear: { quantity: 12450, revenue: 3112500 },
    topCustomers: [
      { name: 'Shoprite Lagos', quantity: 450, revenue: 112500 },
      { name: 'Shoprite Abuja', quantity: 320, revenue: 80000 },
      { name: 'Game Stores', quantity: 280, revenue: 70000 },
    ],
  };

  const priceHistory = [
    { date: '2024-10-01', price: 250, change: 0 },
    { date: '2024-09-01', price: 250, change: 0 },
    { date: '2024-08-01', price: 240, change: 10 },
    { date: '2024-07-01', price: 240, change: 0 },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {product.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">SKU: {product.sku} | Barcode: {product.barcode}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Adjust Stock
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Stock</p>
                <p className="text-2xl font-bold text-blue-900">{product.totalStock.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">{product.unit}s</p>
              </div>
              <Package className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Stock Value</p>
                <p className="text-2xl font-bold text-green-900">₦{(product.totalValue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">This Month</p>
                <p className="text-2xl font-bold text-purple-900">{salesData.thisMonth.quantity}</p>
                <p className="text-xs text-purple-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{salesData.thisMonth.growth}%
                </p>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Revenue (MTD)</p>
                <p className="text-2xl font-bold text-orange-900">₦{(salesData.thisMonth.revenue / 1000).toFixed(0)}K</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Product Information & Pricing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Product Information</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-medium">{product.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Brand</div>
                  <div className="font-medium">{product.brand}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Description</div>
                <div className="text-sm mt-1">{product.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Unit</div>
                  <div className="font-medium">{product.unit}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Weight</div>
                  <div className="font-medium">{product.weight} kg</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Dimensions</div>
                <div className="font-medium">{product.dimensions}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Min Order Qty</div>
                  <div className="font-medium">{product.minOrderQty}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Reorder Level</div>
                  <div className="font-medium flex items-center">
                    {product.reorderLevel}
                    {product.totalStock < product.reorderLevel && (
                      <AlertCircle className="h-4 w-4 text-orange-500 ml-2" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Supplier</div>
                <div className="font-medium">{product.supplier}</div>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-600">Retail Price</div>
                  <div className="text-2xl font-bold text-blue-900">₦{product.retailPrice}</div>
                </div>
                <Tag className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-green-600">Base Price</div>
                  <div className="text-xl font-bold text-green-900">₦{product.basePrice}</div>
                </div>
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-purple-600">Wholesale Price</div>
                  <div className="text-xl font-bold text-purple-900">₦{product.wholesalePrice}</div>
                </div>
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Cost Price</div>
                  <div className="text-xl font-bold text-gray-900">₦{product.costPrice}</div>
                </div>
                <Tag className="h-6 w-6 text-gray-600" />
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-semibold text-green-600">
                    {(((product.basePrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Tax Rate</span>
                  <span className="font-medium">{product.taxRate}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stock by Warehouse */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stock by Warehouse</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">In Transit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockByWarehouse.map((stock, idx) => {
                  const total = stock.available + stock.reserved + stock.inTransit;
                  const isLow = stock.available < product.reorderLevel;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Warehouse className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium">{stock.warehouse}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{stock.available}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{stock.reserved}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{stock.inTransit}</td>
                      <td className="px-4 py-3 text-right font-semibold">{total}</td>
                      <td className="px-4 py-3 text-right">₦{stock.value.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isLow ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sales Performance & Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Performance */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sales Performance</h2>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-600">This Month</span>
                  <span className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{salesData.thisMonth.growth}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{salesData.thisMonth.quantity} units</div>
                <div className="text-sm text-purple-600">Revenue: ₦{salesData.thisMonth.revenue.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-600 mb-2">Last Month</div>
                <div className="text-xl font-bold text-blue-900">{salesData.lastMonth.quantity} units</div>
                <div className="text-sm text-blue-600">Revenue: ₦{salesData.lastMonth.revenue.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-600 mb-2">Year to Date</div>
                <div className="text-xl font-bold text-green-900">{salesData.thisYear.quantity.toLocaleString()} units</div>
                <div className="text-sm text-green-600">Revenue: ₦{salesData.thisYear.revenue.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {/* Top Customers */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Top Customers</h2>
            <div className="space-y-3">
              {salesData.topCustomers.map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.quantity} units</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₦{customer.revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              View All Customers
            </Button>
          </Card>
        </div>

        {/* Price History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Price History</h2>
          <div className="space-y-2">
            {priceHistory.map((history, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{history.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">₦{history.price}</span>
                  {history.change !== 0 && (
                    <span className={`flex items-center text-sm ${
                      history.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {history.change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {Math.abs(history.change)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}
