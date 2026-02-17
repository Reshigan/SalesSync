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
      <div className="bg-white border-b border-gray-100">
        <div className="w-full">
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
      <div className="w-full">
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
          <button className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Package className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Create New Board</p>
              <p className="text-sm text-gray-600">Add a new board to inventory</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <MapPin className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">View Installations</p>
              <p className="text-sm text-gray-600">Track board installations</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Product Distributions</p>
              <p className="text-sm text-gray-600">Track product distributions</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
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
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/product-distributions')
        setProducts(res.data.data || [])
      } catch { setProducts([]) }
      finally { setLoading(false) }
    }
    fetchProducts()
  }, [])

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Distributions</h2>
        <span className="text-sm text-gray-500">{products.length} records</span>
      </div>
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No product distributions found</div>
      ) : (
        <div className="space-y-3">
          {products.map((p: any, i: number) => (
            <div key={p.id || i} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{p.product_name || p.name || 'Product'}</p>
                <p className="text-sm text-gray-500">Qty: {p.quantity || 0} | {p.status || 'distributed'}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{p.status || 'active'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InstallationsTab() {
  const [installations, setInstallations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInstallations = async () => {
      try {
        const res = await apiClient.get('/board-installations')
        setInstallations(res.data.data || [])
      } catch { setInstallations([]) }
      finally { setLoading(false) }
    }
    fetchInstallations()
  }, [])

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Board Installations</h2>
        <span className="text-sm text-gray-500">{installations.length} records</span>
      </div>
      {installations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No board installations found</div>
      ) : (
        <div className="space-y-3">
          {installations.map((inst: any, i: number) => (
            <div key={inst.id || i} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{inst.board_name || inst.location || 'Installation'}</p>
                <p className="text-sm text-gray-500">{inst.customer_name || ''} | {inst.installed_at || inst.created_at || ''}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${inst.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{inst.status || 'installed'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
