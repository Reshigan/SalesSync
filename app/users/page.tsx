'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SimpleTable as DataTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Shield,
  Mail,
  Calendar,
  Settings,
  UserCheck,
  UserX
} from 'lucide-react'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  tenant_id: string
  created_at: string
  last_login: string
  permissions: string[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const tenantCode = localStorage.getItem('tenantCode') || 'DEMO'
      
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Code': tenantCode,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const result = await response.json()
      setUsers(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mock data for development
      setUsers([
        {
          id: '1',
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@demo.com',
          role: 'admin',
          status: 'active',
          tenant_id: 'demo',
          created_at: '2024-01-01T00:00:00Z',
          last_login: '2025-10-06T08:30:00Z',
          permissions: ['all']
        },
        {
          id: '2',
          first_name: 'Sales',
          last_name: 'Manager',
          email: 'manager@demo.com',
          role: 'manager',
          status: 'active',
          tenant_id: 'demo',
          created_at: '2024-02-15T00:00:00Z',
          last_login: '2025-10-05T16:45:00Z',
          permissions: ['sales', 'reports', 'agents']
        },
        {
          id: '3',
          first_name: 'Field',
          last_name: 'Agent',
          email: 'agent@demo.com',
          role: 'agent',
          status: 'active',
          tenant_id: 'demo',
          created_at: '2024-03-10T00:00:00Z',
          last_login: '2025-10-04T12:20:00Z',
          permissions: ['orders', 'customers', 'products']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'success' as const },
      inactive: { label: 'Inactive', variant: 'warning' as const },
      pending: { label: 'Pending', variant: 'info' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', variant: 'error' as const },
      manager: { label: 'Manager', variant: 'warning' as const },
      agent: { label: 'Agent', variant: 'info' as const },
      user: { label: 'User', variant: 'default' as const }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const userStats = {
    totalUsers: users.length,
    activeUsers: users.filter(user => user.status === 'active').length,
    adminUsers: users.filter(user => user.role === 'admin').length,
    pendingUsers: users.filter(user => user.status === 'pending').length
  }

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="w-4 h-4 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => getRoleBadge(user.role)
    },
    {
      key: 'status',
      label: 'Status',
      render: (user: User) => getStatusBadge(user.status)
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (user: User) => (
        <div className="flex flex-wrap gap-1">
          {user.permissions.slice(0, 3).map((permission, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission}
            </Badge>
          ))}
          {user.permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{user.permissions.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (user: User) => (
        <div className="text-sm text-gray-600">
          {formatDate(user.created_at)}
        </div>
      )
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (user: User) => (
        <div className="text-sm text-gray-600">
          {formatDate(user.last_login)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          {user.status === 'active' ? (
            <Button variant="outline" size="sm">
              <UserX className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <UserCheck className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{userStats.activeUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-red-600">{userStats.adminUsers}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{userStats.pendingUsers}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="agent">Agent</option>
              <option value="user">User</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUsers}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          <DataTable
            data={filteredUsers}
            columns={columns}
            loading={loading}
            emptyMessage="No users found"
          />
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select role</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="agent">Agent</option>
              <option value="user">User</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button>
              Add User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}