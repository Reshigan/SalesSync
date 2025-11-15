import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FieldOpsAnalytics: React.FC = () => {
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
      const response = await apiClient.get(`/analytics/field-ops?from=${dateRange.from}&to=${dateRange.to}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching field ops analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-xl">Loading...</div></div>;
  if (!data) return <div className="flex items-center justify-center h-screen"><div className="text-xl">No data available</div></div>;

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Field Operations Analytics</h1>
          <p className="text-gray-600 mt-1">Board placements and product distributions</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="border rounded px-3 py-2" />
          <span className="self-center">to</span>
          <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="border rounded px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Board Placements</h3>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(data.kpis.total_board_placements)}</p>
          <p className="text-sm text-gray-600 mt-2">{data.kpis.gps_compliance_rate}% GPS compliant</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Product Distributions</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(data.kpis.total_product_distributions)}</p>
          <p className="text-sm text-gray-600 mt-2">{data.kpis.photo_attachment_rate}% with photos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Coverage</h3>
          <p className="text-3xl font-bold text-purple-600">{data.kpis.avg_coverage_percentage.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 mt-2">{data.kpis.avg_agents_per_day.toFixed(1)} agents/day</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.time_series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
              <Legend />
              <Line type="monotone" dataKey="board_placements" stroke="#3b82f6" name="Placements" />
              <Line type="monotone" dataKey="product_distributions" stroke="#10b981" name="Distributions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Agents</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Agent</th>
                  <th className="text-right py-2">Placements</th>
                  <th className="text-right py-2">Distributions</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.top_agents.map((agent: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{agent.agent_name}</td>
                    <td className="text-right py-2">{agent.board_placements}</td>
                    <td className="text-right py-2">{agent.product_distributions}</td>
                    <td className="text-right py-2 font-semibold">{agent.total_activities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldOpsAnalytics;
