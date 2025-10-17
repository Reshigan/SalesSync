import { useState, useEffect } from 'react'
import { 
  Users, 
  MapPin, 
  Package, 
  DollarSign, 
  Activity, 
  Clock,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  Filter
} from 'lucide-react'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import PieChart from '../../components/charts/PieChart'
import DataTable from '../../components/ui/tables/DataTable'

// Mock data - replace with real API calls
const mockAgentStats = {
  totalAgents: 45,
  activeToday: 38,
  totalPlacements: 156,
  totalDistributions: 284,
  totalCommissions: 12450,
  avgPerformance: 87.5,
}

const mockPerformanceData = [
  { date: '2024-01-01', placements: 12, distributions: 28, commissions: 850 },
  { date: '2024-01-02', placements: 15, distributions: 32, commissions: 920 },
  { date: '2024-01-03', placements: 18, distributions: 35, commissions: 1100 },
  { date: '2024-01-04', placements: 14, distributions: 29, commissions: 890 },
  { date: '2024-01-05', placements: 20, distributions: 38, commissions: 1200 },
  { date: '2024-01-06', placements: 16, distributions: 31, commissions: 980 },
  { date: '2024-01-07', placements: 22, distributions: 42, commissions: 1350 },
]

const mockAgentData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+44 7700 900123',
    status: 'Active',
    location: 'London, UK',
    todayPlacements: 3,
    todayDistributions: 8,
    monthlyCommission: 1250,
    performance: 92,
    lastActivity: '2 minutes ago',
    totalTransactions: 156,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+44 7700 900124',
    status: 'Active',
    location: 'Manchester, UK',
    todayPlacements: 2,
    todayDistributions: 6,
    monthlyCommission: 1100,
    performance: 88,
    lastActivity: '15 minutes ago',
    totalTransactions: 142,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+44 7700 900125',
    status: 'Offline',
    location: 'Birmingham, UK',
    todayPlacements: 0,
    todayDistributions: 0,
    monthlyCommission: 950,
    performance: 75,
    lastActivity: '2 hours ago',
    totalTransactions: 98,
  },
]

const mockActivityData = [
  { type: 'Board Placement', count: 45, color: '#8B5CF6' },
  { type: 'Product Distribution', count: 78, color: '#10B981' },
  { type: 'Customer Visit', count: 32, color: '#F59E0B' },
  { type: 'Commission Earned', count: 28, color: '#EF4444' },
]

export default function FieldAgentsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)

  const StatCard = ({ title, value, icon: Icon, change, color = 'primary' }: any) => (
    <div className="card">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% vs last period
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const agentColumns = [
    {
      key: 'name',
      title: 'Agent',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-primary-600">
              {value.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      sortable: true,
      filterable: true,
    },
    {
      key: 'todayPlacements',
      title: 'Today Placements',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-purple-600">{value}</span>
      ),
    },
    {
      key: 'todayDistributions',
      title: 'Today Distributions',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-green-600">{value}</span>
      ),
    },
    {
      key: 'monthlyCommission',
      title: 'Monthly Commission',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">£{value.toLocaleString()}</span>
      ),
    },
    {
      key: 'performance',
      title: 'Performance',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className={`h-2 rounded-full ${
                value >= 90 ? 'bg-green-500' : 
                value >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      key: 'totalTransactions',
      title: 'Total Transactions',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-blue-600">{value}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 hover:text-blue-800">
            <Eye className="h-4 w-4" />
          </button>
          <button className="text-green-600 hover:text-green-800">
            <Edit className="h-4 w-4" />
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Agents Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive field agent management with real-time tracking and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="form-select"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="btn-primary">
            <Users className="h-4 w-4 mr-2" />
            Add Agent
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Total Agents"
          value={mockAgentStats.totalAgents}
          icon={Users}
          change={8}
          color="blue"
        />
        <StatCard
          title="Active Today"
          value={mockAgentStats.activeToday}
          icon={Activity}
          change={12}
          color="green"
        />
        <StatCard
          title="Board Placements"
          value={mockAgentStats.totalPlacements}
          icon={MapPin}
          change={-5}
          color="purple"
        />
        <StatCard
          title="Distributions"
          value={mockAgentStats.totalDistributions}
          icon={Package}
          change={15}
          color="orange"
        />
        <StatCard
          title="Total Commissions"
          value={`£${mockAgentStats.totalCommissions.toLocaleString()}`}
          icon={DollarSign}
          change={22}
          color="green"
        />
        <StatCard
          title="Avg Performance"
          value={`${mockAgentStats.avgPerformance}%`}
          icon={TrendingUp}
          change={3}
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
            <p className="text-sm text-gray-600">Daily performance metrics over time</p>
          </div>
          <LineChart
            data={mockPerformanceData}
            xKey="date"
            yKeys={[
              { key: 'placements', color: '#8B5CF6', name: 'Board Placements' },
              { key: 'distributions', color: '#10B981', name: 'Product Distributions' },
            ]}
            height={300}
          />
        </div>

        {/* Commission Analysis */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Commission Analysis</h3>
            <p className="text-sm text-gray-600">Daily commission earnings</p>
          </div>
          <BarChart
            data={mockPerformanceData}
            xKey="date"
            yKeys={[
              { key: 'commissions', color: '#F59E0B', name: 'Daily Commissions (£)' },
            ]}
            height={300}
          />
        </div>
      </div>

      {/* Activity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Activity Distribution</h3>
            <p className="text-sm text-gray-600">Breakdown of agent activities</p>
          </div>
          <PieChart data={mockActivityData} height={250} />
        </div>

        {/* Real-time Activity Feed */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Real-time Activity Feed</h3>
            <p className="text-sm text-gray-600">Live updates from field agents</p>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {[
              { agent: 'John Doe', action: 'Placed Premium Billboard', location: 'High Street, London', time: '2 min ago', type: 'placement' },
              { agent: 'Jane Smith', action: 'Completed product delivery', location: 'ABC Store, Manchester', time: '5 min ago', type: 'distribution' },
              { agent: 'Mike Johnson', action: 'Started customer visit', location: 'XYZ Corp, Birmingham', time: '12 min ago', type: 'visit' },
              { agent: 'Sarah Wilson', action: 'Earned commission', location: 'Multiple locations', time: '18 min ago', type: 'commission' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'placement' ? 'bg-purple-100' :
                  activity.type === 'distribution' ? 'bg-green-100' :
                  activity.type === 'visit' ? 'bg-blue-100' : 'bg-yellow-100'
                }`}>
                  {activity.type === 'placement' ? <MapPin className="h-4 w-4 text-purple-600" /> :
                   activity.type === 'distribution' ? <Package className="h-4 w-4 text-green-600" /> :
                   activity.type === 'visit' ? <Users className="h-4 w-4 text-blue-600" /> :
                   <DollarSign className="h-4 w-4 text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.agent}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.location} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Agent Table */}
      <DataTable
        data={mockAgentData}
        columns={agentColumns}
        title="Field Agent Details"
        searchable={true}
        exportable={true}
        pagination={true}
        pageSize={10}
      />

      {/* Transaction-Level Analytics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Transaction-Level Analytics</h3>
          <p className="text-sm text-gray-600">Detailed breakdown of all field operations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Board Placements</p>
                <p className="text-2xl font-bold text-purple-900">156</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 text-xs text-purple-600">
              <span className="font-medium">GPS Verified:</span> 154 (98.7%)
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Product Distributions</p>
                <p className="text-2xl font-bold text-green-900">284</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-green-600">
              <span className="font-medium">Signature Captured:</span> 282 (99.3%)
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Customer Visits</p>
                <p className="text-2xl font-bold text-blue-900">128</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-blue-600">
              <span className="font-medium">Avg Duration:</span> 45 minutes
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Commission Events</p>
                <p className="text-2xl font-bold text-yellow-900">89</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              <span className="font-medium">Total Value:</span> £12,450
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}