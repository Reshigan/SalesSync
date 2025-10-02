'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Smartphone, 
  CreditCard, 
  UserCheck, 
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Target,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface FieldMarketingStats {
  total_agents: number;
  active_agents: number;
  board_placements_today: number;
  sim_distributions_today: number;
  voucher_sales_today: number;
  kyc_submissions_today: number;
  total_revenue_today: number;
}

interface Activity {
  id: string;
  activity_date: string;
  activity_type: string;
  agent_name: string;
  customer_name: string;
  product_type: string;
  quantity_distributed: number;
  revenue_generated: number;
  location: string;
  status: string;
}

interface KYCSubmission {
  id: string;
  customer_name: string;
  product_name: string;
  agent_name: string;
  verification_status: string;
  submitted_at: string;
  verified_at: string;
}

interface DashboardData {
  stats: FieldMarketingStats;
  recentActivities: Activity[];
  kycSubmissions: KYCSubmission[];
  activityByType: { type: string; count: number; revenue: number }[];
}

export default function FieldMarketingPage() {
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
      const response = await apiClient.get('/field-marketing/dashboard');
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

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'board_placement': return <MapPin className="h-4 w-4" />;
      case 'sim_distribution': return <Smartphone className="h-4 w-4" />;
      case 'voucher_sales': return <CreditCard className="h-4 w-4" />;
      case 'kyc_collection': return <UserCheck className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'board_placement': return 'bg-blue-100 text-blue-800';
      case 'sim_distribution': return 'bg-green-100 text-green-800';
      case 'voucher_sales': return 'bg-purple-100 text-purple-800';
      case 'kyc_collection': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
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

  const { stats, recentActivities, kycSubmissions, activityByType } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Marketing</h1>
          <p className="text-gray-600 mt-2">Manage field agents and marketing activities</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/field-marketing/agents')} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Agents
          </Button>
          <Button onClick={() => router.push('/field-marketing/activities/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Activity
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_agents}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total_agents} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Board Placements</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.board_placements_today}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SIM Distributions</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sim_distributions_today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.voucher_sales_today} vouchers sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_revenue_today.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.kyc_submissions_today} KYC submissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="kyc">KYC Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest field marketing activities</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activities recorded</p>
                    <Button 
                      onClick={() => router.push('/field-marketing/activities/new')} 
                      className="mt-4"
                      size="sm"
                    >
                      Record First Activity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getActivityTypeIcon(activity.activity_type)}
                          <div>
                            <p className="font-medium">{activity.agent_name}</p>
                            <p className="text-sm text-gray-600">{activity.customer_name || activity.location}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.activity_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getActivityTypeColor(activity.activity_type)}>
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.quantity_distributed} units
                          </p>
                          {activity.revenue_generated > 0 && (
                            <p className="text-xs text-green-600">
                              ${activity.revenue_generated.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KYC Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>KYC Submissions</CardTitle>
                <CardDescription>Recent customer verification requests</CardDescription>
              </CardHeader>
              <CardContent>
                {kycSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No KYC submissions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kycSubmissions.slice(0, 5).map((kyc) => (
                      <div key={kyc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <UserCheck className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{kyc.customer_name}</p>
                            <p className="text-sm text-gray-600">{kyc.product_name}</p>
                            <p className="text-xs text-gray-500">
                              Submitted by {kyc.agent_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(kyc.verification_status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(kyc.verification_status)}
                              <span>{kyc.verification_status}</span>
                            </div>
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(kyc.submitted_at).toLocaleDateString()}
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

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Activities</CardTitle>
                <CardDescription>Complete list of field marketing activities</CardDescription>
              </div>
              <Button onClick={() => router.push('/field-marketing/activities')}>
                View All Activities
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No activities recorded</h3>
                  <p className="mb-4">Start by recording your first field activity</p>
                  <Button onClick={() => router.push('/field-marketing/activities/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/field-marketing/activities/${activity.id}`)}>
                      <div className="flex items-center space-x-4">
                        {getActivityTypeIcon(activity.activity_type)}
                        <div>
                          <p className="font-medium">{activity.agent_name}</p>
                          <p className="text-sm text-gray-600">
                            {activity.customer_name || activity.location}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.activity_date).toLocaleDateString()} • {activity.product_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getActivityTypeColor(activity.activity_type)}>
                          {activity.activity_type.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {activity.quantity_distributed} units
                        </p>
                        {activity.revenue_generated > 0 && (
                          <p className="text-xs text-green-600">
                            ${activity.revenue_generated.toLocaleString()} revenue
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>KYC Management</CardTitle>
                <CardDescription>Customer verification and compliance</CardDescription>
              </div>
              <Button onClick={() => router.push('/field-marketing/kyc')}>
                View All KYC
              </Button>
            </CardHeader>
            <CardContent>
              {kycSubmissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No KYC submissions</h3>
                  <p className="mb-4">KYC submissions will appear here once agents start collecting customer data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kycSubmissions.map((kyc) => (
                    <div key={kyc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{kyc.customer_name}</p>
                          <p className="text-sm text-gray-600">{kyc.product_name}</p>
                          <p className="text-xs text-gray-500">
                            Submitted by {kyc.agent_name} on {new Date(kyc.submitted_at).toLocaleDateString()}
                          </p>
                          {kyc.verified_at && (
                            <p className="text-xs text-green-600">
                              Verified on {new Date(kyc.verified_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(kyc.verification_status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(kyc.verification_status)}
                            <span className="capitalize">{kyc.verification_status}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activityByType.map((item) => (
              <Card key={item.type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.type.replace('_', ' ')}
                  </CardTitle>
                  {getActivityTypeIcon(item.type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground">
                    ${item.revenue.toLocaleString()} revenue
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Performance</CardTitle>
                <CardDescription>Daily activity summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Board Placements:</span>
                  <span className="font-medium">{stats.board_placements_today}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">SIM Distributions:</span>
                  <span className="font-medium">{stats.sim_distributions_today}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Voucher Sales:</span>
                  <span className="font-medium">{stats.voucher_sales_today}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">KYC Submissions:</span>
                  <span className="font-medium">{stats.kyc_submissions_today}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Revenue:</span>
                    <span>${stats.total_revenue_today.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Field agent statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Agents:</span>
                  <span className="font-medium">{stats.total_agents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Today:</span>
                  <span className="font-medium">{stats.active_agents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Activity Rate:</span>
                  <span className="font-medium">
                    {stats.total_agents > 0 
                      ? Math.round((stats.active_agents / stats.total_agents) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Revenue per Agent:</span>
                  <span className="font-medium">
                    ${stats.active_agents > 0 
                      ? Math.round(stats.total_revenue_today / stats.active_agents).toLocaleString()
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}