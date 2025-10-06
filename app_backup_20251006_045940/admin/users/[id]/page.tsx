'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Phone, MapPin, Shield, Activity, Calendar, Clock, CheckCircle, Package, DollarSign, TrendingUp } from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id;

  const user = {
    id: userId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+234-801-234-5678',
    roles: ['Van Sales Agent', 'Field Agent'],
    tenant: 'Coca Cola Nigeria',
    location: 'Lagos, Nigeria',
    status: 'active',
    since: '2024-01-15',
    lastLogin: '2024-10-01 09:30 AM',
    lastActive: '2 hours ago',
    permissions: ['van_sales', 'customer_management', 'inventory_view', 'order_creation'],
  };

  const performance = {
    ordersCreated: 234,
    totalRevenue: 4560000,
    customersVisited: 145,
    averageOrderValue: 19487,
  };

  const recentActivity = [
    { date: '2024-10-01 14:30', action: 'Created Order', details: 'ORD-2024-001 for Shoprite Lagos' },
    { date: '2024-10-01 11:15', action: 'Completed Visit', details: 'Visit to Game Stores Abuja' },
    { date: '2024-10-01 09:30', action: 'Logged In', details: 'From mobile device' },
    { date: '2024-09-30 16:45', action: 'Updated Customer', details: 'CUST-045 contact information' },
  ];

  const loginHistory = [
    { date: '2024-10-01 09:30 AM', device: 'Mobile - Android', ip: '192.168.1.1', location: 'Lagos, Nigeria' },
    { date: '2024-09-30 08:15 AM', device: 'Mobile - Android', ip: '192.168.1.1', location: 'Lagos, Nigeria' },
    { date: '2024-09-29 09:00 AM', device: 'Web - Chrome', ip: '192.168.1.2', location: 'Lagos, Nigeria' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{user.status}</span>
            </div>
            <p className="text-gray-600 mt-1">{user.email} • {user.tenant}</p>
          </div>
          <Button><User className="h-4 w-4 mr-2" />Edit User</Button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600 font-medium">Orders Created</p>
                <p className="text-2xl font-bold text-blue-900">{performance.ordersCreated}</p></div>
              <Package className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">₦{(performance.totalRevenue/1000000).toFixed(1)}M</p></div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-600 font-medium">Customers Visited</p>
                <p className="text-2xl font-bold text-purple-900">{performance.customersVisited}</p></div>
              <Activity className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-orange-600 font-medium">Avg Order Value</p>
                <p className="text-2xl font-bold text-orange-900">₦{(performance.averageOrderValue/1000).toFixed(0)}K</p></div>
              <TrendingUp className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Email</div><div className="font-medium">{user.email}</div></div></div>
              <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Phone</div><div className="font-medium">{user.phone}</div></div></div>
              <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Location</div><div className="font-medium">{user.location}</div></div></div>
              <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Member Since</div><div className="font-medium">{user.since}</div></div></div>
              <div className="flex items-start gap-3"><Clock className="h-5 w-5 text-gray-400 mt-0.5" /><div><div className="text-sm text-gray-600">Last Active</div><div className="font-medium">{user.lastActive}</div></div></div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Roles & Permissions</h2>
            <div className="space-y-3">
              <div><div className="text-sm text-gray-600 mb-2">Assigned Roles</div>
                <div className="flex flex-wrap gap-2">{user.roles.map((role, idx) => (<span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-md text-sm font-medium flex items-center"><Shield className="h-3 w-3 mr-1" />{role}</span>))}</div>
              </div>
              <div className="pt-3 border-t"><div className="text-sm text-gray-600 mb-2">Permissions</div>
                <div className="grid grid-cols-2 gap-2">{user.permissions.map((perm, idx) => (<div key={idx} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-600" /><span>{perm}</span></div>))}</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">{recentActivity.map((activity, idx) => (<div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"><Activity className="h-5 w-5 text-blue-600 mt-0.5" /><div className="flex-1"><div className="font-medium">{activity.action}</div><div className="text-sm text-gray-600">{activity.details}</div><div className="text-xs text-gray-500 mt-1">{activity.date}</div></div></div>))}</div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Login History</h2>
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th></tr></thead><tbody className="divide-y divide-gray-200">{loginHistory.map((login, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{login.date}</td><td className="px-4 py-3 text-sm">{login.device}</td><td className="px-4 py-3 text-sm font-mono">{login.ip}</td><td className="px-4 py-3 text-sm">{login.location}</td></tr>))}</tbody></table></div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
