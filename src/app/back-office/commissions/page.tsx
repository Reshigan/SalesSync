'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { 
  DollarSign, 
  TrendingUp,
  Users,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Download,
  FileText,
  Award,
  Target
} from 'lucide-react'

interface Commission {
  id: string
  agentName: string
  agentId: string
  period: string
  baseSalary: number
  salesAmount: number
  commissionRate: number
  commissionAmount: number
  bonuses: number
  deductions: number
  totalEarnings: number
  status: 'pending' | 'approved' | 'paid' | 'disputed'
  paymentDate?: string
}

export default function CommissionsPage() {
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('current')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data
  const commissions: Commission[] = [
    {
      id: '1',
      agentName: 'John Doe',
      agentId: 'AGT-001',
      period: 'October 2024',
      baseSalary: 50000,
      salesAmount: 125000,
      commissionRate: 5.0,
      commissionAmount: 6250,
      bonuses: 2000,
      deductions: 500,
      totalEarnings: 57750,
      status: 'approved',
      paymentDate: '2024-11-01',
    },
    {
      id: '2',
      agentName: 'Sarah Wilson',
      agentId: 'AGT-002',
      period: 'October 2024',
      baseSalary: 45000,
      salesAmount: 98000,
      commissionRate: 4.5,
      commissionAmount: 4410,
      bonuses: 1500,
      deductions: 0,
      totalEarnings: 50910,
      status: 'pending',
    },
    {
      id: '3',
      agentName: 'Mike Johnson',
      agentId: 'AGT-003',
      period: 'October 2024',
      baseSalary: 48000,
      salesAmount: 87500,
      commissionRate: 4.0,
      commissionAmount: 3500,
      bonuses: 1000,
      deductions: 200,
      totalEarnings: 52300,
      status: 'paid',
      paymentDate: '2024-10-31',
    },
    {
      id: '4',
      agentName: 'David Brown',
      agentId: 'AGT-004',
      period: 'October 2024',
      baseSalary: 42000,
      salesAmount: 65000,
      commissionRate: 3.5,
      commissionAmount: 2275,
      bonuses: 500,
      deductions: 100,
      totalEarnings: 44675,
      status: 'disputed',
    },
  ]

  const commissionStats = {
    totalCommissions: 2456000,
    avgCommissionRate: 4.2,
    topPerformer: 'John Doe',
    pendingPayments: 15,
    totalAgents: 156,
    payoutThisMonth: 1890000,
  }

  const filteredCommissions = commissions.filter(commission => {
    const matchesStatus = filterStatus === 'all' || commission.status === filterStatus
    const matchesPeriod = filterPeriod === 'all' || commission.period.includes(filterPeriod === 'current' ? 'October 2024' : filterPeriod)
    const matchesSearch = commission.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.agentId.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPeriod && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'disputed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
            <p className="text-gray-600">Track and manage agent commissions and payouts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Commissions
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold">{formatCurrency(commissionStats.totalCommissions)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Commission Rate</p>
                <p className="text-2xl font-bold">{commissionStats.avgCommissionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Performer</p>
                <p className="text-lg font-bold">{commissionStats.topPerformer}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{commissionStats.pendingPayments}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{commissionStats.totalAgents}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month Payout</p>
                <p className="text-2xl font-bold">{formatCurrency(commissionStats.payoutThisMonth)}</p>
              </div>
              <Target className="w-8 h-8 text-indigo-500" />
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
              
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="current">Current Month</option>
                <option value="September">September 2024</option>
                <option value="August">August 2024</option>
                <option value="July">July 2024</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </Card>

        {/* Commissions Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Commission Details</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'Agent', 
                  accessor: 'agentName',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.agentName}</p>
                      <p className="text-sm text-gray-500">{row.agentId}</p>
                    </div>
                  )
                },
                { 
                  header: 'Period', 
                  accessor: 'period',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Base Salary', 
                  accessor: 'baseSalary',
                  cell: ({ value }) => (
                    <span className="font-medium">{formatCurrency(value)}</span>
                  )
                },
                { 
                  header: 'Sales Amount', 
                  accessor: 'salesAmount',
                  cell: ({ value }) => (
                    <span className="font-medium text-blue-600">{formatCurrency(value)}</span>
                  )
                },
                { 
                  header: 'Commission', 
                  accessor: 'commissionAmount',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-green-600">{formatCurrency(row.commissionAmount)}</p>
                      <p className="text-xs text-gray-500">{row.commissionRate}% rate</p>
                    </div>
                  )
                },
                { 
                  header: 'Bonuses', 
                  accessor: 'bonuses',
                  cell: ({ value }) => (
                    <span className="font-medium text-purple-600">{formatCurrency(value)}</span>
                  )
                },
                { 
                  header: 'Deductions', 
                  accessor: 'deductions',
                  cell: ({ value }) => (
                    <span className="font-medium text-red-600">-{formatCurrency(value)}</span>
                  )
                },
                { 
                  header: 'Total Earnings', 
                  accessor: 'totalEarnings',
                  cell: ({ value }) => (
                    <span className="font-bold text-gray-900">{formatCurrency(value)}</span>
                  )
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(value)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    </div>
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
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredCommissions}
            />
          </Card.Content>
        </Card>

        {/* Commission Structure */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Commission Structure</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Van Sales Agent</p>
                    <p className="text-sm text-gray-500">Base commission rate</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">4.5%</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Promoter</p>
                    <p className="text-sm text-gray-500">Per activity completion</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">₦2,500</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Merchandiser</p>
                    <p className="text-sm text-gray-500">Per store visit</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">₦1,800</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Field Agent</p>
                    <p className="text-sm text-gray-500">Per SIM activation</p>
                  </div>
                  <span className="text-lg font-bold text-orange-600">₦500</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Performance Bonuses</h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Target Achievement</p>
                    <p className="text-sm text-gray-500">100% of monthly target</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">₦5,000</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Exceptional Performance</p>
                    <p className="text-sm text-gray-500">120% of monthly target</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">₦10,000</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">New Customer Acquisition</p>
                    <p className="text-sm text-gray-500">Per new customer</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">₦1,000</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Quality Score</p>
                    <p className="text-sm text-gray-500">Above 90% quality rating</p>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">₦3,000</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Pending Actions Alert */}
        <Card className="border-l-4 border-l-yellow-500">
          <Card.Content className="p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-6 h-6 text-yellow-500 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Pending Commission Actions</h4>
                <p className="text-gray-600 mt-1">
                  15 commission payments are pending approval. 3 disputed commissions require review. 
                  Monthly commission calculation for October is ready for processing.
                </p>
                <div className="mt-3 flex space-x-3">
                  <Button size="sm" variant="outline">Review Pending</Button>
                  <Button size="sm" variant="outline">Process Payments</Button>
                  <Button size="sm" variant="outline">Resolve Disputes</Button>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  )
}