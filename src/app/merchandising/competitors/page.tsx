'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Users, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Tag
} from 'lucide-react'

export default function CompetitorAnalysisPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Mock data
  const activities = [
    {
      id: '1',
      store: 'ABC Supermarket',
      competitor: 'Pepsi',
      date: '2025-10-03',
      type: 'promotion',
      description: 'Buy 2 Get 1 Free promotion active',
      impact: 'high'
    },
    {
      id: '2',
      store: 'XYZ Minimart',
      competitor: 'RC Cola',
      date: '2025-10-02',
      type: 'pricing',
      description: 'Price reduced by 15%',
      impact: 'medium'
    },
    {
      id: '3',
      store: 'Quick Stop',
      competitor: 'Monster Energy',
      date: '2025-10-01',
      type: 'display',
      description: 'New prominent shelf display installed',
      impact: 'high'
    }
  ]

  const getImpactBadge = (impact: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[impact as keyof typeof styles]}`}>
      {impact.toUpperCase()}
    </span>
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'promotion': return <Tag className="w-5 h-5 text-purple-600" />
      case 'pricing': return <DollarSign className="w-5 h-5 text-green-600" />
      case 'display': return <TrendingUp className="w-5 h-5 text-blue-600" />
      default: return <AlertTriangle className="w-5 h-5 text-orange-600" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
            <p className="text-gray-600">Track competitor activities, pricing, and promotions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Activity
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Impact</p>
                <p className="text-2xl font-bold">{activities.filter(a => a.impact === 'high').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promotions</p>
                <p className="text-2xl font-bold">{activities.filter(a => a.type === 'promotion').length}</p>
              </div>
              <Tag className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Price Changes</p>
                <p className="text-2xl font-bold">{activities.filter(a => a.type === 'pricing').length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Search/Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by store or competitor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              <option value="promotion">Promotions</option>
              <option value="pricing">Pricing</option>
              <option value="display">Display</option>
              <option value="stock">Stock</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Impact</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{activity.competitor}</h3>
                        {getImpactBadge(activity.impact)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{activity.store}</p>
                      <p className="text-gray-800 mb-2">{activity.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="capitalize mr-4">{activity.type}</span>
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {activities.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Competitor Activities</h3>
            <p className="text-gray-600 mb-4">Start tracking competitor activities to stay ahead</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log First Activity
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
