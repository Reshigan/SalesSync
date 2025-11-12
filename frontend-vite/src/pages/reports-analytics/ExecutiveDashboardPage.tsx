import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../../services/reports.service'

export const ExecutiveDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['executive-dashboard', dateRange],
    queryFn: () => reportsService.getExecutiveDashboard(dateRange)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const reportData = dashboardData || {
    kpis: {
      total_revenue: 0,
      revenue_growth: 0,
      total_orders: 0,
      order_growth: 0,
      active_customers: 0,
      customer_growth: 0,
      profit_margin: 0,
      margin_change: 0
    },
    sales_trend: [],
    top_products: [],
    top_agents: [],
    regional_performance: [],
    alerts: []
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            High-level overview of business performance and key metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange({
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0]
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange({
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0]
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Export
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {formatCurrency(reportData.kpis.total_revenue)}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  reportData.kpis.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.kpis.revenue_growth >= 0 ? '↑' : '↓'} {Math.abs(reportData.kpis.revenue_growth).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {reportData.kpis.total_orders.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  reportData.kpis.order_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.kpis.order_growth >= 0 ? '↑' : '↓'} {Math.abs(reportData.kpis.order_growth).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {reportData.kpis.active_customers.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  reportData.kpis.customer_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.kpis.customer_growth >= 0 ? '↑' : '↓'} {Math.abs(reportData.kpis.customer_growth).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Profit Margin</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {reportData.kpis.profit_margin.toFixed(1)}%
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  reportData.kpis.margin_change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.kpis.margin_change >= 0 ? '↑' : '↓'} {Math.abs(reportData.kpis.margin_change).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      {reportData.alerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Attention Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {reportData.alerts.map((alert: any, index: number) => (
                    <li key={index}>{alert.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Products</h2>
          {reportData.top_products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No product data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.top_products.slice(0, 5).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-xs">#{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity_sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performing Agents</h2>
          {reportData.top_agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No agent data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.top_agents.slice(0, 5).map((agent: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-medium text-xs">#{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.order_count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(agent.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Regional Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Regional Performance</h2>
        {reportData.regional_performance.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No regional data</h3>
            <p className="mt-1 text-sm text-gray-500">Regional performance data will appear here once available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.regional_performance.map((region: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{region.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(region.revenue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{region.order_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{region.customer_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        region.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {region.growth >= 0 ? '↑' : '↓'} {Math.abs(region.growth).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
