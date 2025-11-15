import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CommissionsAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/analytics/commissions?from=${dateRange.from}&to=${dateRange.to}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching commissions analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-xl">Loading...</div></div>;
  if (!data) return <div className="flex items-center justify-center h-screen"><div className="text-xl">No data available</div></div>;

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commissions Analytics</h1>
          <p className="text-gray-600 mt-1">Agent earnings and commission tracking</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="border rounded px-3 py-2" />
          <span className="self-center">to</span>
          <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="border rounded px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Commissions</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.kpis.total_commissions)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.kpis.pending_commissions)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.kpis.approved_commissions)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Paid</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(data.kpis.paid_commissions)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Commission Status Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              <Bar dataKey="approved" stackId="a" fill="#8b5cf6" name="Approved" />
              <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Earning Agents</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Agent</th>
                  <th className="text-right py-2">Count</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Paid</th>
                </tr>
              </thead>
              <tbody>
                {data.top_agents.map((agent: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{agent.agent_name}</td>
                    <td className="text-right py-2">{agent.commission_count}</td>
                    <td className="text-right py-2 font-semibold">{formatCurrency(parseFloat(agent.total_earnings))}</td>
                    <td className="text-right py-2 text-green-600">{formatCurrency(parseFloat(agent.paid))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Commissions by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.by_type.map((type: any, idx: number) => (
            <div key={idx} className="border rounded p-4">
              <div className="text-sm text-gray-600">{type.type}</div>
              <div className="text-xl font-bold">{type.count}</div>
              <div className="text-sm text-gray-600">{formatCurrency(parseFloat(type.total_amount))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommissionsAnalytics;
