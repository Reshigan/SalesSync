'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Material } from '@/types/promotions'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  TrendingDown,
  Layers,
  ShoppingCart
} from 'lucide-react'

export default function MarketingMaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const materials: Material[] = [
    {
      id: 'MAT001',
      name: 'Brand A Premium Banner',
      type: 'banner',
      category: 'display',
      brand: 'Brand A',
      description: 'Large format banner for indoor display',
      specifications: {
        size: '2m x 1m',
        material: 'PVC',
        weight: '1.5kg',
        colors: ['Red', 'White']
      },
      stock: { total: 100, available: 45, allocated: 55, minimum: 20 },
      unitCost: 350,
      supplier: 'Premium Prints Ltd',
      lastOrdered: '2025-09-15',
      imageUrl: '/materials/banner-a.jpg',
      status: 'active',
      campaigns: ['C001', 'C004'],
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-09-15T00:00:00Z'
    },
    {
      id: 'MAT002',
      name: 'Product Sample - 50ml',
      type: 'sample',
      category: 'promotional_item',
      brand: 'Brand B',
      description: 'Small product sample for distribution',
      specifications: {
        size: '50ml',
        material: 'Plastic bottle',
        weight: '60g'
      },
      stock: { total: 5000, available: 2800, allocated: 2200, minimum: 1000 },
      unitCost: 15,
      supplier: 'Product Co.',
      lastOrdered: '2025-09-20',
      status: 'active',
      campaigns: ['C001', 'C005'],
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-09-20T00:00:00Z'
    },
    {
      id: 'MAT003',
      name: 'Promotional Flyer A4',
      type: 'flyer',
      category: 'print',
      brand: 'Brand A',
      description: 'Full color A4 promotional flyer',
      specifications: {
        size: 'A4',
        material: '150gsm glossy paper',
        colors: ['Full Color']
      },
      stock: { total: 10000, available: 3500, allocated: 6500, minimum: 2000 },
      unitCost: 2,
      supplier: 'Print Solutions',
      lastOrdered: '2025-08-30',
      status: 'active',
      campaigns: ['C001', 'C002', 'C003'],
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-09-01T00:00:00Z'
    },
    {
      id: 'MAT004',
      name: 'Floor Standee',
      type: 'standee',
      category: 'display',
      brand: 'Brand C',
      description: 'Life-size cardboard standee',
      specifications: {
        size: '1.8m x 0.6m',
        material: 'Corrugated cardboard',
        weight: '2kg'
      },
      stock: { total: 50, available: 12, allocated: 38, minimum: 10 },
      unitCost: 280,
      supplier: 'Display Masters',
      lastOrdered: '2025-07-10',
      status: 'active',
      campaigns: ['C002'],
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-07-10T00:00:00Z'
    },
    {
      id: 'MAT005',
      name: 'Branded T-Shirt',
      type: 'uniform',
      category: 'merchandise',
      brand: 'Brand A',
      description: 'Staff promotional t-shirt',
      specifications: {
        size: 'Various (S-XL)',
        material: '100% Cotton',
        colors: ['Red', 'Blue']
      },
      stock: { total: 200, available: 85, allocated: 115, minimum: 50 },
      unitCost: 120,
      supplier: 'Apparel Pro',
      lastOrdered: '2025-08-01',
      status: 'active',
      campaigns: ['C001', 'C004', 'C005'],
      createdAt: '2025-01-20T00:00:00Z',
      updatedAt: '2025-08-01T00:00:00Z'
    },
    {
      id: 'MAT006',
      name: 'Shelf Wobbler',
      type: 'wobbler',
      category: 'display',
      brand: 'Brand D',
      description: 'Point of sale wobbler',
      specifications: {
        size: '15cm x 10cm',
        material: 'Plastic',
        weight: '20g'
      },
      stock: { total: 1000, available: 150, allocated: 850, minimum: 200 },
      unitCost: 8,
      supplier: 'POS Solutions',
      lastOrdered: '2025-09-05',
      status: 'active',
      campaigns: ['C003', 'C004'],
      createdAt: '2025-02-15T00:00:00Z',
      updatedAt: '2025-09-05T00:00:00Z'
    },
    {
      id: 'MAT007',
      name: 'Gift Voucher - R100',
      type: 'gift',
      category: 'promotional_item',
      description: 'R100 shopping voucher',
      specifications: {
        material: 'Card stock'
      },
      stock: { total: 500, available: 8, allocated: 492, minimum: 100 },
      unitCost: 100,
      supplier: 'Internal',
      lastOrdered: '2025-06-01',
      status: 'active',
      campaigns: ['C005'],
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z'
    }
  ]

  const stats = {
    totalItems: materials.length,
    totalValue: materials.reduce((sum, m) => sum + (m.stock.total * m.unitCost), 0),
    availableValue: materials.reduce((sum, m) => sum + (m.stock.available * m.unitCost), 0),
    lowStock: materials.filter(m => m.stock.available <= m.stock.minimum).length,
    active: materials.filter(m => m.status === 'active').length
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || material.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const getStockStatus = (material: Material) => {
    const stockPercentage = (material.stock.available / material.stock.total) * 100
    if (material.stock.available <= material.stock.minimum) {
      return { label: 'Low Stock', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
    } else if (stockPercentage < 30) {
      return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: TrendingDown }
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl">
                <Package className="w-8 h-8 text-white" />
              </div>
              Marketing Materials
            </h1>
            <p className="text-gray-600 mt-1">Manage promotional materials and inventory</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg">
            <Plus className="w-5 h-5" />
            Add Material
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalItems}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.active} active</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Layers className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Entire inventory</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.availableValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Ready to use</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.lowStock}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Need reordering
                </p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="print">Print</option>
              <option value="display">Display</option>
              <option value="merchandise">Merchandise</option>
              <option value="digital">Digital</option>
              <option value="promotional_item">Promotional Item</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="banner">Banner</option>
              <option value="poster">Poster</option>
              <option value="flyer">Flyer</option>
              <option value="brochure">Brochure</option>
              <option value="standee">Standee</option>
              <option value="wobbler">Wobbler</option>
              <option value="shelf_strip">Shelf Strip</option>
              <option value="sample">Sample</option>
              <option value="gift">Gift</option>
              <option value="uniform">Uniform</option>
            </select>
          </div>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => {
            const stockStatus = getStockStatus(material)
            const StatusIcon = stockStatus.icon
            const stockPercentage = (material.stock.available / material.stock.total) * 100

            return (
              <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{material.name}</h3>
                      <p className="text-sm text-gray-500">ID: {material.id}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {stockStatus.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{material.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{material.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium text-gray-900 capitalize">{material.category.replace('_', ' ')}</span>
                    </div>
                    {material.brand && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Brand:</span>
                        <span className="font-medium text-gray-900">{material.brand}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Unit Cost:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(material.unitCost)}</span>
                    </div>
                  </div>

                  {/* Stock Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Available</span>
                      <span className="font-semibold text-gray-900">{material.stock.available} / {material.stock.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${stockPercentage <= 20 ? 'bg-red-500' : stockPercentage <= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${stockPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Allocated: {material.stock.allocated}</span>
                      <span>Min: {material.stock.minimum}</span>
                    </div>
                  </div>

                  {/* Campaigns */}
                  {material.campaigns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Used in {material.campaigns.length} campaign(s)</p>
                      <div className="flex flex-wrap gap-1">
                        {material.campaigns.map((campaignId) => (
                          <span key={campaignId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {campaignId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredMaterials.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
