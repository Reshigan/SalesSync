'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { 
  Eye, 
  Camera, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Search,
  Star,
  Package,
  DollarSign
} from 'lucide-react'

interface StoreVisit {
  id: string
  storeName: string
  storeCode: string
  location: string
  visitDate: string
  visitTime: string
  shelfShare: number
  facingsCount: number
  complianceScore: number
  issuesFound: number
  photosCount: number
  status: 'completed' | 'pending_review' | 'approved'
  aiScore?: number
}

export default function MerchandisingVisitsPage() {
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewVisitModal, setShowNewVisitModal] = useState(false)

  // Mock data
  const visits: StoreVisit[] = [
    {
      id: '1',
      storeName: 'SuperMart Downtown',
      storeCode: 'SM-001',
      location: 'Lagos, Nigeria',
      visitDate: '2024-10-01',
      visitTime: '10:30 AM',
      shelfShare: 35.5,
      facingsCount: 24,
      complianceScore: 87,
      issuesFound: 2,
      photosCount: 15,
      status: 'approved',
      aiScore: 92,
    },
    {
      id: '2',
      storeName: 'MegaMall Central',
      storeCode: 'MM-002',
      location: 'Abuja, Nigeria',
      visitDate: '2024-10-01',
      visitTime: '02:15 PM',
      shelfShare: 28.3,
      facingsCount: 18,
      complianceScore: 73,
      issuesFound: 5,
      photosCount: 12,
      status: 'pending_review',
      aiScore: 78,
    },
    {
      id: '3',
      storeName: 'City Plaza Store',
      storeCode: 'CP-003',
      location: 'Port Harcourt, Nigeria',
      visitDate: '2024-10-01',
      visitTime: '04:45 PM',
      shelfShare: 42.1,
      facingsCount: 32,
      complianceScore: 95,
      issuesFound: 1,
      photosCount: 18,
      status: 'completed',
      aiScore: 96,
    },
  ]

  const todayStats = {
    totalVisits: 8,
    avgShelfShare: 35.2,
    avgCompliance: 85.3,
    totalIssues: 12,
    storesAudited: 8,
    avgAiScore: 88.7,
  }

  const filteredVisits = visits.filter(visit => {
    const matchesStatus = filterStatus === 'all' || visit.status === filterStatus
    const matchesSearch = visit.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.storeCode.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getShelfShareTrend = (share: number) => {
    const target = 30 // Target shelf share
    return share >= target ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Visits</h1>
            <p className="text-gray-600">Track merchandising audits and shelf compliance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              AI Analysis
            </Button>
            <Button onClick={() => setShowNewVisitModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Visit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Visits</p>
                <p className="text-2xl font-bold">{todayStats.totalVisits}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Shelf Share</p>
                <p className="text-2xl font-bold">{todayStats.avgShelfShare}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Compliance</p>
                <p className="text-2xl font-bold">{todayStats.avgCompliance}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Issues Found</p>
                <p className="text-2xl font-bold">{todayStats.totalIssues}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stores Audited</p>
                <p className="text-2xl font-bold">{todayStats.storesAudited}</p>
              </div>
              <Package className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Score</p>
                <p className="text-2xl font-bold">{todayStats.avgAiScore}%</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </Card>

        {/* Visits Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Recent Store Visits</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'Store', 
                  accessor: 'storeName',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.storeName}</p>
                      <p className="text-sm text-gray-500">{row.storeCode}</p>
                    </div>
                  )
                },
                { 
                  header: 'Location', 
                  accessor: 'location',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Visit Time', 
                  accessor: 'visitTime',
                  cell: ({ row }) => (
                    <div className="text-sm">
                      <p>{row.visitDate}</p>
                      <p className="text-gray-500">{row.visitTime}</p>
                    </div>
                  )
                },
                { 
                  header: 'Shelf Share', 
                  accessor: 'shelfShare',
                  cell: ({ value, row }) => (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{value}%</span>
                      {getShelfShareTrend(value)}
                    </div>
                  )
                },
                { 
                  header: 'Facings', 
                  accessor: 'facingsCount',
                  cell: ({ value }) => (
                    <div className="text-center">
                      <span className="font-medium text-blue-600">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Compliance', 
                  accessor: 'complianceScore',
                  cell: ({ value }) => (
                    <div className="text-center">
                      <span className={`font-medium ${getComplianceColor(value)}`}>
                        {value}%
                      </span>
                    </div>
                  )
                },
                { 
                  header: 'Issues', 
                  accessor: 'issuesFound',
                  cell: ({ value }) => (
                    <div className="text-center">
                      {value > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {value}
                        </span>
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      )}
                    </div>
                  )
                },
                { 
                  header: 'Photos', 
                  accessor: 'photosCount',
                  cell: ({ value }) => (
                    <div className="flex items-center justify-center space-x-1">
                      <Camera className="w-4 h-4 text-gray-400" />
                      <span>{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'AI Score', 
                  accessor: 'aiScore',
                  cell: ({ value }) => value ? (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{value}%</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                      {value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}
                    </span>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredVisits}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions and Insights */}
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-lg font-semibold mb-2">Start Audit</h3>
              <p className="text-gray-600 mb-4">Begin new store audit</p>
              <Button fullWidth>Start Audit</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Shelf Photos</h3>
              <p className="text-gray-600 mb-4">Capture shelf images</p>
              <Button variant="outline" fullWidth>Take Photos</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600 mb-4">Get AI insights</p>
              <Button variant="outline" fullWidth>View Analysis</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2">Price Check</h3>
              <p className="text-gray-600 mb-4">Competitor pricing</p>
              <Button variant="outline" fullWidth>Check Prices</Button>
            </div>
          </Card>
        </div>

        {/* Recent Issues Alert */}
        <Card className="border-l-4 border-l-orange-500">
          <Card.Content className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-500 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Recent Issues Detected</h4>
                <p className="text-gray-600 mt-1">
                  12 issues found across 8 stores today. Most common: Out of stock (5), Incorrect pricing (4), Poor display (3).
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="outline">View All Issues</Button>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  )
}