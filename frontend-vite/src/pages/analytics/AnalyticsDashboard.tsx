import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsOverview {
  summary: {
    orders: {
      total_orders: number;
      total_revenue: number;
      avg_order_value: number;
    };
    customers: {
      new_customers: number;
      avg_active_customers: number;
    };
    field_operations: {
      total_board_placements: number;
      total_product_distributions: number;
      avg_coverage: number;
    };
    commissions: {
      total_commissions: number;
      pending_commissions: number;
      paid_commissions: number;
    };
    visits: {
      total_visits: number;
      completed_visits: number;
      avg_visits_per_agent: number;
    };
  };
  trends: {
    orders: Array<{ date: string; orders: number; revenue: number }>;
    commissions: Array<{ date: string; total_commissions: number; pending: number; approved: number; paid: number }>;
  };
  period: {
    from: string;
    to: string;
    interval: string;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
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
      const response = await apiClient.get(`/analytics/overview?from=${dateRange.from}&to=${dateRange.to}&interval=${interval}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No analytics data available</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Orders KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.summary.orders.total_revenue)}</p>
          <p className="text-sm text-gray-600 mt-2">{formatNumber(data.summary.orders.total_orders)} orders</p>
          <p className="text-sm text-gray-600">AOV: {formatCurrency(data.summary.orders.avg_order_value)}</p>
        </div>

        {/* Customers KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Customers</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(Math.round(data.summary.customers.avg_active_customers))}</p>
          <p className="text-sm text-gray-600 mt-2">Active customers (avg)</p>
          <p className="text-sm text-gray-600">{formatNumber(data.summary.customers.new_customers)} new customers</p>
        </div>

        {/* Field Operations KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Field Operations</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatNumber(data.summary.field_operations.total_board_placements + data.summary.field_operations.total_product_distributions)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {formatNumber(data.summary.field_operations.total_board_placements)} placements
          </p>
          <p className="text-sm text-gray-600">
            {formatNumber(data.summary.field_operations.total_product_distributions)} distributions
          </p>
        </div>

        {/* Commissions KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Commissions</h3>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.summary.commissions.total_commissions)}</p>
          <p className="text-sm text-gray-600 mt-2">Pending: {formatCurrency(data.summary.commissions.pending_commissions)}</p>
          <p className="text-sm text-gray-600">Paid: {formatCurrency(data.summary.commissions.paid_commissions)}</p>
        </div>

        {/* Visits KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Visits</h3>
          <p className="text-3xl font-bold text-indigo-600">{formatNumber(data.summary.visits.total_visits)}</p>
          <p className="text-sm text-gray-600 mt-2">{formatNumber(data.summary.visits.completed_visits)} completed</p>
          <p className="text-sm text-gray-600">{data.summary.visits.avg_visits_per_agent.toFixed(1)} avg per agent</p>
        </div>

        {/* Coverage KPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Coverage</h3>
          <p className="text-3xl font-bold text-teal-600">{data.summary.field_operations.avg_coverage.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 mt-2">Board placement coverage</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Orders & Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends.orders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => formatNumber(value)}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Commissions Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Commissions Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.trends.commissions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              <Bar dataKey="approved" stackId="a" fill="#3b82f6" name="Approved" />
              <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/analytics/orders" className="p-4 border rounded hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Orders</div>
          </a>
          <a href="/analytics/customers" className="p-4 border rounded hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium">Customers</div>
          </a>
          <a href="/analytics/field-ops" className="p-4 border rounded hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📍</div>
            <div className="font-medium">Field Ops</div>
          </a>
          <a href="/analytics/commissions" className="p-4 border rounded hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">Commissions</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
