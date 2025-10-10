'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Shield, Plus, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  userCount: number;
  permissions: number;
  status: 'active' | 'inactive';
}

export default function RolesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  // 10 Default System Roles for SalesSync
  const [roles, setRoles] = useState<Role[]>([
    { 
      id: '1', 
      name: 'Super Admin', 
      code: 'SUPER_ADMIN', 
      description: 'Full system access with tenant management', 
      userCount: 2, 
      permissions: 150, 
      status: 'active' 
    },
    { 
      id: '2', 
      name: 'Admin', 
      code: 'ADMIN', 
      description: 'Full access within tenant organization', 
      userCount: 5, 
      permissions: 125, 
      status: 'active' 
    },
    { 
      id: '3', 
      name: 'Sales Manager', 
      code: 'SALES_MANAGER', 
      description: 'Manage sales team, view all reports, approve orders', 
      userCount: 8, 
      permissions: 95, 
      status: 'active' 
    },
    { 
      id: '4', 
      name: 'Warehouse Manager', 
      code: 'WAREHOUSE_MANAGER', 
      description: 'Manage inventory, warehouse operations, stock movements', 
      userCount: 6, 
      permissions: 75, 
      status: 'active' 
    },
    { 
      id: '5', 
      name: 'Finance Manager', 
      code: 'FINANCE_MANAGER', 
      description: 'Manage invoices, payments, commissions, financial reports', 
      userCount: 4, 
      permissions: 68, 
      status: 'active' 
    },
    { 
      id: '6', 
      name: 'Van Sales Agent', 
      code: 'VAN_SALES', 
      description: 'Route sales, order taking, cash collection, van loading', 
      userCount: 45, 
      permissions: 42, 
      status: 'active' 
    },
    { 
      id: '7', 
      name: 'Field Sales Agent', 
      code: 'FIELD_AGENT', 
      description: 'Customer visits, order taking, basic merchandising', 
      userCount: 38, 
      permissions: 35, 
      status: 'active' 
    },
    { 
      id: '8', 
      name: 'Merchandiser', 
      code: 'MERCHANDISER', 
      description: 'Shelf audits, planogram compliance, stock visibility', 
      userCount: 25, 
      permissions: 28, 
      status: 'active' 
    },
    { 
      id: '9', 
      name: 'Promoter', 
      code: 'PROMOTER', 
      description: 'Promotional activities, sampling, customer engagement', 
      userCount: 32, 
      permissions: 22, 
      status: 'active' 
    },
    { 
      id: '10', 
      name: 'Data Analyst', 
      code: 'ANALYST', 
      description: 'View-only access to reports, analytics, and dashboards', 
      userCount: 12, 
      permissions: 18, 
      status: 'active' 
    },
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const columns = [
    { accessor: 'name', header: 'Role Name', sortable: true },
    { accessor: 'code', header: 'Code' },
    { accessor: 'description', header: 'Description' },
    { accessor: 'userCount', header: 'Users', sortable: true },
    { accessor: 'permissions', header: 'Permissions', sortable: true },
    {
      accessor: 'status',
      header: 'Status',
      cell: ({ row }: { row: Role }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      accessor: 'id',
      header: 'Actions',
      cell: ({ row }: { row: Role }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingRole(row);
              setShowModal(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleManagePermissions(row)}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleManagePermissions = (role: Role) => {
    // Navigate to permissions page
    window.location.href = `/admin/roles/${role.id}/permissions`;
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Manage system roles and access control</p>
          </div>
          <Button onClick={() => { setEditingRole(null); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.status === 'active').length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{roles.reduce((sum, r) => sum + r.userCount, 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Permissions</p>
                <p className="text-2xl font-bold">
                  {Math.round(roles.reduce((sum, r) => sum + r.permissions, 0) / roles.length)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <DataTable
            data={roles}
            columns={columns}
          />
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? 'Edit Role' : 'Add New Role'}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
          <Input
            label="Role Name"
            placeholder="Enter role name"
            defaultValue={editingRole?.name}
            required
          />
          <Input
            label="Code"
            placeholder="Enter role code (e.g., VAN_SALES)"
            defaultValue={editingRole?.code}
            required
          />
          <Input
            label="Description"
            placeholder="Enter role description"
            defaultValue={editingRole?.description}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  
</ErrorBoundary>);
}
