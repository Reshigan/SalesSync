'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  Package,
  DollarSign
} from 'lucide-react'

interface Report {
  id: string
  name: string
  description: string
  type: 'sales' | 'inventory' | 'agents' | 'financial'
  last_generated: string
  file_size: string
  status: 'ready' | 'generating' | 'failed'
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      // Mock data for development
      setReports([
        {
          id: '1',
          name: 'Monthly Sales Report',
          description: 'Comprehensive sales performance analysis',
          type: 'sales',
          last_generated: '2025-10-06T08:30:00Z',
          file_size: '2.4 MB',
          status: 'ready'
        },
        {
          id: '2',
          name: 'Inventory Status Report',
          description: 'Current stock levels and movements',
          type: 'inventory',
          last_generated: '2025-10-06T07:15:00Z',
          file_size: '1.8 MB',
          status: 'ready'
        },
        {
          id: '3',
          name: 'Agent Performance Report',
          description: 'Sales agent targets and achievements',
          type: 'agents',
          last_generated: '2025-10-05T16:45:00Z',
          file_size: '3.2 MB',
          status: 'ready'
        },
        {
          id: '4',
          name: 'Financial Summary',
          description: 'Revenue, costs, and profitability analysis',
          type: 'financial',
          last_generated: '2025-10-05T14:20:00Z',
          file_size: '1.5 MB',
          status: 'generating'
        }
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      sales: BarChart3,
      inventory: Package,
      agents: Users,
      financial: DollarSign
    }
    const Icon = icons[type as keyof typeof icons] || FileText
    return <Icon className="w-5 h-5" />
  }

  const getTypeColor = (type: string) => {
    const colors = {
      sales: 'bg-blue-100 text-blue-600',
      inventory: 'bg-green-100 text-green-600',
      agents: 'bg-purple-100 text-purple-600',
      financial: 'bg-orange-100 text-orange-600'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and download business reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sales Report</h3>
              <p className="text-sm text-gray-600">Generate sales analysis</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Inventory Report</h3>
              <p className="text-sm text-gray-600">Stock levels & movements</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Agent Report</h3>
              <p className="text-sm text-gray-600">Performance & targets</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Financial Report</h3>
              <p className="text-sm text-gray-600">Revenue & profitability</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>

          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Generated: {formatDate(report.last_generated)}</span>
                      <span>Size: {report.file_size}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        report.status === 'ready' ? 'bg-green-100 text-green-600' :
                        report.status === 'generating' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {report.status === 'ready' && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}