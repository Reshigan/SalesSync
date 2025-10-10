'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, Users, DollarSign, TrendingUp, Mail, Phone, MapPin, Calendar, Settings, CheckCircle, XCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function TenantDetailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const params = useParams();
  const tenantId = params.id;

  const tenant = {
    id: tenantId,
    name: 'Coca Cola Nigeria',
    email: 'admin@cocacola.ng',
    phone: '+234-800-123-4567',
    plan: 'Enterprise',
    status: 'active',
    users: 234,
    maxUsers: 500,
    revenue: 15000,
    createdAt: '2024-01-15',
    billingCycle: 'annual',
    industry: 'Beverages',
    country: 'Nigeria',
    address: 'Plot 2, Block B, Industrial Area, Lagos',
  };

  const usage = { users: 234, storage: 45, apiCalls: 125000, bandwidth: 250 };
  const features = [
    { name: 'Multi-User Access', enabled: true }, { name: 'API Access', enabled: true },
    { name: 'Custom Branding', enabled: true }, { name: 'Advanced Analytics', enabled: true },
    { name: 'Priority Support', enabled: true }, { name: 'SSO Integration', enabled: false },
  ];

  const recentInvoices = [
    { id: 'INV-001', date: '2024-10-01', amount: 15000, status: 'paid' },
    { id: 'INV-002', date: '2024-09-01', amount: 15000, status: 'paid' },
    { id: 'INV-003', date: '2024-08-01', amount: 15000, status: 'paid' },
  ];

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{tenant.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{tenant.status}</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">{tenant.plan}</span>
            </div>
            <p className="text-gray-600 mt-1">{tenant.email} • {tenant.industry}</p>
          </div>
          <Button><Settings className="h-4 w-4 mr-2" />Manage Tenant</Button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-blue-900">{tenant.users} / {tenant.maxUsers}</p></div>
              <Users className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600 font-medium">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-900">${tenant.revenue.toLocaleString()}</p></div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-600 font-medium">Storage Used</p>
                <p className="text-2xl font-bold text-purple-900">{usage.storage} GB</p></div>
              <TrendingUp className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-orange-600 font-medium">API Calls</p>
                <p className="text-2xl font-bold text-orange-900">{(usage.apiCalls/1000).toFixed(0)}K</p></div>
              <Building2 className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tenant Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Email</div><div className="font-medium">{tenant.email}</div></div></div>
              <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Phone</div><div className="font-medium">{tenant.phone}</div></div></div>
              <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Address</div><div className="font-medium">{tenant.address}</div></div></div>
              <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Created</div><div className="font-medium">{tenant.createdAt}</div></div></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Subscription Details</h2>
            <div className="space-y-3">
              <div><div className="text-sm text-gray-600">Plan</div><div className="font-medium text-lg">{tenant.plan}</div></div>
              <div><div className="text-sm text-gray-600">Billing Cycle</div><div className="font-medium capitalize">{tenant.billingCycle}</div></div>
              <div><div className="text-sm text-gray-600">Monthly Rate</div><div className="font-semibold text-xl">${tenant.revenue.toLocaleString()}</div></div>
              <div><div className="text-sm text-gray-600">User Utilization</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(tenant.users / tenant.maxUsers) * 100}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{tenant.users} / {tenant.maxUsers} users ({((tenant.users / tenant.maxUsers) * 100).toFixed(0)}%)</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Feature Toggles</h2>
          <div className="grid grid-cols-3 gap-4">{features.map((feature, idx) => (<div key={idx} className="flex items-center justify-between p-3 border rounded-lg">{feature.enabled ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-gray-400" />}<span className={feature.enabled ? 'font-medium' : 'text-gray-500'}>{feature.name}</span></div>))}</div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead><tbody className="divide-y divide-gray-200">{recentInvoices.map((invoice) => (<tr key={invoice.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-mono text-sm">{invoice.id}</td><td className="px-4 py-3 text-sm">{invoice.date}</td><td className="px-4 py-3 text-sm font-semibold">${invoice.amount.toLocaleString()}</td><td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{invoice.status}</span></td></tr>))}</tbody></table></div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>);
}
