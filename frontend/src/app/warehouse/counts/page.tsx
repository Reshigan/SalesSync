'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { ClipboardCheck, Plus, Search, Download, Eye, Edit, Trash2, Clock, CheckCircle, AlertTriangle, TrendingDown, TrendingUp, Package } from 'lucide-react'

interface StockCount {
  id: string
  countNumber: string
  warehouse: string
  type: 'cycle' | 'full' | 'spot'
  scheduledDate: string
  completedDate?: string
  status: 'scheduled' | 'in_progress' | 'completed'
  itemsCounted: number
  totalItems: number
  variance: number
  countedBy: string
}

export default function StockCountsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const counts: StockCount[] = [
    { id: '1', countNumber: 'CNT-001', warehouse: 'Lagos Main', type: 'cycle', scheduledDate: '2025-10-01', completedDate: '2025-10-01', status: 'completed', itemsCounted: 150, totalItems: 150, variance: -5, countedBy: 'John Counter' },
    { id: '2', countNumber: 'CNT-002', warehouse: 'Abuja', type: 'full', scheduledDate: '2025-10-05', status: 'scheduled', itemsCounted: 0, totalItems: 450, variance: 0, countedBy: '' },
    { id: '3', countNumber: 'CNT-003', warehouse: 'Port Harcourt', type: 'cycle', scheduledDate: '2025-10-03', status: 'in_progress', itemsCounted: 75, totalItems: 120, variance: 0, countedBy: 'Sarah' }
  ]

  const stats = {
    totalCounts: counts.length,
    completed: counts.filter(c => c.status === 'completed').length,
    inProgress: counts.filter(c => c.status === 'in_progress').length,
    scheduled: counts.filter(c => c.status === 'scheduled').length,
    totalVariance: counts.reduce((sum, c) => sum + c.variance, 0)
  }

  const filteredCounts = counts.filter(c => {
    const matchesSearch = c.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.warehouse.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700'
    }
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status]}`}>{status.replace('_', ' ')}</span>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl"><ClipboardCheck className="w-8 h-8 text-white" /></div>
              Stock Counts
            </h1>
            <p className="text-gray-600 mt-1">Manage cycle counts and inventory audits</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg">
            <Plus className="w-5 h-5" />Schedule Count
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-emerald-600">Total</p><p className="text-2xl font-bold text-emerald-900">{stats.totalCounts}</p></div>
              <ClipboardCheck className="w-10 h-10 text-emerald-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-green-600">Completed</p><p className="text-2xl font-bold text-green-900">{stats.completed}</p></div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-yellow-600">In Progress</p><p className="text-2xl font-bold text-yellow-900">{stats.inProgress}</p></div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-600">Scheduled</p><p className="text-2xl font-bold text-blue-900">{stats.scheduled}</p></div>
              <Package className="w-10 h-10 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-orange-600">Variance</p><p className="text-2xl font-bold text-orange-900">{stats.totalVariance}</p></div>
              <AlertTriangle className="w-10 h-10 text-orange-400" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search counts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Download className="w-4 h-4" />Export</button>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Count #', 'Warehouse', 'Type', 'Scheduled', 'Completed', 'Status', 'Progress', 'Variance', 'Counted By', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCounts.map(cnt => (
                  <tr key={cnt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-emerald-600">{cnt.countNumber}</div></td>
                    <td className="px-6 py-4 text-sm">{cnt.warehouse}</td>
                    <td className="px-6 py-4 text-sm capitalize">{cnt.type}</td>
                    <td className="px-6 py-4 text-sm">{new Date(cnt.scheduledDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 text-sm">{cnt.completedDate ? new Date(cnt.completedDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(cnt.status)}</td>
                    <td className="px-6 py-4 text-sm">{cnt.itemsCounted}/{cnt.totalItems}</td>
                    <td className="px-6 py-4">
                      {cnt.variance !== 0 && (
                        <span className={`font-bold ${cnt.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>{cnt.variance > 0 ? '+' : ''}{cnt.variance}</span>
                      )}
                      {cnt.variance === 0 && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">{cnt.countedBy || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600"><Eye className="w-4 h-4" /></button>
                        <button className="text-gray-600"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
