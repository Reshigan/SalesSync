'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface VanSalesStats {
  total_vans: number;
  active_vans: number;
  total_loads_today: number;
  loads_in_field: number;
  total_cash_collected_today: number;
}

interface VanLoad {
  id: string;
  load_date: string;
  status: string;
  cash_collected: number;
  registration_number: string;
  salesman_name: string;
}

interface LoadsByStatus {
  status: string;
  count: number;
}

interface DashboardData {
  stats: VanSalesStats;
  recentLoads: VanLoad[];
  loadsByStatus: LoadsByStatus[];
}

export default function VanSalesPage() {
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
      const response = await apiClient.get('/van-sales/dashboard');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-blue-100 text-blue-800';
      case 'in_field': return 'bg-green-100 text-green-800';
      case 'returning': return 'bg-yellow-100 text-yellow-800';
      case 'reconciling': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <Package className="h-4 w-4" />;
      case 'in_field': return <Truck className="h-4 w-4" />;
      case 'returning': return <MapPin className="h-4 w-4" />;
      case 'reconciling': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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

  const { stats, recentLoads, loadsByStatus } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Van Sales Management</h1>
          <p className="text-gray-600 mt-2">Manage van operations, loads, and reconciliation</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/van-sales/vans')} variant="outline">
            <Truck className="h-4 w-4 mr-2" />
            Manage Vans
          </Button>
          <Button onClick={() => router.push('/van-sales/loads/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Load
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vans</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_vans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_vans} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Loads</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_loads_today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.loads_in_field} in field
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_cash_collected_today.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loads_in_field}</div>
            <p className="text-xs text-muted-foreground">In field</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_vans > 0 ? Math.round((stats.total_loads_today / stats.total_vans) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Van utilization</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loads">Recent Loads</TabsTrigger>
          <TabsTrigger value="status">Load Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Loads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Van Loads</CardTitle>
                <CardDescription>Latest van loading activities</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLoads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent loads found</p>
                    <Button 
                      onClick={() => router.push('/van-sales/loads/new')} 
                      className="mt-4"
                      size="sm"
                    >
                      Create First Load
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLoads.slice(0, 5).map((load) => (
                      <div key={load.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(load.status)}
                          <div>
                            <p className="font-medium">{load.registration_number}</p>
                            <p className="text-sm text-gray-600">{load.salesman_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(load.status)}>
                            {load.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            ${load.cash_collected?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Load Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Load Status Distribution</CardTitle>
                <CardDescription>Current status of today's loads</CardDescription>
              </CardHeader>
              <CardContent>
                {loadsByStatus.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No loads today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loadsByStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status.replace('_', ' ')}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loads" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Van Loads</CardTitle>
                <CardDescription>Complete list of van loading activities</CardDescription>
              </div>
              <Button onClick={() => router.push('/van-sales/loads')}>
                View All Loads
              </Button>
            </CardHeader>
            <CardContent>
              {recentLoads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No loads found</h3>
                  <p className="mb-4">Start by creating your first van load</p>
                  <Button onClick={() => router.push('/van-sales/loads/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Load
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLoads.map((load) => (
                    <div key={load.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/van-sales/loads/${load.id}`)}>
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(load.status)}
                        <div>
                          <p className="font-medium">{load.registration_number}</p>
                          <p className="text-sm text-gray-600">{load.salesman_name}</p>
                          <p className="text-xs text-gray-500">{new Date(load.load_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(load.status)}>
                          {load.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          ${load.cash_collected?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadsByStatus.map((item) => (
              <Card key={item.status}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.status.replace('_', ' ')} Loads
                  </CardTitle>
                  {getStatusIcon(item.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {((item.count / (loadsByStatus.reduce((sum, s) => sum + s.count, 0) || 1)) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}