import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, Target, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { apiClient } from '../../services/api.service'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true)
  const [kpiCards, setKpiCards] = useState<any[]>([
    { title: 'Total Revenue', value: '--', change: '--', trend: 'up', icon: DollarSign, color: 'blue', previous: '--' },
    { title: 'Active Customers', value: '--', change: '--', trend: 'up', icon: Users, color: 'green', previous: '--' },
    { title: 'Orders', value: '--', change: '--', trend: 'up', icon: ShoppingCart, color: 'purple', previous: '--' },
    { title: 'Products Sold', value: '--', change: '--', trend: 'up', icon: Package, color: 'orange', previous: '--' }
  ])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [teamPerformance, setTeamPerformance] = useState<any[]>([])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/analytics/dashboard')
      const d = res.data?.data || res.data || {}
      const fmt = (n: number) => n >= 1000000 ? `R${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `R${(n / 1000).toFixed(1)}K` : `R${n}`
      const fmtN = (n: number) => n >= 1000 ? n.toLocaleString() : String(n)
      if (d.total_revenue !== undefined || d.total_orders !== undefined) {
        setKpiCards([
          { title: 'Total Revenue', value: fmt(Number(d.total_revenue || 0)), change: d.revenue_growth ? `${d.revenue_growth > 0 ? '+' : ''}${Number(d.revenue_growth).toFixed(1)}%` : '--', trend: Number(d.revenue_growth || 0) >= 0 ? 'up' : 'down', icon: DollarSign, color: 'blue', previous: fmt(Number(d.previous_revenue || 0)) },
          { title: 'Active Customers', value: fmtN(Number(d.active_customers || d.total_customers || 0)), change: d.customer_growth ? `${d.customer_growth > 0 ? '+' : ''}${Number(d.customer_growth).toFixed(1)}%` : '--', trend: Number(d.customer_growth || 0) >= 0 ? 'up' : 'down', icon: Users, color: 'green', previous: fmtN(Number(d.previous_customers || 0)) },
          { title: 'Orders', value: fmtN(Number(d.total_orders || 0)), change: d.orders_growth ? `${d.orders_growth > 0 ? '+' : ''}${Number(d.orders_growth).toFixed(1)}%` : '--', trend: Number(d.orders_growth || 0) >= 0 ? 'up' : 'down', icon: ShoppingCart, color: 'purple', previous: fmtN(Number(d.previous_orders || 0)) },
          { title: 'Products Sold', value: fmtN(Number(d.total_products_sold || d.products_sold || 0)), change: d.products_growth ? `${d.products_growth > 0 ? '+' : ''}${Number(d.products_growth).toFixed(1)}%` : '--', trend: Number(d.products_growth || 0) >= 0 ? 'up' : 'down', icon: Package, color: 'orange', previous: fmtN(Number(d.previous_products || 0)) }
        ])
      }
      if (d.sales_by_period?.length) setRevenueData(d.sales_by_period.map((p: any) => ({ month: p.period || p.month, revenue: Number(p.total_amount || p.revenue || 0), target: Number(p.target || 0) })))
      if (d.categories?.length) setCategoryData(d.categories.map((c: any) => ({ name: c.name || c.category, value: Number(c.percentage || c.count || 0) })))
      if (d.top_products?.length) setTopProducts(d.top_products.map((p: any) => ({ name: p.name || p.product_name, sales: Number(p.units_sold || p.quantity || 0), revenue: Number(p.revenue || 0), growth: Number(p.growth || 0) })))
      if (d.team_performance?.length) setTeamPerformance(d.team_performance.map((t: any) => ({ name: t.name || t.team_name, target: Number(t.target || 0), achieved: Number(t.achieved || t.actual || 0) })))
    } catch (err) {
      console.error('Failed to fetch executive dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCardClass = (index: number) => {
    return index === 0 
      ? 'bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
      : 'bg-[#F8F9FA] rounded-3xl p-6 shadow-card'
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
          <div key={index} className={getCardClass(index)}>
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className={`w-10 h-10 ${index === 0 ? 'text-[#C0E02E]' : 'text-gray-400'}`} />
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${kpi.trend === 'up' ? (index === 0 ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700') : (index === 0 ? 'bg-black/20 text-white' : 'bg-red-100 text-red-700')}`}>
                {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <div>
              <p className={`text-sm ${index === 0 ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.title}</p>
              <p className={`text-3xl font-bold mt-1 ${index === 0 ? 'text-[#C0E02E]' : 'text-gray-900'}`}>{kpi.value}</p>
              <p className={`text-xs mt-2 ${index === 0 ? 'text-gray-500' : 'text-gray-400'}`}>Previous: {kpi.previous}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 rounded-3xl">
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

        <div className="card p-6 rounded-3xl">
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

      <div className="card p-6 rounded-3xl">
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

      <div className="card p-6 rounded-3xl">
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
