#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define all entities from the Prisma schema
const entities = [
  // Core entities
  { name: 'regions', displayName: 'Regions', icon: 'MapPin', description: 'Geographic regions management' },
  { name: 'areas', displayName: 'Areas', icon: 'Map', description: 'Area management within regions' },
  { name: 'route-stops', displayName: 'Route Stops', icon: 'Navigation', description: 'Route stop management' },
  { name: 'invoices', displayName: 'Invoices', icon: 'FileText', description: 'Invoice management' },
  { name: 'campaigns', displayName: 'Campaigns', icon: 'Megaphone', description: 'Marketing campaign management' },
  { name: 'promoter-activities', displayName: 'Promoter Activities', icon: 'Activity', description: 'Promoter activity tracking' },
  { name: 'stores', displayName: 'Stores', icon: 'Store', description: 'Store management' },
  { name: 'merchandising-visits', displayName: 'Merchandising Visits', icon: 'Eye', description: 'Merchandising visit tracking' },
  { name: 'sim-distributions', displayName: 'SIM Distributions', icon: 'Smartphone', description: 'SIM card distribution tracking' },
  { name: 'inventory-movements', displayName: 'Inventory Movements', icon: 'ArrowUpDown', description: 'Inventory movement tracking' },
  { name: 'van-sales-loads', displayName: 'Van Sales Loads', icon: 'Truck', description: 'Van sales load management' },
  { name: 'van-sales-reconciliation', displayName: 'Van Sales Reconciliation', icon: 'Calculator', description: 'Van sales reconciliation' },
  { name: 'price-history', displayName: 'Price History', icon: 'TrendingUp', description: 'Product price history' },
  { name: 'audit-logs', displayName: 'Audit Logs', icon: 'Shield', description: 'System audit logs' },
  { name: 'file-uploads', displayName: 'File Uploads', icon: 'Upload', description: 'File upload management' },
  
  // Specialized dashboards
  { name: 'van-sales/dashboard', displayName: 'Van Sales Dashboard', icon: 'Truck', description: 'Van sales operations dashboard', type: 'dashboard' },
  { name: 'promoter/dashboard', displayName: 'Promoter Dashboard', icon: 'Megaphone', description: 'Promoter activities dashboard', type: 'dashboard' },
  { name: 'merchandiser/dashboard', displayName: 'Merchandiser Dashboard', icon: 'Eye', description: 'Merchandising dashboard', type: 'dashboard' },
  { name: 'manager/dashboard', displayName: 'Manager Dashboard', icon: 'BarChart3', description: 'Management dashboard', type: 'dashboard' },
  { name: 'warehouse/dashboard', displayName: 'Warehouse Dashboard', icon: 'Package', description: 'Warehouse operations dashboard', type: 'dashboard' },
  
  // Reporting pages
  { name: 'reports/sales', displayName: 'Sales Reports', icon: 'TrendingUp', description: 'Sales performance reports', type: 'report' },
  { name: 'reports/inventory', displayName: 'Inventory Reports', icon: 'Package', description: 'Inventory status reports', type: 'report' },
  { name: 'reports/commissions', displayName: 'Commission Reports', icon: 'DollarSign', description: 'Commission calculation reports', type: 'report' },
  { name: 'reports/performance', displayName: 'Performance Reports', icon: 'BarChart', description: 'Performance analytics reports', type: 'report' },
  { name: 'reports/financial', displayName: 'Financial Reports', icon: 'PieChart', description: 'Financial analysis reports', type: 'report' },
  
  // Management pages
  { name: 'settings/system', displayName: 'System Settings', icon: 'Settings', description: 'System configuration', type: 'settings' },
  { name: 'settings/tenant', displayName: 'Tenant Settings', icon: 'Building', description: 'Tenant configuration', type: 'settings' },
  { name: 'settings/notifications', displayName: 'Notification Settings', icon: 'Bell', description: 'Notification configuration', type: 'settings' },
  { name: 'settings/integrations', displayName: 'Integrations', icon: 'Zap', description: 'Third-party integrations', type: 'settings' },
  { name: 'settings/backup', displayName: 'Backup & Restore', icon: 'Database', description: 'Data backup and restore', type: 'settings' },
];

// Template for entity list pages
const entityPageTemplate = (entity) => `'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'

interface ${entity.displayName.replace(/\s+/g, '')} {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function ${entity.displayName.replace(/\s+/g, '')}Page() {
  const [data, setData] = useState<${entity.displayName.replace(/\s+/g, '')}[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<${entity.displayName.replace(/\s+/g, '')} | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Mock data for development
  const mockData: ${entity.displayName.replace(/\s+/g, '')}[] = [
    {
      id: '1',
      name: 'Sample ${entity.displayName.slice(0, -1)}',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/${entity.name}')
      // const result = await response.json()
      
      // Using mock data for now
      setTimeout(() => {
        setData(mockData)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching data:', error)
      setData(mockData)
      setLoading(false)
    }
  }

  const handleCreate = async (itemData: Partial<${entity.displayName.replace(/\s+/g, '')}>) => {
    try {
      // TODO: Replace with actual API call
      console.log('Creating item:', itemData)
      setShowCreateModal(false)
      fetchData()
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleEdit = async (itemData: Partial<${entity.displayName.replace(/\s+/g, '')}>) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating item:', itemData)
      setShowEditModal(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        // TODO: Replace with actual API call
        console.log('Deleting item:', itemId)
        fetchData()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (item: ${entity.displayName.replace(/\s+/g, '')}) => (
        <span className="font-medium">{item.name}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ${entity.displayName.replace(/\s+/g, '')}) => (
        <Badge variant={item.status === 'active' ? 'success' : 'error'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: ${entity.displayName.replace(/\s+/g, '')}) => (
        <span className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: ${entity.displayName.replace(/\s+/g, '')}) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItem(item)
              setShowEditModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">${entity.displayName}</h1>
          <p className="text-gray-600">${entity.description}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add ${entity.displayName.slice(0, -1)}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search ${entity.displayName.toLowerCase()}..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <SimpleTable
          data={filteredData}
          columns={columns}
          emptyMessage="No ${entity.displayName.toLowerCase()} found"
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create ${entity.displayName.slice(0, -1)}"
      >
        <div className="p-4">
          <p>Create form for ${entity.displayName.toLowerCase()} will be implemented here.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedItem(null)
        }}
        title="Edit ${entity.displayName.slice(0, -1)}"
      >
        <div className="p-4">
          <p>Edit form for ${entity.displayName.toLowerCase()} will be implemented here.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowEditModal(false)
              setSelectedItem(null)
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowEditModal(false)
              setSelectedItem(null)
            }}>
              Update
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}`;

// Template for dashboard pages
const dashboardPageTemplate = (entity) => `'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { ${entity.icon} } from 'lucide-react'

export default function ${entity.displayName.replace(/\s+/g, '')}Page() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>({})

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      setTimeout(() => {
        setDashboardData({
          totalItems: 150,
          activeItems: 120,
          pendingItems: 30,
          completedToday: 25
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <${entity.icon} className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">${entity.displayName}</h1>
          <p className="text-gray-600">${entity.description}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalItems}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <${entity.icon} className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{dashboardData.activeItems}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.pendingItems}</p>
            </div>
            <Badge variant="warning">Pending</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardData.completedToday}</p>
            </div>
            <Badge variant="info">Today</Badge>
          </div>
        </Card>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Activity 1</span>
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Activity 2</span>
              <Badge variant="warning">Pending</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Activity 3</span>
              <Badge variant="info">In Progress</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completion Rate</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Efficiency</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}`;

// Template for report pages
const reportPageTemplate = (entity) => `'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Download, Filter, Calendar, ${entity.icon} } from 'lucide-react'

export default function ${entity.displayName.replace(/\s+/g, '')}Page() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>({})
  const [dateRange, setDateRange] = useState('last30days')

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      setTimeout(() => {
        setReportData({
          summary: {
            totalRecords: 1250,
            growth: 12.5,
            avgValue: 450.75
          },
          chartData: [
            { name: 'Jan', value: 400 },
            { name: 'Feb', value: 300 },
            { name: 'Mar', value: 600 },
            { name: 'Apr', value: 800 },
            { name: 'May', value: 500 }
          ]
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setLoading(false)
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <${entity.icon} className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">${entity.displayName}</h1>
            <p className="text-gray-600">${entity.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="lastyear">Last Year</option>
          </select>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalRecords}</p>
            </div>
            <div className="text-green-600 text-sm font-medium">
              +{reportData.summary?.growth}%
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${reportData.summary?.avgValue}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {reportData.summary?.growth}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Chart visualization will be implemented here</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h3>
          <div className="space-y-3">
            {reportData.chartData?.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}`;

// Template for settings pages
const settingsPageTemplate = (entity) => `'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Save, ${entity.icon} } from 'lucide-react'

export default function ${entity.displayName.replace(/\s+/g, '')}Page() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      setTimeout(() => {
        setSettings({
          setting1: 'value1',
          setting2: true,
          setting3: 'option1'
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Replace with actual API call
      console.log('Saving settings:', settings)
      setTimeout(() => {
        setSaving(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <${entity.icon} className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">${entity.displayName}</h1>
            <p className="text-gray-600">${entity.description}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Settings Form */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setting 1
            </label>
            <input
              type="text"
              value={settings.setting1 || ''}
              onChange={(e) => setSettings({ ...settings, setting1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="setting2"
              checked={settings.setting2 || false}
              onChange={(e) => setSettings({ ...settings, setting2: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="setting2" className="ml-2 block text-sm text-gray-700">
              Enable Setting 2
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setting 3
            </label>
            <select
              value={settings.setting3 || ''}
              onChange={(e) => setSettings({ ...settings, setting3: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  )
}`;

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to generate page
function generatePage(entity) {
  const dirPath = path.join(__dirname, '..', 'app', entity.name);
  ensureDirectoryExists(dirPath);
  
  const filePath = path.join(dirPath, 'page.tsx');
  
  let template;
  switch (entity.type) {
    case 'dashboard':
      template = dashboardPageTemplate(entity);
      break;
    case 'report':
      template = reportPageTemplate(entity);
      break;
    case 'settings':
      template = settingsPageTemplate(entity);
      break;
    default:
      template = entityPageTemplate(entity);
  }
  
  fs.writeFileSync(filePath, template);
  console.log(`✅ Created: ${entity.name}/page.tsx`);
}

// Generate all pages
console.log('🏗️ Generating comprehensive frontend pages...');
console.log('==========================================');

entities.forEach(entity => {
  try {
    generatePage(entity);
  } catch (error) {
    console.error(`❌ Error creating ${entity.name}:`, error.message);
  }
});

console.log('');
console.log(`🎉 Generated ${entities.length} pages successfully!`);
console.log('');
console.log('📊 Summary:');
console.log(`- Entity pages: ${entities.filter(e => !e.type).length}`);
console.log(`- Dashboard pages: ${entities.filter(e => e.type === 'dashboard').length}`);
console.log(`- Report pages: ${entities.filter(e => e.type === 'report').length}`);
console.log(`- Settings pages: ${entities.filter(e => e.type === 'settings').length}`);