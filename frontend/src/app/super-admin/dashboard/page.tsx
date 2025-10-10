'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp,
  Activity,
  Server,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface TenantStats {
  id: string;
  name: string;
  plan: string;
  users: number;
  revenue: number;
  status: 'active' | 'trial' | 'suspended';
  lastActive: string;
}

export default function SuperAdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [tenants] = useState<TenantStats[]>([
    { id: '1', name: 'Coca Cola Nigeria', plan: 'Enterprise', users: 234, revenue: 15000, status: 'active', lastActive: '2 min ago' },
    { id: '2', name: 'PepsiCo Nigeria', plan: 'Enterprise', users: 198, revenue: 12000, status: 'active', lastActive: '5 min ago' },
    { id: '3', name: 'Unilever Nigeria', plan: 'Professional', users: 156, revenue: 8000, status: 'active', lastActive: '10 min ago' },
    { id: '4', name: 'MTN Nigeria', plan: 'Enterprise', users: 445, revenue: 25000, status: 'active', lastActive: '1 min ago' },
    { id: '5', name: 'Nestle Nigeria', plan: 'Professional', users: 123, revenue: 7500, status: 'trial', lastActive: '1 hour ago' },
  ]);

  const systemStats = {
    totalTenants: 47,
    activeTenants: 42,
    trialTenants: 5,
    suspendedTenants: 0,
    totalUsers: 3456,
    totalRevenue: 285000,
    monthlyGrowth: 12.5,
    systemUptime: 99.97,
  };

  const systemHealth = {
    apiStatus: 'healthy',
    databaseStatus: 'healthy',
    cacheStatus: 'healthy',
    storageUsage: 67,
    memoryUsage: 54,
    cpuUsage: 32,
  };

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">System-wide overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </Button>
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              New Tenant
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Tenants</p>
                <p className="text-3xl font-bold text-purple-900">{systemStats.totalTenants}</p>
                <p className="text-xs text-purple-600 mt-1">{systemStats.activeTenants} active</p>
              </div>
              <Building2 className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-900">{systemStats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">Across all tenants</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-green-900">${systemStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{systemStats.monthlyGrowth}% this month
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">System Uptime</p>
                <p className="text-3xl font-bold text-emerald-900">{systemStats.systemUptime}%</p>
                <p className="text-xs text-emerald-600 mt-1">Last 30 days</p>
              </div>
              <Activity className="h-12 w-12 text-emerald-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* System Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Health</h2>
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              All Systems Operational
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">API</span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {systemHealth.apiStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {systemHealth.databaseStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Cache</span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {systemHealth.cacheStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Usage</span>
                  <span className="font-medium">{systemHealth.storageUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${systemHealth.storageUsage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span className="font-medium">{systemHealth.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${systemHealth.memoryUsage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span className="font-medium">{systemHealth.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${systemHealth.cpuUsage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Metrics
              </Button>
            </div>
          </div>
        </Card>

        {/* Top Tenants by Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Tenants by Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{tenant.users}</td>
                    <td className="px-4 py-3 text-sm font-medium">${tenant.revenue.toLocaleString()}/mo</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {tenant.lastActive}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Building2 className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Manage Tenants</h3>
            <p className="text-sm text-gray-600">Create, view, and manage all tenant organizations</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <DollarSign className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Billing & Revenue</h3>
            <p className="text-sm text-gray-600">Manage subscriptions, invoices, and payments</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Activity className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Audit Logs</h3>
            <p className="text-sm text-gray-600">View system-wide activity and security logs</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}
