import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts'
import { TrendingUp, Calendar, Download, Filter, RefreshCw } from 'lucide-react'
import { apiClient } from '../../services/api.service'

export default function AdvancedAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30days')
  const [metric, setMetric] = useState('revenue')
  const [loading, setLoading] = useState(true)
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [cohortAnalysis, setCohortAnalysis] = useState<any[]>([])
  const [customerSegments, setCustomerSegments] = useState<any[]>([])
  const [productPerformance, setProductPerformance] = useState<any[]>([])
  const [hourlyAnalysis, setHourlyAnalysis] = useState<any[]>([])
  const [geographicData, setGeographicData] = useState<any[]>([])
  const [kpis, setKpis] = useState({ avgOrderValue: 0, conversionRate: 0, customerLtv: 0, churnRate: 0 })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get(`/analytics/dashboard?range=${dateRange}`)
      const d = res.data?.data || res.data || {}
      if (d.sales_by_period?.length) {
        setSalesTrend(d.sales_by_period.map((p: any) => ({ date: p.period || p.date, sales: Number(p.total_amount || 0), orders: Number(p.order_count || 0), customers: Number(p.customer_count || 0) })))
      }
      if (d.customer_segments?.length) {
        setCustomerSegments(d.customer_segments.map((s: any) => ({ segment: s.segment || s.name, count: Number(s.count || 0), revenue: Number(s.revenue || 0), avgOrder: Number(s.avg_order || 0) })))
      }
      if (d.top_products?.length) {
        setProductPerformance(d.top_products.map((p: any) => ({ product: p.name || p.product_name, unitsSold: Number(p.units_sold || p.quantity || 0), revenue: Number(p.revenue || 0), margin: Number(p.margin || 0), returns: Number(p.returns || 0) })))
      }
      if (d.sales_by_region?.length) {
        setGeographicData(d.sales_by_region.map((r: any) => ({ region: r.region || r.name, sales: Number(r.total_amount || r.sales || 0), growth: Number(r.growth || 0), customers: Number(r.customer_count || 0) })))
      }
      if (d.avg_order_value) setKpis(prev => ({ ...prev, avgOrderValue: Number(d.avg_order_value) }))
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Deep insights and trend analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input">
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn btn-outline flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="text-sm opacity-90">Avg Order Value</div>
          <div className="text-3xl font-bold mt-2">$127.50</div>
          <div className="text-xs opacity-75 mt-2">+8.5% vs last period</div>
        </div>
        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="text-sm opacity-90">Conversion Rate</div>
          <div className="text-3xl font-bold mt-2">3.2%</div>
          <div className="text-xs opacity-75 mt-2">+0.4% vs last period</div>
        </div>
        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="text-sm opacity-90">Customer LTV</div>
          <div className="text-3xl font-bold mt-2">$1,845</div>
          <div className="text-xs opacity-75 mt-2">+12.3% vs last period</div>
        </div>
        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="text-sm opacity-90">Churn Rate</div>
          <div className="text-3xl font-bold mt-2">2.1%</div>
          <div className="text-xs opacity-75 mt-2">-0.5% vs last period</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Trend Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="Sales ($)" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Hourly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="orders" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" name="Orders" />
              <Area type="monotone" dataKey="revenue" stackId="2" stroke="#EC4899" fill="#EC4899" fillOpacity={0.6} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Retention Cohort Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cohortAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cohort" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="month1" stroke="#3B82F6" name="Month 1" />
            <Line type="monotone" dataKey="month2" stroke="#10B981" name="Month 2" />
            <Line type="monotone" dataKey="month3" stroke="#F59E0B" name="Month 3" />
            <Line type="monotone" dataKey="month4" stroke="#EF4444" name="Month 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
          <div className="space-y-4">
            {customerSegments.map((segment, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{segment.segment}</span>
                  <span className="text-sm text-gray-500">{segment.count} customers</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Revenue: ${segment.revenue.toLocaleString()}</span>
                  <span className="text-gray-600">Avg: ${segment.avgOrder}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(segment.revenue / 450000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geographicData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3B82F6" name="Sales" />
              <Bar dataKey="customers" fill="#10B981" name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 sm:px-4 text-left text-xs font-bold text-gray-600 uppercase">Product</th>
                <th className="px-3 py-3 sm:px-4 text-right text-xs font-bold text-gray-600 uppercase">Units Sold</th>
                <th className="px-3 py-3 sm:px-4 text-right text-xs font-bold text-gray-600 uppercase">Revenue</th>
                <th className="px-3 py-3 sm:px-4 text-right text-xs font-bold text-gray-600 uppercase">Margin %</th>
                <th className="px-3 py-3 sm:px-4 text-right text-xs font-bold text-gray-600 uppercase">Returns</th>
                <th className="px-3 py-3 sm:px-4 text-right text-xs font-bold text-gray-600 uppercase">Return Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productPerformance.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap font-medium text-gray-900">{product.product}</td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-right text-gray-900">{product.unitsSold.toLocaleString()}</td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-right font-semibold text-gray-900">${product.revenue.toLocaleString()}</td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${product.margin >= 30 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {product.margin}%
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-right text-gray-900">{product.returns}</td>
                  <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-right text-gray-600">
                    {((product.returns / product.unitsSold) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
