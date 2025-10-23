import { useState, useEffect } from 'react'
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar, Download, Eye, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Commission {
  id: string
  agentId: string
  agentName: string
  period: string
  salesAmount: number
  commissionRate: number
  commissionAmount: number
  bonusAmount: number
  totalEarnings: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  paidDate?: string
}

export default function CommissionTrackingPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('current')

  useEffect(() => {
    fetchCommissions()
  }, [filterStatus, filterPeriod])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const mockCommissions: Commission[] = [
        {
          id: '1',
          agentId: 'agent-1',
          agentName: 'John Agent',
          period: '2025-01',
          salesAmount: 125000,
          commissionRate: 5,
          commissionAmount: 6250,
          bonusAmount: 1000,
          totalEarnings: 7250,
          status: 'paid',
          paidDate: new Date().toISOString()
        },
        {
          id: '2',
          agentId: 'agent-2',
          agentName: 'Jane Field',
          period: '2025-01',
          salesAmount: 98000,
          commissionRate: 5,
          commissionAmount: 4900,
          bonusAmount: 500,
          totalEarnings: 5400,
          status: 'paid',
          paidDate: new Date().toISOString()
        },
        {
          id: '3',
          agentId: 'agent-3',
          agentName: 'Mike Sales',
          period: '2025-02',
          salesAmount: 145000,
          commissionRate: 5,
          commissionAmount: 7250,
          bonusAmount: 1500,
          totalEarnings: 8750,
          status: 'approved'
        },
        {
          id: '4',
          agentId: 'agent-1',
          agentName: 'John Agent',
          period: '2025-02',
          salesAmount: 132000,
          commissionRate: 5,
          commissionAmount: 6600,
          bonusAmount: 1200,
          totalEarnings: 7800,
          status: 'pending'
        }
      ]
      setCommissions(mockCommissions)
    } catch (error) {
      console.error('Failed to fetch commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCommissions = commissions.filter(comm => {
    const matchesSearch = 
      comm.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.period.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || comm.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const totalStats = {
    totalCommissions: commissions.reduce((sum, c) => sum + c.totalEarnings, 0),
    pendingAmount: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.totalEarnings, 0),
    paidAmount: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.totalEarnings, 0),
    agentCount: new Set(commissions.map(c => c.agentId)).size
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const approveCommission = (id: string) => {
    setCommissions(commissions.map(c => 
      c.id === id ? { ...c, status: 'approved' as const } : c
    ))
  }

  const payCommission = (id: string) => {
    setCommissions(commissions.map(c => 
      c.id === id ? { ...c, status: 'paid' as const, paidDate: new Date().toISOString() } : c
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tracking</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track agent commissions and bonuses
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">${totalStats.totalCommissions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">${totalStats.pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Out</p>
              <p className="text-2xl font-bold text-gray-900">${totalStats.paidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.agentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by agent or period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No commission data available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bonus
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{comm.agentName}</div>
                          <div className="text-sm text-gray-500">ID: {comm.agentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {comm.period}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${comm.salesAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {comm.commissionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                      ${comm.commissionAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                      ${comm.bonusAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ${comm.totalEarnings.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comm.status)}`}>
                        {getStatusIcon(comm.status)}
                        {comm.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {comm.status === 'pending' && (
                          <button
                            onClick={() => approveCommission(comm.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Approve
                          </button>
                        )}
                        {comm.status === 'approved' && (
                          <button
                            onClick={() => payCommission(comm.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay Out
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary by Agent */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from(new Set(commissions.map(c => c.agentId))).map((agentId) => {
            const agentComms = commissions.filter(c => c.agentId === agentId)
            const agentName = agentComms[0].agentName
            const totalEarned = agentComms.reduce((sum, c) => sum + c.totalEarnings, 0)
            const totalSales = agentComms.reduce((sum, c) => sum + c.salesAmount, 0)
            
            return (
              <div key={agentId} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {agentName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{agentName}</h4>
                    <p className="text-sm text-gray-600">{agentComms.length} periods</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sales:</span>
                    <span className="text-sm font-semibold text-gray-900">${totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Earned:</span>
                    <span className="text-sm font-bold text-green-600">${totalEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Commission:</span>
                    <span className="text-sm font-semibold text-blue-600">
                      ${(totalEarned / agentComms.length).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
