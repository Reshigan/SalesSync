import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  MapPin,
  BarChart3
} from 'lucide-react'
import BoardManagement from '../../components/field-marketing/BoardManagement'
import CommissionDashboard from '../../components/field-marketing/CommissionDashboard'
import { apiClient } from '../../services/api.service'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

type TabType = 'overview' | 'boards' | 'products' | 'commissions' | 'installations'

export default function FieldMarketingDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'boards' as TabType, label: 'Boards', icon: Package },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'commissions' as TabType, label: 'Commissions', icon: DollarSign },
    { id: 'installations' as TabType, label: 'Installations', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'boards' && <BoardManagement />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'commissions' && <CommissionDashboard />}
        {activeTab === 'installations' && <InstallationsTab />}
      </div>
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState({
    activeBoards: 0,
    installations: 0,
    distributions: 0,
    commissions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [boardsRes, installationsRes, distributionsRes, commissionsRes] = await Promise.all([
        apiClient.get('/boards?status=active'),
        apiClient.get('/board-installations'),
        apiClient.get('/product-distributions'),
        apiClient.get('/commissions?status=pending')
      ])
      
      setStats({
        activeBoards: boardsRes.data.data?.length || 0,
        installations: installationsRes.data.data?.length || 0,
        distributions: distributionsRes.data.data?.length || 0,
        commissions: commissionsRes.data.data?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6"><LoadingSpinner /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Field Marketing Overview</h1>
        <p className="text-gray-600 mt-1">Monitor field marketing activities and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Boards</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeBoards}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Installations</p>
              <p className="text-3xl font-bold text-gray-900">{stats.installations}</p>
            </div>
            <MapPin className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Distributions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.distributions}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commissions</p>
              <p className="text-3xl font-bold text-gray-900">${stats.commissions.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Package className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Create New Board</p>
              <p className="text-sm text-gray-600">Add a new board to inventory</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <MapPin className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">View Installations</p>
              <p className="text-sm text-gray-600">Track board installations</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Product Distributions</p>
              <p className="text-sm text-gray-600">Track product distributions</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Review Commissions</p>
              <p className="text-sm text-gray-600">Approve pending commissions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductsTab() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Product management interface coming soon...</p>
      </div>
    </div>
  )
}

function InstallationsTab() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Board Installations</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Installation tracking interface coming soon...</p>
      </div>
    </div>
  )
}
