'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Megaphone, 
  Store, 
  MapPin, 
  Package, 
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  van_sales: {
    total_vans: number;
    active_loads: number;
    cash_collected_today: number;
  };
  promotions: {
    active_campaigns: number;
    activities_today: number;
    samples_distributed: number;
  };
  merchandising: {
    visits_today: number;
    compliance_issues: number;
    avg_shelf_share: number;
  };
  field_marketing: {
    active_agents: number;
    activities_today: number;
    revenue_today: number;
  };
  inventory: {
    low_stock_items: number;
    pending_transfers: number;
    total_value: number;
  };
  commissions: {
    pending_approvals: number;
    total_this_month: number;
    agents_count: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  module: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dashboard');
      if (response.success) {
        setStats(response.data.stats);
        setRecentActivities(response.data.recentActivities || []);
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

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'van_sales': return <Truck className="h-4 w-4" />;
      case 'promotions': return <Megaphone className="h-4 w-4" />;
      case 'merchandising': return <Store className="h-4 w-4" />;
      case 'field_marketing': return <MapPin className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'commissions': return <DollarSign className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to SalesSync</h1>
        <p className="text-gray-600 mt-2">Your comprehensive field force management platform</p>
      </div>

      {/* Module Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Van Sales */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/van-sales')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Van Sales</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.van_sales.total_vans || 0}</div>
            <p className="text-xs text-muted-foreground mb-2">Total vans</p>
            <div className="flex justify-between text-sm">
              <span>{stats?.van_sales.active_loads || 0} active loads</span>
              <span className="text-green-600">${stats?.van_sales.cash_collected_today.toLocaleString() || 0}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Promotions */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/promotions')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotions</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.promotions.active_campaigns || 0}</div>
            <p className="text-xs text-muted-foreground mb-2">Active campaigns</p>
            <div className="flex justify-between text-sm">
              <span>{stats?.promotions.activities_today || 0} activities today</span>
              <span className="text-blue-600">{stats?.promotions.samples_distributed || 0} samples</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Merchandising */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/merchandising')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merchandising</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.merchandising.visits_today || 0}</div>
            <p className="text-xs text-muted-foreground mb-2">Visits today</p>
            <div className="flex justify-between text-sm">
              <span>{stats?.merchandising.compliance_issues || 0} issues</span>
              <span className="text-green-600">{stats?.merchandising.avg_shelf_share.toFixed(1) || 0}% shelf share</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Field Marketing */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/field-marketing')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Marketing</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.field_marketing.active_agents || 0}</div>
            <p className="text-xs text-muted-foreground mb-2">Active agents</p>
            <div className="flex justify-between text-sm">
              <span>{stats?.field_marketing.activities_today || 0} activities</span>
              <span className="text-green-600">${stats?.field_marketing.revenue_today.toLocaleString() || 0}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/inventory')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventory.low_stock_items || 0}</div>
            <p className="text-xs text-muted-foreground mb-2">Low stock alerts</p>
            <div className="flex justify-between text-sm">
              <span>{stats?.inventory.pending_transfers || 0} transfers</span>
              <span className="text-green-600">${stats?.inventory.total_value.toLocaleString() || 0}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Commissions */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/commissions')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.commissions.pending_approvals || 0}</div>
            <p className="text-xs text-muted-foreground mb-2">Pending approvals</p>
            <div className="flex justify-between text-sm">
              <span>{stats?.commissions.agents_count || 0} agents</span>
              <span className="text-green-600">${stats?.commissions.total_this_month.toLocaleString() || 0}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activities</p>
                <p className="text-sm">Activities will appear here as they occur</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getModuleIcon(activity.module)}
                      <div>
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => router.push('/van-sales/loads/new')} className="h-20 flex flex-col">
                <Truck className="h-6 w-6 mb-2" />
                <span className="text-xs">New Van Load</span>
              </Button>
              <Button variant="outline" onClick={() => router.push('/promotions/campaigns/new')} className="h-20 flex flex-col">
                <Megaphone className="h-6 w-6 mb-2" />
                <span className="text-xs">New Campaign</span>
              </Button>
              <Button variant="outline" onClick={() => router.push('/merchandising/visits/new')} className="h-20 flex flex-col">
                <Store className="h-6 w-6 mb-2" />
                <span className="text-xs">Record Visit</span>
              </Button>
              <Button variant="outline" onClick={() => router.push('/inventory/transfers/new')} className="h-20 flex flex-col">
                <Package className="h-6 w-6 mb-2" />
                <span className="text-xs">Stock Transfer</span>
              </Button>
              <Button variant="outline" onClick={() => router.push('/field-marketing/activities/new')} className="h-20 flex flex-col">
                <MapPin className="h-6 w-6 mb-2" />
                <span className="text-xs">Field Activity</span>
              </Button>
              <Button variant="outline" onClick={() => router.push('/commissions/calculate')} className="h-20 flex flex-col">
                <DollarSign className="h-6 w-6 mb-2" />
                <span className="text-xs">Calculate Commission</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}