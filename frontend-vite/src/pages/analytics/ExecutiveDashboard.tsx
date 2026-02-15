import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, Target, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ExecutiveDashboard() {
  const kpiCards = [
    { title: 'Total Revenue', value: '$2.45M', change: '+12.5%', trend: 'up', icon: DollarSign, color: 'blue', previous: '$2.17M' },
    { title: 'Active Customers', value: '3,842', change: '+8.2%', trend: 'up', icon: Users, color: 'green', previous: '3,551' },
    { title: 'Orders', value: '12,547', change: '+15.3%', trend: 'up', icon: ShoppingCart, color: 'purple', previous: '10,879' },
    { title: 'Products Sold', value: '45,328', change: '-3.1%', trend: 'down', icon: Package, color: 'orange', previous: '46,775' }
  ]

  const revenueData = [
    { month: 'Jan', revenue: 185000, target: 200000 },
    { month: 'Feb', revenue: 195000, target: 210000 },
    { month: 'Mar', revenue: 225000, target: 220000 },
    { month: 'Apr', revenue: 215000, target: 230000 },
    { month: 'May', revenue: 240000, target: 240000 },
    { month: 'Jun', revenue: 265000, target: 250000 }
  ]

  const categoryData = [
    { name: 'Beverages', value: 35 },
    { name: 'Snacks', value: 25 },
    { name: 'Dairy', value: 20 },
    { name: 'Personal Care', value: 12 },
    { name: 'Others', value: 8 }
  ]

  const topProducts = [
    { name: 'Product A', sales: 12500, revenue: 125000, growth: 15 },
    { name: 'Product B', sales: 11200, revenue: 112000, growth: 12 },
    { name: 'Product C', sales: 9800, revenue: 98000, growth: -5 },
    { name: 'Product D', sales: 8500, revenue: 85000, growth: 8 },
    { name: 'Product E', sales: 7200, revenue: 72000, growth: 20 }
  ]

  const teamPerformance = [
    { name: 'Team A', target: 100000, achieved: 125000 },
    { name: 'Team B', target: 90000, achieved: 95000 },
    { name: 'Team C', target: 85000, achieved: 78000 },
    { name: 'Team D', target: 75000, achieved: 82000 }
  ]

  const getColorClass = (color: string) => {
    const colors = { blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', purple: 'from-purple-500 to-purple-600', orange: 'from-orange-500 to-orange-600' }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">High-level overview of business performance</p>
        </div>
        <button className="btn btn-primary">Export Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className={`card p-6 bg-gradient-to-br ${getColorClass(kpi.color)} text-white`}>
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className="w-10 h-10 opacity-80" />
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${kpi.trend === 'up' ? 'bg-white/20' : 'bg-black/20'}`}>
                {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90">{kpi.title}</p>
              <p className="text-3xl font-bold mt-1">{kpi.value}</p>
              <p className="text-xs opacity-75 mt-2">Previous: {kpi.previous}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="target" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name} ${entry.value}%`} outerRadius={100} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">{index + 1}</div>
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.sales.toLocaleString()} units</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">${product.revenue.toLocaleString()}</div>
                <div className={`text-sm flex items-center gap-1 ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(product.growth)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={teamPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="target" fill="#94A3B8" name="Target" />
            <Bar dataKey="achieved" fill="#3B82F6" name="Achieved" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
