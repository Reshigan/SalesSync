'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Campaign } from '@/types/promotions'
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  XCircle
} from 'lucide-react'

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  // Mock data
  const campaigns: Campaign[] = [
    {
      id: 'C001',
      name: 'Summer Mega Sale 2025',
      description: 'Major summer promotional campaign across all regions',
      type: 'seasonal',
      status: 'active',
      startDate: '2025-09-01',
      endDate: '2025-11-30',
      budget: 500000,
      spent: 342500,
      targetAudience: ['Youth', 'Urban', 'Tech-savvy'],
      brands: ['Brand A', 'Brand B'],
      products: ['Product X', 'Product Y', 'Product Z'],
      regions: ['Johannesburg', 'Cape Town', 'Durban'],
      kpis: {
        targetReach: 50000,
        actualReach: 42500,
        targetSales: 1000000,
        actualSales: 856000,
        targetEngagement: 70,
        actualEngagement: 68,
        targetROI: 200,
        actualROI: 185
      },
      createdBy: 'John Doe',
      createdAt: '2025-08-15T10:00:00Z',
      updatedAt: '2025-10-01T14:30:00Z'
    },
    {
      id: 'C002',
      name: 'Product Launch - Premium Line',
      description: 'Launch campaign for new premium product line',
      type: 'product_launch',
      status: 'scheduled',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      budget: 750000,
      spent: 0,
      targetAudience: ['High-income', 'Business professionals'],
      brands: ['Premium Brand'],
      products: ['Premium Product A', 'Premium Product B'],
      regions: ['Sandton', 'Umhlanga', 'Waterfront'],
      kpis: {
        targetReach: 30000,
        actualReach: 0,
        targetSales: 1500000,
        actualSales: 0,
        targetEngagement: 80,
        actualEngagement: 0,
        targetROI: 250,
        actualROI: 0
      },
      createdBy: 'Jane Smith',
      createdAt: '2025-09-20T09:00:00Z',
      updatedAt: '2025-09-20T09:00:00Z'
    },
    {
      id: 'C003',
      name: 'Clearance Campaign Q3',
      description: 'End of season clearance sale',
      type: 'clearance',
      status: 'completed',
      startDate: '2025-08-01',
      endDate: '2025-08-31',
      budget: 250000,
      spent: 235000,
      targetAudience: ['Budget-conscious', 'Bargain hunters'],
      brands: ['Brand C'],
      products: ['Old Stock Items'],
      regions: ['All Regions'],
      kpis: {
        targetReach: 40000,
        actualReach: 45000,
        targetSales: 800000,
        actualSales: 892000,
        targetEngagement: 60,
        actualEngagement: 72,
        targetROI: 150,
        actualROI: 178
      },
      createdBy: 'Mike Johnson',
      createdAt: '2025-07-10T08:00:00Z',
      updatedAt: '2025-09-01T16:00:00Z'
    },
    {
      id: 'C004',
      name: 'Bundle Promotion - Family Pack',
      description: 'Family bundle promotion for festive season',
      type: 'bundle',
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2025-12-25',
      budget: 400000,
      spent: 125000,
      targetAudience: ['Families', 'Parents'],
      brands: ['Brand A', 'Brand D'],
      products: ['Bundle Pack 1', 'Bundle Pack 2'],
      regions: ['Pretoria', 'Port Elizabeth'],
      kpis: {
        targetReach: 35000,
        actualReach: 18500,
        targetSales: 900000,
        actualSales: 425000,
        targetEngagement: 65,
        actualEngagement: 58,
        targetROI: 180,
        actualROI: 145
      },
      createdBy: 'Sarah Lee',
      createdAt: '2025-09-15T11:00:00Z',
      updatedAt: '2025-10-03T10:00:00Z'
    },
    {
      id: 'C005',
      name: 'Loyalty Rewards Program',
      description: 'Ongoing loyalty program for repeat customers',
      type: 'loyalty',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      budget: 1000000,
      spent: 678000,
      targetAudience: ['Existing customers', 'Loyal customers'],
      brands: ['All Brands'],
      products: ['All Products'],
      regions: ['All Regions'],
      kpis: {
        targetReach: 100000,
        actualReach: 85000,
        targetSales: 3000000,
        actualSales: 2450000,
        targetEngagement: 75,
        actualEngagement: 71,
        targetROI: 220,
        actualROI: 195
      },
      createdBy: 'Admin',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2025-10-04T08:00:00Z'
    }
  ]

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalReach: campaigns.reduce((sum, c) => sum + c.kpis.actualReach, 0),
    avgROI: campaigns.filter(c => c.kpis.actualROI > 0).reduce((sum, c) => sum + c.kpis.actualROI, 0) / campaigns.filter(c => c.kpis.actualROI > 0).length
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: Campaign['status']) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
      scheduled: { color: 'bg-blue-100 text-blue-700', icon: Clock },
      active: { color: 'bg-green-100 text-green-700', icon: Play },
      paused: { color: 'bg-yellow-100 text-yellow-700', icon: Pause },
      completed: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle }
    }
    const badge = badges[status]
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type: Campaign['type']) => {
    const colors = {
      product_launch: 'bg-indigo-100 text-indigo-700',
      seasonal: 'bg-orange-100 text-orange-700',
      clearance: 'bg-red-100 text-red-700',
      bundle: 'bg-teal-100 text-teal-700',
      loyalty: 'bg-purple-100 text-purple-700',
      brand_awareness: 'bg-pink-100 text-pink-700'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    )
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
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              Campaigns
            </h1>
            <p className="text-gray-600 mt-1">Manage promotional campaigns and track performance</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.scheduled} scheduled</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalBudget)}</p>
                <p className="text-xs text-gray-500 mt-1">Spent: {formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReach.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">People reached</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average ROI</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgROI.toFixed(0)}%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Above target
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
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
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="product_launch">Product Launch</option>
              <option value="seasonal">Seasonal</option>
              <option value="clearance">Clearance</option>
              <option value="bundle">Bundle</option>
              <option value="loyalty">Loyalty</option>
              <option value="brand_awareness">Brand Awareness</option>
            </select>
          </div>
        </Card>

        {/* Campaigns List */}
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                    {getTypeBadge(campaign.type)}
                  </div>
                  <p className="text-gray-600 mb-3">{campaign.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {campaign.brands.length} brands, {campaign.products.length} products
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.regions.join(', ')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Budget / Spent</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reach</p>
                  <p className="text-sm font-semibold text-gray-900">{campaign.kpis.actualReach.toLocaleString()} / {campaign.kpis.targetReach.toLocaleString()}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(campaign.kpis.actualReach / campaign.kpis.targetReach) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sales</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.kpis.actualSales)}</p>
                  <p className="text-xs text-gray-500">Target: {formatCurrency(campaign.kpis.targetSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ROI</p>
                  <p className={`text-sm font-semibold ${campaign.kpis.actualROI >= campaign.kpis.targetROI ? 'text-green-600' : 'text-orange-600'}`}>
                    {campaign.kpis.actualROI}% {campaign.kpis.actualROI > 0 ? `/ ${campaign.kpis.targetROI}%` : ''}
                  </p>
                  <p className="text-xs text-gray-500">Engagement: {campaign.kpis.actualEngagement}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <Card className="p-12 text-center">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
