import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts'
import { TrendingUp, Calendar, Download, Filter, RefreshCw } from 'lucide-react'

export default function AdvancedAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30days')
  const [metric, setMetric] = useState('revenue')

  const salesTrend = [
    { date: 'Week 1', sales: 12000, orders: 145, customers: 89 },
    { date: 'Week 2', sales: 15000, orders: 178, customers: 102 },
    { date: 'Week 3', sales: 13500, orders: 162, customers: 95 },
    { date: 'Week 4', sales: 18000, orders: 210, customers: 125 },
    { date: 'Week 5', sales: 20000, orders: 235, customers: 140 },
    { date: 'Week 6', sales: 22000, orders: 258, customers: 155 }
  ]

  const cohortAnalysis = [
    { cohort: 'Jan 2024', month1: 100, month2: 85, month3: 72, month4: 65 },
    { cohort: 'Feb 2024', month1: 100, month2: 88, month3: 75, month4: 68 },
    { cohort: 'Mar 2024', month1: 100, month2: 90, month3: 78, month4: 70 },
    { cohort: 'Apr 2024', month1: 100, month2: 92, month3: 80, month4: 72 }
  ]

  const customerSegments = [
    { segment: 'VIP', count: 245, revenue: 450000, avgOrder: 1837 },
    { segment: 'Regular', count: 892, revenue: 380000, avgOrder: 426 },
    { segment: 'Occasional', count: 1543, revenue: 210000, avgOrder: 136 },
    { segment: 'New', count: 1162, revenue: 85000, avgOrder: 73 }
  ]

  const productPerformance = [
    { product: 'Product A', unitsSold: 5420, revenue: 162600, margin: 35, returns: 42 },
    { product: 'Product B', unitsSold: 4890, revenue: 146700, margin: 32, returns: 38 },
    { product: 'Product C', unitsSold: 4125, revenue: 123750, margin: 28, returns: 55 },
    { product: 'Product D', unitsSold: 3675, revenue: 110250, margin: 30, returns: 29 },
    { product: 'Product E', unitsSold: 3120, revenue: 93600, margin: 25, returns: 48 }
  ]

  const hourlyAnalysis = [
    { hour: '6am', orders: 12, revenue: 2400 },
    { hour: '9am', orders: 45, revenue: 9000 },
    { hour: '12pm', orders: 78, revenue: 15600 },
    { hour: '3pm', orders: 65, revenue: 13000 },
    { hour: '6pm', orders: 92, revenue: 18400 },
    { hour: '9pm', orders: 48, revenue: 9600 }
  ]

  const geographicData = [
    { region: 'North', sales: 285000, growth: 15, customers: 542 },
    { region: 'South', sales: 320000, growth: 22, customers: 678 },
    { region: 'East', sales: 265000, growth: 8, customers: 489 },
    { region: 'West', sales: 298000, growth: 18, customers: 601 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
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
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm opacity-90">Avg Order Value</div>
          <div className="text-3xl font-bold mt-2">$127.50</div>
          <div className="text-xs opacity-75 mt-2">+8.5% vs last period</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-90">Conversion Rate</div>
          <div className="text-3xl font-bold mt-2">3.2%</div>
          <div className="text-xs opacity-75 mt-2">+0.4% vs last period</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm opacity-90">Customer LTV</div>
          <div className="text-3xl font-bold mt-2">$1,845</div>
          <div className="text-xs opacity-75 mt-2">+12.3% vs last period</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="text-sm opacity-90">Churn Rate</div>
          <div className="text-3xl font-bold mt-2">2.1%</div>
          <div className="text-xs opacity-75 mt-2">-0.5% vs last period</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
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

        <div className="card p-6">
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

      <div className="card p-6">
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
        <div className="card p-6">
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

        <div className="card p-6">
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

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Returns</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Return Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productPerformance.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">{product.unitsSold.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">${product.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${product.margin >= 30 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {product.margin}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">{product.returns}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
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
