'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Shield, Plus, Edit2, Trash2, CheckSquare } from 'lucide-react';

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
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'Admin', code: 'ADMIN', description: 'Full system access', userCount: 3, permissions: 125, status: 'active' },
    { id: '2', name: 'Manager', code: 'MANAGER', description: 'Manage team and view reports', userCount: 12, permissions: 85, status: 'active' },
    { id: '3', name: 'Van Sales Agent', code: 'VAN_SALES', description: 'Van sales operations', userCount: 45, permissions: 32, status: 'active' },
    { id: '4', name: 'Promoter', code: 'PROMOTER', description: 'Promotional activities', userCount: 28, permissions: 25, status: 'active' },
    { id: '5', name: 'Merchandiser', code: 'MERCHANDISER', description: 'Merchandising and shelf audits', userCount: 19, permissions: 28, status: 'active' },
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
      key: 'status',
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
      key: 'actions',
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
    window.location.href = `/admin/roles/${.id}/permissions`;
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  return (
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
            searchable
            searchPlaceholder="Search roles..."
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
  );
}
