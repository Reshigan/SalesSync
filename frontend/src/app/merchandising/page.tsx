'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Camera, 
  BarChart3, 
  TrendingUp, 
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface MerchandisingStats {
  total_visits: number;
  visits_today: number;
  total_merchandisers: number;
  active_merchandisers: number;
  avg_shelf_share: number;
  total_photos_captured: number;
  compliance_issues: number;
}

interface Visit {
  id: string;
  visit_date: string;
  merchandiser_name: string;
  customer_name: string;
  shelf_share_percentage: number;
  facings_count: number;
  issues_count: number;
  photos_count: number;
  compliance_score: number;
}

interface ComplianceIssue {
  id: string;
  visit_id: string;
  issue_type: string;
  description: string;
  severity: string;
  status: string;
  customer_name: string;
  merchandiser_name: string;
  created_at: string;
}

interface DashboardData {
  stats: MerchandisingStats;
  recentVisits: Visit[];
  complianceIssues: ComplianceIssue[];
  shelfShareTrends: { date: string; percentage: number }[];
}

export default function MerchandisingPage() {
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
      const response = await apiClient.get('/merchandising/dashboard');
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

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
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

  const { stats, recentVisits, complianceIssues, shelfShareTrends } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Merchandising Management</h1>
          <p className="text-gray-600 mt-2">Monitor shelf compliance and store execution</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/merchandising/visits')} variant="outline">
            <Store className="h-4 w-4 mr-2" />
            View Visits
          </Button>
          <Button onClick={() => router.push('/merchandising/visits/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Visit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_visits}</div>
            <p className="text-xs text-muted-foreground">
              {stats.visits_today} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Merchandisers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_merchandisers}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total_merchandisers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Shelf Share</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_shelf_share.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all stores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.compliance_issues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_photos_captured} photos captured
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Recent Visits</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Visits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Store Visits</CardTitle>
                <CardDescription>Latest merchandising activities</CardDescription>
              </CardHeader>
              <CardContent>
                {recentVisits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No visits recorded</p>
                    <Button 
                      onClick={() => router.push('/merchandising/visits/new')} 
                      className="mt-4"
                      size="sm"
                    >
                      Record First Visit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentVisits.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Store className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{visit.customer_name}</p>
                            <p className="text-sm text-gray-600">{visit.merchandiser_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(visit.visit_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getComplianceColor(visit.compliance_score)}>
                            {visit.compliance_score}% compliance
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {visit.shelf_share_percentage}% shelf share
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Issues</CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {complianceIssues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No compliance issues</p>
                    <p className="text-sm">All stores are compliant</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complianceIssues.slice(0, 5).map((issue) => (
                      <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="font-medium">{issue.issue_type}</p>
                            <p className="text-sm text-gray-600">{issue.customer_name}</p>
                            <p className="text-xs text-gray-500">{issue.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <Badge className={getStatusColor(issue.status)} variant="outline">
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visits" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Store Visits</CardTitle>
                <CardDescription>Complete list of merchandising visits</CardDescription>
              </div>
              <Button onClick={() => router.push('/merchandising/visits')}>
                View All Visits
              </Button>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No visits recorded</h3>
                  <p className="mb-4">Start by recording your first store visit</p>
                  <Button onClick={() => router.push('/merchandising/visits/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Visit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/merchandising/visits/${visit.id}`)}>
                      <div className="flex items-center space-x-4">
                        <Store className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{visit.customer_name}</p>
                          <p className="text-sm text-gray-600">{visit.merchandiser_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(visit.visit_date).toLocaleDateString()} • {visit.photos_count} photos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getComplianceColor(visit.compliance_score)}>
                          {visit.compliance_score}% compliance
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {visit.shelf_share_percentage}% shelf share
                        </p>
                        <p className="text-xs text-gray-500">
                          {visit.facings_count} facings • {visit.issues_count} issues
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Compliance Issues</CardTitle>
                <CardDescription>Issues that need attention across all stores</CardDescription>
              </div>
              <Button onClick={() => router.push('/merchandising/compliance')}>
                View All Issues
              </Button>
            </CardHeader>
            <CardContent>
              {complianceIssues.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">All stores compliant</h3>
                  <p className="mb-4">No compliance issues found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complianceIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">{issue.issue_type}</p>
                          <p className="text-sm text-gray-600">{issue.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {issue.description} • Reported by {issue.merchandiser_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity} priority
                        </Badge>
                        <Badge className={getStatusColor(issue.status)} variant="outline">
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shelf Share Trends</CardTitle>
                <CardDescription>Average shelf share over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Average:</span>
                    <span className="font-medium">{stats.avg_shelf_share.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Visits:</span>
                    <span className="font-medium">{stats.total_visits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Photos Captured:</span>
                    <span className="font-medium">{stats.total_photos_captured}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key merchandising indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Compliance Rate:</span>
                    <span className="font-medium">
                      {recentVisits.length > 0 
                        ? Math.round(recentVisits.reduce((sum, v) => sum + v.compliance_score, 0) / recentVisits.length)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Issues:</span>
                    <span className="font-medium">{stats.compliance_issues}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Visits Today:</span>
                    <span className="font-medium">{stats.visits_today}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Merchandisers:</span>
                    <span className="font-medium">{stats.active_merchandisers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}