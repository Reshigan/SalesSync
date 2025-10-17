import { 
  Users, 
  MapPin, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { formatCurrency } from '../../utils/currency'

// Mock data - replace with real API calls
const mockStats = {
  totalAgents: 45,
  activeAgents: 38,
  todayPlacements: 12,
  todayDistributions: 28,
  monthlyRevenue: 125000,
  monthlyCommissions: 8750,
}

const mockRecentActivities = [
  {
    id: 1,
    type: 'board_placement',
    agent: 'John Doe',
    description: 'Placed Premium Billboard at High Street',
    time: '2 minutes ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'product_distribution',
    agent: 'Jane Smith',
    description: 'Delivered 50 units to ABC Store',
    time: '15 minutes ago',
    status: 'completed',
  },
  {
    id: 3,
    type: 'board_placement',
    agent: 'Mike Johnson',
    description: 'Placed Standard Billboard at Market Square',
    time: '32 minutes ago',
    status: 'completed',
  },
  {
    id: 4,
    type: 'product_distribution',
    agent: 'Sarah Wilson',
    description: 'Delivered 25 units to XYZ Retail',
    time: '1 hour ago',
    status: 'completed',
  },
]

const mockTopPerformers = [
  { name: 'John Doe', commission: 1250, placements: 8, distributions: 15 },
  { name: 'Jane Smith', commission: 1100, placements: 6, distributions: 18 },
  { name: 'Mike Johnson', commission: 950, placements: 7, distributions: 12 },
  { name: 'Sarah Wilson', commission: 875, placements: 5, distributions: 14 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

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
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your field operations today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Field Agents"
          value={mockStats.totalAgents}
          icon={Users}
          change={8}
          color="blue"
        />
        <StatCard
          title="Active Today"
          value={mockStats.activeAgents}
          icon={Activity}
          change={12}
          color="green"
        />
        <StatCard
          title="Board Placements"
          value={mockStats.todayPlacements}
          icon={MapPin}
          change={-5}
          color="purple"
        />
        <StatCard
          title="Product Distributions"
          value={mockStats.todayDistributions}
          icon={Package}
          change={15}
          color="orange"
        />
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(mockStats.monthlyRevenue)}
          icon={DollarSign}
          change={18}
          color="green"
        />
        <StatCard
          title="Monthly Commissions"
          value={formatCurrency(mockStats.monthlyCommissions)}
          icon={TrendingUp}
          change={22}
          color="blue"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent activities */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
          </div>
          <div className="space-y-4">
            {mockRecentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'board_placement' ? (
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Package className="h-4 w-4 text-orange-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.agent}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500">{activity.time}</p>
                    <CheckCircle className="h-3 w-3 text-green-500 ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button className="btn-outline w-full">
              View all activities
            </button>
          </div>
        </div>

        {/* Top performers */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Performers</h3>
            <p className="text-sm text-gray-600">This month's leading agents</p>
          </div>
          <div className="space-y-4">
            {mockTopPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {performer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {performer.placements} placements • {performer.distributions} distributions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    £{performer.commission}
                  </p>
                  <p className="text-xs text-gray-500">commission</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button className="btn-outline w-full">
              View all agents
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center space-x-2">
            <Users className="h-4 w-4" />
            <span>View Field Agents</span>
          </button>
          <button className="btn-outline flex items-center justify-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Live Mapping</span>
          </button>
          <button className="btn-outline flex items-center justify-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}