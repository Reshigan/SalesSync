'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner, SkeletonTable } from '@/components/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Building, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  Map,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Globe
} from 'lucide-react'

interface Area {
  id: string
  code: string
  name: string
  description: string
  regionId: string
  regionName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Aggregated data
  routesCount: number
  customersCount: number
  agentsCount: number
  totalRevenue: number
  lastActivity: string
}

export default function AreasPage() {
  const searchParams = useSearchParams()
  const regionFilter = searchParams.get('region')
  
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState(regionFilter || 'all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)

  const { canCreateIn, canEditIn, canDeleteIn, canExportFrom } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockAreas: Area[] = [
      {
        id: '1',
        code: 'LM',
        name: 'Lagos Mainland',
        description: 'Yaba, Surulere, Mushin, Ikeja areas',
        regionId: '1',
        regionName: 'South West',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-30',
        routesCount: 12,
        customersCount: 340,
        agentsCount: 8,
        totalRevenue: 28500000,
        lastActivity: '2024-09-30'
      },
      {
        id: '2',
        code: 'LI',
        name: 'Lagos Island',
        description: 'Victoria Island, Ikoyi, Lagos Island CBD',
        regionId: '1',
        regionName: 'South West',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-29',
        routesCount: 8,
        customersCount: 180,
        agentsCount: 5,
        totalRevenue: 45200000,
        lastActivity: '2024-09-29'
      },
      {
        id: '3',
        code: 'LE',
        name: 'Lagos East',
        description: 'Lekki, Ajah, Epe, Ibeju-Lekki',
        regionId: '1',
        regionName: 'South West',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-28',
        routesCount: 15,
        customersCount: 420,
        agentsCount: 12,
        totalRevenue: 32800000,
        lastActivity: '2024-09-28'
      },
      {
        id: '4',
        code: 'LW',
        name: 'Lagos West',
        description: 'Agege, Alimosho, Ifako-Ijaiye',
        regionId: '1',
        regionName: 'South West',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-27',
        routesCount: 10,
        customersCount: 310,
        agentsCount: 7,
        totalRevenue: 18500000,
        lastActivity: '2024-09-27'
      },
      {
        id: '5',
        code: 'PH',
        name: 'Port Harcourt',
        description: 'Port Harcourt metropolis and environs',
        regionId: '2',
        regionName: 'South South',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-26',
        routesCount: 18,
        customersCount: 520,
        agentsCount: 14,
        totalRevenue: 42300000,
        lastActivity: '2024-09-26'
      },
      {
        id: '6',
        code: 'WR',
        name: 'Warri',
        description: 'Warri, Sapele, Ughelli areas',
        regionId: '2',
        regionName: 'South South',
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-09-25',
        routesCount: 10,
        customersCount: 370,
        agentsCount: 8,
        totalRevenue: 35700000,
        lastActivity: '2024-09-25'
      }
    ]

    setTimeout(() => {
      setAreas(mockAreas)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = filterRegion === 'all' || area.regionId === filterRegion
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && area.isActive) ||
                         (filterStatus === 'inactive' && !area.isActive)
    
    return matchesSearch && matchesRegion && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setShowEditModal(true)
  }

  const handleDelete = (areaId: string) => {
    if (confirm('Are you sure you want to delete this area? This will affect all routes within it.')) {
      setAreas(areas.filter(a => a.id !== areaId))
    }
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedAreas.length} areas?`)) {
      setAreas(areas.filter(a => !selectedAreas.includes(a.id)))
      setSelectedAreas([])
    }
  }

  const columns = [
    {
      header: 'Area',
      accessorKey: 'area',
      cell: (area: Area) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{area.name}</div>
            <div className="text-sm text-gray-500">{area.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Region',
      accessorKey: 'region',
      cell: (area: Area) => (
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{area.regionName}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (area: Area) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate" title={area.description}>
            {area.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Routes',
      accessorKey: 'routes',
      cell: (area: Area) => (
        <div className="flex items-center space-x-2">
          <Map className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{area.routesCount}</span>
        </div>
      ),
    },
    {
      header: 'Coverage',
      accessorKey: 'coverage',
      cell: (area: Area) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            {area.customersCount} Customers
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            {area.agentsCount} Agents
          </div>
        </div>
      ),
    },
    {
      header: 'Performance',
      accessorKey: 'performance',
      cell: (area: Area) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(area.totalRevenue)}
          </div>
          <div className="text-xs text-gray-500">
            Last activity: {new Date(area.lastActivity).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (area: Area) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          area.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {area.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (area: Area) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = `/routes?area=${area.id}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {canEditIn('areas') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(area)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteIn('areas') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDelete(area.id)}
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
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Areas</h1>
          </div>
          <SkeletonTable rows={6} cols={8} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Area Management</h1>
            <p className="text-gray-600">Manage geographic areas within regions</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => window.location.href = '/regions'}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Regions
            </Button>
            {canExportFrom('areas') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            {canCreateIn('areas') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Area
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Areas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAreas.length}</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAreas.reduce((sum, a) => sum + a.routesCount, 0)}
                </p>
              </div>
              <Map className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAreas.reduce((sum, a) => sum + a.customersCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredAreas.reduce((sum, a) => sum + a.totalRevenue, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Hierarchy Navigation */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/regions'}
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
            >
              <Globe className="w-4 h-4 mr-1" />
              Regions
            </Button>
            <ChevronRight className="w-4 h-4" />
            <Building className="w-4 h-4" />
            <span className="font-medium text-gray-900">Areas</span>
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
                  placeholder="Search areas by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                <option value="1">South West</option>
                <option value="2">South South</option>
                <option value="3">South East</option>
                <option value="4">North Central</option>
              </select>
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

          {selectedAreas.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedAreas.length} area(s) selected
              </span>
              <div className="flex space-x-2">
                {canDeleteIn('areas') && (
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
            data={filteredAreas}
            columns={columns}
            selectedRows={selectedAreas}
            onSelectionChange={setSelectedAreas}
            searchable={false}
            pagination={true}
            pageSize={15}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}