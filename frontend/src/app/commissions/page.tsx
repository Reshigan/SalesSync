'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Calculator,
  Award,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface CommissionStats {
  total_agents: number;
  active_structures: number;
  pending_approvals: number;
  total_commissions_this_month: number;
  total_paid_this_month: number;
  average_commission_rate: number;
  top_performer_commission: number;
}

interface CommissionRecord {
  id: string;
  agent_name: string;
  agent_role: string;
  period_start: string;
  period_end: string;
  base_achievement: number;
  base_commission: number;
  bonuses: number;
  deductions: number;
  final_amount: number;
  payment_status: string;
  structure_name: string;
}

interface CommissionStructure {
  id: string;
  name: string;
  role_type: string;
  calculation_type: string;
  base_rate: number;
  effective_from: string;
  effective_to: string;
  status: string;
  agents_count: number;
}

interface DashboardData {
  stats: CommissionStats;
  recentCommissions: CommissionRecord[];
  commissionStructures: CommissionStructure[];
  paymentsByStatus: { status: string; count: number; amount: number }[];
}

export default function CommissionsPage() {
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
      const response = await apiClient.get('/commissions/dashboard');
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStructureStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'van_sales': return 'bg-blue-100 text-blue-800';
      case 'promoter': return 'bg-purple-100 text-purple-800';
      case 'merchandiser': return 'bg-green-100 text-green-800';
      case 'field_agent': return 'bg-orange-100 text-orange-800';
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

  const { stats, recentCommissions, commissionStructures, paymentsByStatus } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600 mt-2">Manage agent commissions and payment structures</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/commissions/structures')} variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Structures
          </Button>
          <Button onClick={() => router.push('/commissions/calculate')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Calculate Commissions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_agents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_structures} active structures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_commissions_this_month.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.total_paid_this_month.toLocaleString()} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_approvals}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_commission_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Top: ${stats.top_performer_commission.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Commissions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Commissions</CardTitle>
                <CardDescription>Latest commission calculations</CardDescription>
              </CardHeader>
              <CardContent>
                {recentCommissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No commissions calculated</p>
                    <Button 
                      onClick={() => router.push('/commissions/calculate')} 
                      className="mt-4"
                      size="sm"
                    >
                      Calculate Commissions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCommissions.slice(0, 5).map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Award className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{commission.agent_name}</p>
                            <p className="text-sm text-gray-600">{commission.structure_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(commission.period_start).toLocaleDateString()} - {new Date(commission.period_end).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getPaymentStatusColor(commission.payment_status)}>
                            <div className="flex items-center space-x-1">
                              {getPaymentStatusIcon(commission.payment_status)}
                              <span>{commission.payment_status}</span>
                            </div>
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            ${commission.final_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Structures */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Structures</CardTitle>
                <CardDescription>Active commission calculation rules</CardDescription>
              </CardHeader>
              <CardContent>
                {commissionStructures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No structures defined</p>
                    <Button 
                      onClick={() => router.push('/commissions/structures/new')} 
                      className="mt-4"
                      size="sm"
                    >
                      Create Structure
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {commissionStructures.slice(0, 5).map((structure) => (
                      <div key={structure.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calculator className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{structure.name}</p>
                            <p className="text-sm text-gray-600">{structure.calculation_type}</p>
                            <p className="text-xs text-gray-500">
                              {structure.agents_count} agents assigned
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getRoleColor(structure.role_type)}>
                            {structure.role_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStructureStatusColor(structure.status)} variant="outline">
                            {structure.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {structure.base_rate}% base rate
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

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Commissions</CardTitle>
                <CardDescription>Complete commission history</CardDescription>
              </div>
              <Button onClick={() => router.push('/commissions/records')}>
                View All Records
              </Button>
            </CardHeader>
            <CardContent>
              {recentCommissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No commissions calculated</h3>
                  <p className="mb-4">Start by calculating commissions for your agents</p>
                  <Button onClick={() => router.push('/commissions/calculate')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Calculate Commissions
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/commissions/records/${commission.id}`)}>
                      <div className="flex items-center space-x-4">
                        <Award className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{commission.agent_name}</p>
                          <p className="text-sm text-gray-600">{commission.structure_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(commission.period_start).toLocaleDateString()} - {new Date(commission.period_end).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPaymentStatusColor(commission.payment_status)}>
                          <div className="flex items-center space-x-1">
                            {getPaymentStatusIcon(commission.payment_status)}
                            <span>{commission.payment_status}</span>
                          </div>
                        </Badge>
                        <p className="text-lg font-medium mt-1">
                          ${commission.final_amount.toLocaleString()}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Base: ${commission.base_commission.toLocaleString()}</div>
                          {commission.bonuses > 0 && (
                            <div className="text-green-600">+${commission.bonuses.toLocaleString()} bonus</div>
                          )}
                          {commission.deductions > 0 && (
                            <div className="text-red-600">-${commission.deductions.toLocaleString()} deduction</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Commission Structures</CardTitle>
                <CardDescription>Manage commission calculation rules</CardDescription>
              </div>
              <Button onClick={() => router.push('/commissions/structures')}>
                Manage Structures
              </Button>
            </CardHeader>
            <CardContent>
              {commissionStructures.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No structures defined</h3>
                  <p className="mb-4">Create commission structures to calculate agent payments</p>
                  <Button onClick={() => router.push('/commissions/structures/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Structure
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissionStructures.map((structure) => (
                    <div key={structure.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/commissions/structures/${structure.id}`)}>
                      <div className="flex items-center space-x-4">
                        <Calculator className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{structure.name}</p>
                          <p className="text-sm text-gray-600">
                            {structure.calculation_type} calculation
                          </p>
                          <p className="text-xs text-gray-500">
                            Effective: {new Date(structure.effective_from).toLocaleDateString()} - 
                            {structure.effective_to ? new Date(structure.effective_to).toLocaleDateString() : 'Ongoing'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getRoleColor(structure.role_type)}>
                          {structure.role_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStructureStatusColor(structure.status)} variant="outline">
                          {structure.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {structure.base_rate}% base rate
                        </p>
                        <p className="text-xs text-gray-500">
                          {structure.agents_count} agents assigned
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paymentsByStatus.map((item) => (
              <Card key={item.status}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.status} Payments
                  </CardTitle>
                  {getPaymentStatusIcon(item.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground">
                    ${item.amount.toLocaleString()} total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>This month's payment overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Commissions:</span>
                  <span className="font-medium">${stats.total_commissions_this_month.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">${stats.total_paid_this_month.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Payments:</span>
                  <span className="font-medium text-yellow-600">
                    ${(stats.total_commissions_this_month - stats.total_paid_this_month).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Rate:</span>
                  <span className="font-medium">
                    {stats.total_commissions_this_month > 0 
                      ? Math.round((stats.total_paid_this_month / stats.total_commissions_this_month) * 100)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Commission system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Agents:</span>
                  <span className="font-medium">{stats.total_agents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Structures:</span>
                  <span className="font-medium">{stats.active_structures}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Commission Rate:</span>
                  <span className="font-medium">{stats.average_commission_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Performer:</span>
                  <span className="font-medium">${stats.top_performer_commission.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}