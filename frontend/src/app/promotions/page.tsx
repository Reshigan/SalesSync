'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Megaphone, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  Gift,
  CheckCircle,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface PromotionsStats {
  total_campaigns: number;
  active_campaigns: number;
  total_promoters: number;
  active_promoters: number;
  total_activities_today: number;
  total_samples_distributed: number;
  total_surveys_completed: number;
}

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_activations: number;
  actual_activations: number;
  status: string;
}

interface Activity {
  id: string;
  activity_date: string;
  activity_type: string;
  promoter_name: string;
  customer_name: string;
  samples_distributed: number;
  contacts_made: number;
  surveys_completed: number;
  campaign_name: string;
}

interface DashboardData {
  stats: PromotionsStats;
  recentCampaigns: Campaign[];
  recentActivities: Activity[];
  campaignsByStatus: { status: string; count: number }[];
}

export default function PromotionsPage() {
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
      const response = await apiClient.get('/promotions/dashboard');
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
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Calendar className="h-4 w-4" />;
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      case 'completed': return <Target className="h-4 w-4" />;
      case 'cancelled': return <MapPin className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'sampling': return <Gift className="h-4 w-4" />;
      case 'survey': return <BarChart3 className="h-4 w-4" />;
      case 'activation': return <Target className="h-4 w-4" />;
      case 'demonstration': return <Users className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
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

  const { stats, recentCampaigns, recentActivities, campaignsByStatus } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions Management</h1>
          <p className="text-gray-600 mt-2">Manage promotional campaigns and field activities</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/promotions/campaigns')} variant="outline">
            <Megaphone className="h-4 w-4 mr-2" />
            Manage Campaigns
          </Button>
          <Button onClick={() => router.push('/promotions/campaigns/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_campaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_campaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_promoters}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total_promoters} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_activities_today}</div>
            <p className="text-xs text-muted-foreground">Field activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Samples Distributed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_samples_distributed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_surveys_completed} surveys completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Latest promotional campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {recentCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns found</p>
                    <Button 
                      onClick={() => router.push('/promotions/campaigns/new')} 
                      className="mt-4"
                      size="sm"
                    >
                      Create First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCampaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(campaign.status)}
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-gray-600">{campaign.campaign_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {campaign.actual_activations}/{campaign.target_activations} activations
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest field promotional activities</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activities today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getActivityTypeIcon(activity.activity_type)}
                          <div>
                            <p className="font-medium">{activity.promoter_name}</p>
                            <p className="text-sm text-gray-600">{activity.customer_name}</p>
                            <p className="text-xs text-gray-500">{activity.campaign_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {activity.samples_distributed} samples
                          </div>
                          <div className="text-xs text-gray-500">
                            {activity.contacts_made} contacts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Campaigns</CardTitle>
                <CardDescription>Complete list of promotional campaigns</CardDescription>
              </div>
              <Button onClick={() => router.push('/promotions/campaigns')}>
                View All Campaigns
              </Button>
            </CardHeader>
            <CardContent>
              {recentCampaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                  <p className="mb-4">Start by creating your first promotional campaign</p>
                  <Button onClick={() => router.push('/promotions/campaigns/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/promotions/campaigns/${campaign.id}`)}>
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(campaign.status)}
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-gray-600">{campaign.campaign_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          ${campaign.budget.toLocaleString()} budget
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round((campaign.actual_activations / campaign.target_activations) * 100)}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Field Activities</CardTitle>
                <CardDescription>Recent promotional activities by field agents</CardDescription>
              </div>
              <Button onClick={() => router.push('/promotions/activities')}>
                View All Activities
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No activities found</h3>
                  <p className="mb-4">Activities will appear here once promoters start working</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {getActivityTypeIcon(activity.activity_type)}
                        <div>
                          <p className="font-medium">{activity.promoter_name}</p>
                          <p className="text-sm text-gray-600">{activity.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.activity_date).toLocaleDateString()} - {activity.campaign_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium capitalize">
                          {activity.activity_type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.samples_distributed} samples, {activity.contacts_made} contacts
                        </div>
                        {activity.surveys_completed > 0 && (
                          <div className="text-xs text-green-600">
                            {activity.surveys_completed} surveys completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaignsByStatus.map((item) => (
              <Card key={item.status}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.status} Campaigns
                  </CardTitle>
                  {getStatusIcon(item.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {((item.count / (campaignsByStatus.reduce((sum, s) => sum + s.count, 0) || 1)) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Overall campaign effectiveness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Completion Rate:</span>
                  <span className="font-medium">
                    {recentCampaigns.length > 0 
                      ? Math.round(recentCampaigns.reduce((sum, c) => sum + (c.actual_activations / c.target_activations), 0) / recentCampaigns.length * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Budget Allocated:</span>
                  <span className="font-medium">
                    ${recentCampaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Campaigns:</span>
                  <span className="font-medium">{stats.active_campaigns}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Activity Summary</CardTitle>
                <CardDescription>Today's field performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Activities:</span>
                  <span className="font-medium">{stats.total_activities_today}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Samples Distributed:</span>
                  <span className="font-medium">{stats.total_samples_distributed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Surveys Completed:</span>
                  <span className="font-medium">{stats.total_surveys_completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Promoters:</span>
                  <span className="font-medium">{stats.active_promoters}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}