'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Warehouse, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Plus,
  Eye,
  ArrowUpDown,
  ShoppingCart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface InventoryStats {
  total_products: number;
  total_warehouses: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_stock_value: number;
  pending_transfers: number;
  recent_movements: number;
}

interface StockItem {
  id: string;
  product_name: string;
  product_code: string;
  warehouse_name: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  available_quantity: number;
  cost_price: number;
  total_value: number;
  batch_number: string;
  expiry_date: string;
  stock_status: string;
}

interface Movement {
  id: string;
  movement_date: string;
  movement_type: string;
  product_name: string;
  warehouse_name: string;
  quantity: number;
  reference_number: string;
  created_by: string;
}

interface Transfer {
  id: string;
  transfer_date: string;
  from_warehouse: string;
  to_warehouse: string;
  product_name: string;
  quantity: number;
  status: string;
  requested_by: string;
}

interface DashboardData {
  stats: InventoryStats;
  lowStockItems: StockItem[];
  recentMovements: Movement[];
  pendingTransfers: Transfer[];
}

export default function InventoryPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/dashboard');
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="h-4 w-4" />;
      case 'low_stock': return <AlertTriangle className="h-4 w-4" />;
      case 'out_of_stock': return <TrendingDown className="h-4 w-4" />;
      case 'expired': return <Calendar className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'outbound': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'transfer': return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
      case 'adjustment': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { stats, lowStockItems, recentMovements, pendingTransfers } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Monitor stock levels and manage warehouse operations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/inventory/warehouses')} variant="outline">
            <Warehouse className="h-4 w-4 mr-2" />
            Warehouses
          </Button>
          <Button onClick={() => router.push('/inventory/transfers/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_warehouses} warehouses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.low_stock_items}</div>
            <p className="text-xs text-muted-foreground">
              {stats.out_of_stock_items} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_stock_value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_transfers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recent_movements} recent movements
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Items */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Items requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                    <p>All items well stocked</p>
                    <p className="text-sm">No low stock alerts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStockStatusIcon(item.stock_status)}
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-600">{item.warehouse_name}</p>
                            <p className="text-xs text-gray-500">{item.product_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStockStatusColor(item.stock_status)}>
                            {item.stock_status.replace('_', ' ')}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {item.available_quantity} available
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity_reserved} reserved
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Movements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
                <CardDescription>Latest inventory transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMovements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent movements</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMovements.slice(0, 5).map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getMovementTypeIcon(movement.movement_type)}
                          <div>
                            <p className="font-medium">{movement.product_name}</p>
                            <p className="text-sm text-gray-600">{movement.warehouse_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(movement.movement_date).toLocaleDateString()} • {movement.created_by}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium capitalize">
                            {movement.movement_type}
                          </p>
                          <p className="text-sm text-gray-600">
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            {movement.reference_number}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stock Levels</CardTitle>
                <CardDescription>Current inventory across all warehouses</CardDescription>
              </div>
              <Button onClick={() => router.push('/inventory/stock')}>
                View All Stock
              </Button>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No stock data available</h3>
                  <p className="mb-4">Stock levels will appear here once inventory is added</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {getStockStatusIcon(item.stock_status)}
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">{item.warehouse_name}</p>
                          <p className="text-xs text-gray-500">
                            {item.product_code} • Batch: {item.batch_number || 'N/A'}
                          </p>
                          {item.expiry_date && (
                            <p className="text-xs text-orange-600">
                              Expires: {new Date(item.expiry_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStockStatusColor(item.stock_status)}>
                          {item.stock_status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {item.quantity_on_hand} on hand
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity_reserved} reserved • {item.available_quantity} available
                        </p>
                        <p className="text-xs text-green-600">
                          ${item.total_value.toLocaleString()} value
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Movements</CardTitle>
                <CardDescription>All stock movements and transactions</CardDescription>
              </div>
              <Button onClick={() => router.push('/inventory/movements')}>
                View All Movements
              </Button>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ArrowUpDown className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No movements recorded</h3>
                  <p className="mb-4">Inventory movements will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {getMovementTypeIcon(movement.movement_type)}
                        <div>
                          <p className="font-medium">{movement.product_name}</p>
                          <p className="text-sm text-gray-600">{movement.warehouse_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(movement.movement_date).toLocaleDateString()} • 
                            Created by {movement.created_by}
                          </p>
                          <p className="text-xs text-gray-400">
                            Ref: {movement.reference_number}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium capitalize">
                          {movement.movement_type}
                        </p>
                        <p className={`text-sm font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stock Transfers</CardTitle>
                <CardDescription>Inter-warehouse stock transfers</CardDescription>
              </div>
              <Button onClick={() => router.push('/inventory/transfers')}>
                View All Transfers
              </Button>
            </CardHeader>
            <CardContent>
              {pendingTransfers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ArrowUpDown className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No pending transfers</h3>
                  <p className="mb-4">Stock transfers will appear here</p>
                  <Button onClick={() => router.push('/inventory/transfers/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Transfer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTransfers.map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <ArrowUpDown className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{transfer.product_name}</p>
                          <p className="text-sm text-gray-600">
                            {transfer.from_warehouse} → {transfer.to_warehouse}
                          </p>
                          <p className="text-xs text-gray-500">
                            Requested by {transfer.requested_by} on {new Date(transfer.transfer_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getTransferStatusColor(transfer.status)}>
                          {transfer.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {transfer.quantity} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}