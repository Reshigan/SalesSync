'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner, SkeletonTable } from '@/components/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  Building,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  Map
} from 'lucide-react'

interface Region {
  id: string
  code: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Aggregated data
  areasCount: number
  routesCount: number
  customersCount: number
  agentsCount: number
  totalRevenue: number
  lastActivity: string
}

export default function RegionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)

  const { canCreateIn, canEditIn, canDeleteIn, canExportFrom } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockRegions: Region[] = [
      {
        id: '1',
        code: 'SW',
        name: 'South West',
        description: 'Lagos, Ogun, Oyo, Osun, Ondo, Ekiti states',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-30',
        areasCount: 8,
        routesCount: 45,
        customersCount: 1250,
        agentsCount: 32,
        totalRevenue: 125000000,
        lastActivity: '2024-09-30'
      },
      {
        id: '2',
        code: 'SS',
        name: 'South South',
        description: 'Rivers, Delta, Bayelsa, Akwa Ibom, Cross River, Edo states',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-29',
        areasCount: 6,
        routesCount: 28,
        customersCount: 890,
        agentsCount: 22,
        totalRevenue: 78000000,
        lastActivity: '2024-09-29'
      },
      {
        id: '3',
        code: 'SE',
        name: 'South East',
        description: 'Anambra, Imo, Abia, Enugu, Ebonyi states',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-28',
        areasCount: 5,
        routesCount: 22,
        customersCount: 670,
        agentsCount: 18,
        totalRevenue: 56000000,
        lastActivity: '2024-09-28'
      },
      {
        id: '4',
        code: 'NC',
        name: 'North Central',
        description: 'FCT, Niger, Kogi, Benue, Plateau, Nasarawa, Kwara states',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-27',
        areasCount: 7,
        routesCount: 35,
        customersCount: 980,
        agentsCount: 25,
        totalRevenue: 89000000,
        lastActivity: '2024-09-27'
      },
      {
        id: '5',
        code: 'NW',
        name: 'North West',
        description: 'Kano, Kaduna, Katsina, Sokoto, Kebbi, Zamfara, Jigawa states',
        isActive: false,
        createdAt: '2024-01-15',
        updatedAt: '2024-08-15',
        areasCount: 3,
        routesCount: 12,
        customersCount: 245,
        agentsCount: 8,
        totalRevenue: 18000000,
        lastActivity: '2024-08-15'
      }
    ]

    setTimeout(() => {
      setRegions(mockRegions)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredRegions = regions.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         region.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         region.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && region.isActive) ||
                         (filterStatus === 'inactive' && !region.isActive)
    
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setShowEditModal(true)
  }

  const handleDelete = (regionId: string) => {
    if (confirm('Are you sure you want to delete this region? This will affect all areas and routes within it.')) {
      setRegions(regions.filter(r => r.id !== regionId))
    }
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedRegions.length} regions?`)) {
      setRegions(regions.filter(r => !selectedRegions.includes(r.id)))
      setSelectedRegions([])
    }
  }

  const columns = [
    {
      header: 'Region',
      accessor: 'region',
      cell: ({ row }: { row: Region }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: ({ row }: { row: Region }) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate" title={row.description}>
            {row.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Hierarchy',
      accessor: 'hierarchy',
      cell: ({ row }: { row: Region }) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <Building className="w-4 h-4 mr-2 text-gray-400" />
            {row.areasCount} Areas
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Map className="w-4 h-4 mr-2 text-gray-400" />
            {row.routesCount} Routes
          </div>
        </div>
      ),
    },
    {
      header: 'Coverage',
      accessor: 'coverage',
      cell: ({ row }: { row: Region }) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            {row.customersCount} Customers
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            {row.agentsCount} Agents
          </div>
        </div>
      ),
    },
    {
      header: 'Performance',
      accessor: 'performance',
      cell: ({ row }: { row: Region }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(row.totalRevenue)}
          </div>
          <div className="text-xs text-gray-500">
            Last activity: {new Date(row.lastActivity).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: ({ row }: { row: Region }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: Region }) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = `/areas?region=${row.id}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {canEditIn('regions') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteIn('regions') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return (<ErrorBoundary>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Regions</h1>
          </div>
          <SkeletonTable rows={5} cols={7} />
        </div>
      </DashboardLayout>
    
</ErrorBoundary>)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regional Management</h1>
            <p className="text-gray-600">Manage geographic regions and their hierarchical structure</p>
          </div>
          <div className="flex space-x-3">
            {canExportFrom('regions') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            {canCreateIn('regions') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Region
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Regions</p>
                <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Regions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {regions.filter(r => r.isActive).length}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Areas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {regions.reduce((sum, r) => sum + r.areasCount, 0)}
                </p>
              </div>
              <Map className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(regions.reduce((sum, r) => sum + r.totalRevenue, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Hierarchy Navigation */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <span className="font-medium text-gray-900">Regions</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-500">Areas</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-500">Routes</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-500">Customers</span>
          </div>
        </Card>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search regions by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {selectedRegions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedRegions.length} region(s) selected
              </span>
              <div className="flex space-x-2">
                {canDeleteIn('regions') && (
                  <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredRegions}
            columns={columns}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}