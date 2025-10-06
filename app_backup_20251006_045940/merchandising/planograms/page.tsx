'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Layout, Plus, Search, Edit, Trash2, RefreshCw, Image as ImageIcon, CheckCircle } from 'lucide-react'

export default function PlanogramsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Mock data - replace with actual API
  const planograms = [
    {
      id: '1',
      name: 'Beverage Cooler Standard',
      brand: 'Coca-Cola',
      category: 'Beverages',
      storeType: 'Convenience Store',
      effectiveDate: '2025-01-01',
      status: 'active'
    },
    {
      id: '2',
      name: 'Snacks End Cap',
      brand: 'PepsiCo',
      category: 'Snacks',
      storeType: 'Supermarket',
      effectiveDate: '2025-01-15',
      status: 'active'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planograms</h1>
            <p className="text-gray-600">Manage ideal product placement layouts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Planogram
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Planograms</p>
                <p className="text-2xl font-bold">{planograms.length}</p>
              </div>
              <Layout className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{planograms.filter(p => p.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <ImageIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Store Types</p>
                <p className="text-2xl font-bold">6</p>
              </div>
              <Layout className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search planograms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks</option>
              <option value="dairy">Dairy</option>
            </select>
          </div>
        </div>

        {/* Planograms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planograms.map((planogram) => (
            <div key={planogram.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image placeholder */}
              <div className="bg-gray-200 h-48 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{planogram.name}</h3>
                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Brand:</span>
                    <span className="font-medium">{planogram.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{planogram.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store Type:</span>
                    <span className="font-medium">{planogram.storeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective:</span>
                    <span className="font-medium">{new Date(planogram.effectiveDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="mb-3">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {planogram.status.toUpperCase()}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {planograms.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Planograms Yet</h3>
            <p className="text-gray-600 mb-4">Create your first planogram to define ideal product placement</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Planogram
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
