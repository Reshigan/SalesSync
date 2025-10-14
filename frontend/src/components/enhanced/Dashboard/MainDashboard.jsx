/**
 * SalesSync Tier-1 Main Dashboard Component
 * Comprehensive dashboard with real-time analytics and KPIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  ShoppingCart,
  Inventory,
  LocationOn,
  Refresh,
  MoreVert,
  Campaign,
  Event,
  Assessment
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MainDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const {
    dashboardData,
    loading,
    error,
    refreshDashboard,
    realTimeUpdates
  } = useDashboard();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  useEffect(() => {
    refreshDashboard(selectedTimeRange);
  }, [selectedTimeRange, refreshDashboard]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    handleMenuClose();
  };

  const KPICard = ({ title, value, change, icon: Icon, color, trend }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {change && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend === 'up' ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend === 'up' ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 24 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading dashboard: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome back, {user?.first_name || 'User'}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's what's happening with your business today.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => refreshDashboard(selectedTimeRange)}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Sales"
            value={formatCurrency(dashboardData?.kpis?.totalSales || 0)}
            change={`${dashboardData?.kpis?.salesChange || 0}%`}
            trend={dashboardData?.kpis?.salesChange > 0 ? 'up' : 'down'}
            icon={TrendingUp}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Customers"
            value={formatNumber(dashboardData?.kpis?.activeCustomers || 0)}
            change={`${dashboardData?.kpis?.customerChange || 0}%`}
            trend={dashboardData?.kpis?.customerChange > 0 ? 'up' : 'down'}
            icon={People}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Orders"
            value={formatNumber(dashboardData?.kpis?.totalOrders || 0)}
            change={`${dashboardData?.kpis?.orderChange || 0}%`}
            trend={dashboardData?.kpis?.orderChange > 0 ? 'up' : 'down'}
            icon={ShoppingCart}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Inventory Value"
            value={formatCurrency(dashboardData?.kpis?.inventoryValue || 0)}
            change={`${dashboardData?.kpis?.inventoryChange || 0}%`}
            trend={dashboardData?.kpis?.inventoryChange > 0 ? 'up' : 'down'}
            icon={Inventory}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Additional KPIs for Field Marketing */}
      {user?.agent_type && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Active Campaigns"
              value={formatNumber(dashboardData?.fieldMarketing?.activeCampaigns || 0)}
              icon={Campaign}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Scheduled Events"
              value={formatNumber(dashboardData?.fieldMarketing?.scheduledEvents || 0)}
              icon={Event}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Visits Completed"
              value={formatNumber(dashboardData?.fieldMarketing?.visitsCompleted || 0)}
              change={`${dashboardData?.fieldMarketing?.visitChange || 0}%`}
              trend={dashboardData?.fieldMarketing?.visitChange > 0 ? 'up' : 'down'}
              icon={LocationOn}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Performance Score"
              value={`${dashboardData?.fieldMarketing?.performanceScore || 0}%`}
              icon={Assessment}
              color="info"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MainDashboard;