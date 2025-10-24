/**
 * Enhanced Dashboard Page with Charts
 */

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Alert, CircularProgress, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import Dashboard from '../components/DashboardCharts';
import api from '../services/api';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await api.get('/dashboard/stats');
      const stats = statsResponse.data;

      // Transform data for charts
      const kpiData = {
        revenue: {
          value: stats.totalRevenue || 0,
          change: calculateChange(stats.totalRevenue, stats.previousRevenue || 0),
        },
        orders: {
          value: stats.totalOrders || 0,
          change: calculateChange(stats.totalOrders, stats.previousOrders || 0),
        },
        customers: {
          value: stats.totalCustomers || 0,
          change: calculateChange(stats.totalCustomers, stats.previousCustomers || 0),
        },
        products: {
          value: stats.totalProducts || 0,
          change: 0,
        },
      };

      // Generate sample revenue data (replace with actual API data)
      const revenueData = generateRevenueData(stats);

      // Generate sales by category data
      const salesData = [
        { category: 'Electronics', sales: 45000, orders: 120 },
        { category: 'Clothing', sales: 32000, orders: 210 },
        { category: 'Food', sales: 28000, orders: 180 },
        { category: 'Books', sales: 15000, orders: 95 },
        { category: 'Other', sales: 12000, orders: 65 },
      ];

      // Order status distribution
      const orderStatusData = [
        { name: 'Pending', value: stats.pendingOrders || 0, color: '#ff9800' },
        { name: 'Processing', value: stats.processingOrders || 0, color: '#2196f3' },
        { name: 'Shipped', value: stats.shippedOrders || 0, color: '#4caf50' },
        { name: 'Delivered', value: stats.deliveredOrders || 0, color: '#8bc34a' },
        { name: 'Cancelled', value: stats.cancelledOrders || 0, color: '#f44336' },
      ];

      // Top products
      const topProducts = [
        { name: 'Product A', sales: 12500, units: 145, change: 12 },
        { name: 'Product B', sales: 9800, units: 98, change: -5 },
        { name: 'Product C', sales: 8200, units: 76, change: 18 },
        { name: 'Product D', sales: 7500, units: 65, change: 8 },
        { name: 'Product E', sales: 6200, units: 52, change: -2 },
      ];

      setDashboardData({
        kpiData,
        revenueData,
        salesData,
        orderStatusData,
        topProducts,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const generateRevenueData = (stats: any) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 30000,
      target: 60000,
    }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time business insights and analytics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
          {error}
        </Alert>
      )}

      {dashboardData && <Dashboard {...dashboardData} />}
    </Box>
  );
};

export default DashboardPage;
