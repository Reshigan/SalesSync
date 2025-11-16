import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OrdersAnalytics {
  kpis: {
    total_orders: number;
    gross_revenue: number;
    total_units: number;
    avg_order_value: number;
    unique_customers: number;
    new_customers: number;
    repeat_customers: number;
    order_growth_pct: number;
    revenue_growth_pct: number;
  };
  time_series: Array<{
    date: string;
    orders: number;
    revenue: number;
    units: number;
    aov: number;
  }>;
  period: {
    from: string;
    to: string;
    interval: string;
  };
}

const OrdersAnalytics: React.FC = () => {
  const [data, setData] = useState<OrdersAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, interval]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/analytics/orders?from=${dateRange.from}&to=${dateRange.to}&interval=${interval}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching orders analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-xl">Loading...</div></div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-screen"><div className="text-xl">No data available</div></div>;
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed order and revenue metrics</p>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <span className="self-center">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="border rounded px-3 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(data.kpis.total_orders)}</p>
          <p className={`text-sm mt-2 ${data.kpis.order_growth_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.kpis.order_growth_pct >= 0 ? '↑' : '↓'} {Math.abs(data.kpis.order_growth_pct)}% vs prior period
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Gross Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(data.kpis.gross_revenue)}</p>
          <p className={`text-sm mt-2 ${data.kpis.revenue_growth_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.kpis.revenue_growth_pct >= 0 ? '↑' : '↓'} {Math.abs(data.kpis.revenue_growth_pct)}% vs prior period
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.kpis.avg_order_value)}</p>
          <p className="text-sm text-gray-600 mt-2">{formatNumber(data.kpis.total_units)} units sold</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Unique Customers</h3>
          <p className="text-3xl font-bold text-orange-600">{formatNumber(data.kpis.unique_customers)}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatNumber(data.kpis.new_customers)} new, {formatNumber(data.kpis.repeat_customers)} repeat
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Orders Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => formatNumber(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AOV Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Average Order Value</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="aov" stroke="#8b5cf6" name="AOV ($)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Units Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Units Sold</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => formatNumber(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="units" stroke="#f59e0b" name="Units" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Export to CSV
        </button>
      </div>
    </div>
  );
};

export default OrdersAnalytics;
