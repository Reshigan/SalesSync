'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Download,
  Upload,
  CreditCard,
  TrendingUp,
  Shield
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  users: number;
  maxUsers: number;
  revenue: number;
  createdAt: string;
  trialEnds?: string;
  billingCycle: 'monthly' | 'annual';
  industry: string;
  country: string;
}

export default function TenantsManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: '1',
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
    },
    {
      id: '2',
      name: 'PepsiCo Nigeria',
      email: 'admin@pepsico.ng',
      phone: '+234-800-234-5678',
      plan: 'Enterprise',
      status: 'active',
      users: 198,
      maxUsers: 500,
      revenue: 12000,
      createdAt: '2024-02-01',
      billingCycle: 'annual',
      industry: 'Beverages',
      country: 'Nigeria',
    },
    {
      id: '3',
      name: 'Unilever Nigeria',
      email: 'admin@unilever.ng',
      phone: '+234-800-345-6789',
      plan: 'Professional',
      status: 'active',
      users: 156,
      maxUsers: 200,
      revenue: 8000,
      createdAt: '2024-02-15',
      billingCycle: 'monthly',
      industry: 'FMCG',
      country: 'Nigeria',
    },
    {
      id: '4',
      name: 'MTN Nigeria',
      email: 'admin@mtn.ng',
      phone: '+234-800-456-7890',
      plan: 'Enterprise',
      status: 'active',
      users: 445,
      maxUsers: 1000,
      revenue: 25000,
      createdAt: '2023-11-10',
      billingCycle: 'annual',
      industry: 'Telecommunications',
      country: 'Nigeria',
    },
    {
      id: '5',
      name: 'Nestle Nigeria',
      email: 'admin@nestle.ng',
      phone: '+234-800-567-8901',
      plan: 'Professional',
      status: 'trial',
      users: 123,
      maxUsers: 200,
      revenue: 0,
      createdAt: '2024-09-20',
      trialEnds: '2024-10-20',
      billingCycle: 'monthly',
      industry: 'Food & Nutrition',
      country: 'Nigeria',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.status === 'active').length,
    trialTenants: tenants.filter(t => t.status === 'trial').length,
    totalRevenue: tenants.reduce((sum, t) => sum + t.revenue, 0),
  };

  const columns = [
    {
      accessor: 'name',
      header: 'Tenant Name',
      sortable: true,
      cell: ({ row }: { row: Tenant }) => (
        <div className="flex items-center">
          <Building2 className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessor: 'plan',
      header: 'Plan',
      cell: ({ value }: { value: string }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
          value === 'Professional' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      accessor: 'users',
      header: 'Users',
      sortable: true,
      cell: ({ row }: { row: Tenant }) => (
        <div className="text-sm">
          <div className="font-medium">{row.users} / {row.maxUsers}</div>
          <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${(row.users / row.maxUsers) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessor: 'revenue',
      header: 'Revenue',
      sortable: true,
      cell: ({ value }: { value: number }) => (
        <span className="font-medium">${value.toLocaleString()}/mo</span>
      ),
    },
    {
      accessor: 'status',
      header: 'Status',
      cell: ({ row }: { row: Tenant }) => (
        <div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'active' ? 'bg-green-100 text-green-800' :
            row.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
            row.status === 'suspended' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {row.status}
          </span>
          {row.trialEnds && (
            <div className="text-xs text-gray-500 mt-1">
              Ends: {row.trialEnds}
            </div>
          )}
        </div>
      ),
    },
    {
      accessor: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: ({ value }: { value: string }) => (
        <div className="text-sm text-gray-600">{value}</div>
      ),
    },
    {
      accessor: 'id',
      header: 'Actions',
      cell: ({ row }: { row: Tenant }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.location.href = `/super-admin/tenants/${row.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingTenant(row);
              setShowModal(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.location.href = `/super-admin/billing/${row.id}`}
          >
            <CreditCard className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600 mt-1">Manage all tenant organizations</p>
          </div>
          <Button onClick={() => { setEditingTenant(null); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Tenants</p>
                <p className="text-3xl font-bold text-purple-900">{stats.totalTenants}</p>
              </div>
              <Building2 className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-900">{stats.activeTenants}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Trial</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.trialTenants}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">MRR</p>
                <p className="text-3xl font-bold text-blue-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </Card>

        {/* Tenants Table */}
        <Card>
          <DataTable data={tenants} columns={columns} />
        </Card>
      </div>

      {/* Create/Edit Tenant Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
          <Input
            label="Company Name"
            placeholder="Enter company name"
            defaultValue={editingTenant?.name}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="admin@company.com"
            defaultValue={editingTenant?.email}
            required
          />
          <Input
            label="Phone"
            placeholder="+234-800-000-0000"
            defaultValue={editingTenant?.phone}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              defaultValue={editingTenant?.plan}
            >
              <option value="Starter">Starter - $49/mo</option>
              <option value="Professional">Professional - $199/mo</option>
              <option value="Enterprise">Enterprise - $499/mo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              defaultValue={editingTenant?.billingCycle}
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual (Save 20%)</option>
            </select>
          </div>
          <Input
            label="Max Users"
            type="number"
            placeholder="100"
            defaultValue={editingTenant?.maxUsers}
            required
          />
          <Input
            label="Industry"
            placeholder="e.g., FMCG, Telecommunications"
            defaultValue={editingTenant?.industry}
          />
          <Input
            label="Country"
            placeholder="e.g., Nigeria"
            defaultValue={editingTenant?.country}
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTenant ? 'Update Tenant' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
