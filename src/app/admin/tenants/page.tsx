'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Building2, Plus, Edit2, Settings, Users } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  code: string;
  industry: string;
  users: number;
  status: 'active' | 'suspended' | 'trial';
  plan: string;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: '1', name: 'Demo Company', code: 'DEMO', industry: 'FMCG', users: 107, status: 'active', plan: 'Enterprise', createdAt: '2024-01-15' },
    { id: '2', name: 'Beverage Corp', code: 'BEV', industry: 'Beverages', users: 245, status: 'active', plan: 'Professional', createdAt: '2024-02-01' },
    { id: '3', name: 'Pharma Plus', code: 'PHRM', industry: 'Pharmaceutical', users: 89, status: 'trial', plan: 'Trial', createdAt: '2024-09-15' },
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const columns = [
    { accessor: 'name', header: 'Tenant Name', sortable: true },
    { accessor: 'code', header: 'Code' },
    { accessor: 'industry', header: 'Industry' },
    { accessor: 'plan', header: 'Plan' },
    { accessor: 'users', header: 'Users', sortable: true },
    {
      accessor: 'status',
      header: 'Status',
      cell: ({ row }: { row: Tenant }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'trial' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { accessor: 'createdAt', header: 'Created', sortable: true },
    {
      accessor: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: Tenant }) => (
        <div className="flex gap-2">
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
            onClick={() => window.location.href = `/admin/tenants/${row.id}/settings`}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600 mt-1">Manage organizations and their configurations</p>
          </div>
          <Button onClick={() => { setEditingTenant(null); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trial</p>
                <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'trial').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.users, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        <Card>
          <DataTable
            data={tenants}
            columns={columns}
          />
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
          <Input
            label="Tenant Name"
            placeholder="Enter tenant name"
            defaultValue={editingTenant?.name}
            required
          />
          <Input
            label="Code"
            placeholder="Enter tenant code"
            defaultValue={editingTenant?.code}
            required
          />
          <Input
            label="Industry"
            placeholder="Enter industry"
            defaultValue={editingTenant?.industry}
            required
          />
          <div className="flex gap-2 justify-end">
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
