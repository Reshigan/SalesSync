'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { FormField, FormInput, FormSelect } from '@/components/ui/Form'
import { 
  Users, 
  UserPlus,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  tenant: string
  location: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  createdAt: string
  permissions: string[]
}

export default function UsersPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTenant, setFilterTenant] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Mock data
  const users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+234-801-234-5678',
      role: 'Van Sales Agent',
      tenant: 'Coca Cola Nigeria',
      location: 'Lagos, Nigeria',
      status: 'active',
      lastLogin: '2024-10-01 09:30 AM',
      createdAt: '2024-01-15',
      permissions: ['van_sales', 'customer_management', 'inventory_view'],
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      phone: '+234-802-345-6789',
      role: 'Promoter',
      tenant: 'PepsiCo Nigeria',
      location: 'Abuja, Nigeria',
      status: 'active',
      lastLogin: '2024-10-01 08:15 AM',
      createdAt: '2024-02-20',
      permissions: ['promotions', 'surveys', 'photo_upload'],
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      phone: '+234-803-456-7890',
      role: 'Merchandiser',
      tenant: 'Unilever Nigeria',
      location: 'Port Harcourt, Nigeria',
      status: 'inactive',
      lastLogin: '2024-09-28 05:45 PM',
      createdAt: '2024-03-10',
      permissions: ['merchandising', 'shelf_audit', 'competitor_intel'],
    },
    {
      id: '4',
      name: 'David Brown',
      email: 'david.brown@example.com',
      phone: '+234-804-567-8901',
      role: 'Field Agent',
      tenant: 'MTN Nigeria',
      location: 'Kano, Nigeria',
      status: 'suspended',
      lastLogin: '2024-09-25 02:20 PM',
      createdAt: '2024-04-05',
      permissions: ['sim_distribution', 'kyc_verification', 'voucher_sales'],
    },
    {
      id: '5',
      name: 'Lisa Garcia',
      email: 'lisa.garcia@example.com',
      phone: '+234-805-678-9012',
      role: 'Warehouse Manager',
      tenant: 'Nestle Nigeria',
      location: 'Lagos, Nigeria',
      status: 'active',
      lastLogin: '2024-10-01 07:00 AM',
      createdAt: '2024-01-30',
      permissions: ['inventory_management', 'purchase_orders', 'stock_counts'],
    },
  ]

  const userStats = {
    totalUsers: 1247,
    activeUsers: 1156,
    inactiveUsers: 67,
    suspendedUsers: 24,
    newUsersThisMonth: 89,
    loginRate: 92.3,
  }

  const roles = [
    { value: 'van_sales_agent', label: 'Van Sales Agent' },
    { value: 'promoter', label: 'Promoter' },
    { value: 'merchandiser', label: 'Merchandiser' },
    { value: 'field_agent', label: 'Field Agent' },
    { value: 'warehouse_manager', label: 'Warehouse Manager' },
    { value: 'back_office', label: 'Back Office' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
  ]

  const tenants = [
    { value: 'coca_cola', label: 'Coca Cola Nigeria' },
    { value: 'pepsico', label: 'PepsiCo Nigeria' },
    { value: 'unilever', label: 'Unilever Nigeria' },
    { value: 'nestle', label: 'Nestle Nigeria' },
    { value: 'mtn', label: 'MTN Nigeria' },
  ]

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role.toLowerCase().includes(filterRole)
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    const matchesTenant = filterTenant === 'all' || user.tenant.toLowerCase().includes(filterTenant)
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    return matchesRole && matchesStatus && matchesTenant && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-600" />
      case 'suspended':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditUserModal(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Users
            </Button>
            <Button onClick={() => setShowNewUserModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{userStats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{userStats.activeUsers.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-600">{userStats.inactiveUsers}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{userStats.suspendedUsers}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.newUsersThisMonth}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Login Rate</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.loginRate}%</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Tenants</option>
                {tenants.map(tenant => (
                  <option key={tenant.value} value={tenant.value}>{tenant.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Users</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'User', 
                  accessor: 'name',
                  cell: ({ row }) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {row.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{row.name}</p>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{row.email}</span>
                        </div>
                      </div>
                    </div>
                  )
                },
                { 
                  header: 'Contact', 
                  accessor: 'phone',
                  cell: ({ row }) => (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{row.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{row.location}</span>
                      </div>
                    </div>
                  )
                },
                { 
                  header: 'Role', 
                  accessor: 'role',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Tenant', 
                  accessor: 'tenant',
                  cell: ({ value }) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {value}
                    </span>
                  )
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(value)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    </div>
                  )
                },
                { 
                  header: 'Last Login', 
                  accessor: 'lastLogin',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(row)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredUsers}
            />
          </Card.Content>
        </Card>

        {/* New User Modal */}
        <Modal
          isOpen={showNewUserModal}
          onClose={() => setShowNewUserModal(false)}
          title="Add New User"
          size="lg"
        >
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <FormInput placeholder="Enter full name" />
              </FormField>
              <FormField label="Email Address" required>
                <FormInput type="email" placeholder="Enter email address" />
              </FormField>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Phone Number" required>
                <FormInput placeholder="Enter phone number" />
              </FormField>
              <FormField label="Role" required>
                <FormSelect options={roles} placeholder="Select role" />
              </FormField>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tenant" required>
                <FormSelect options={tenants} placeholder="Select tenant" />
              </FormField>
              <FormField label="Location">
                <FormInput placeholder="Enter location" />
              </FormField>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewUserModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create User
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditUserModal}
          onClose={() => setShowEditUserModal(false)}
          title="Edit User"
          size="lg"
        >
          {selectedUser && (
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <FormInput defaultValue={selectedUser.name} />
                </FormField>
                <FormField label="Email Address" required>
                  <FormInput type="email" defaultValue={selectedUser.email} />
                </FormField>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Phone Number" required>
                  <FormInput defaultValue={selectedUser.phone} />
                </FormField>
                <FormField label="Role" required>
                  <FormSelect options={roles} defaultValue={selectedUser.role.toLowerCase().replace(' ', '_')} />
                </FormField>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Status" required>
                  <FormSelect 
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'suspended', label: 'Suspended' },
                    ]}
                    defaultValue={selectedUser.status}
                  />
                </FormField>
                <FormField label="Location">
                  <FormInput defaultValue={selectedUser.location} />
                </FormField>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update User
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}