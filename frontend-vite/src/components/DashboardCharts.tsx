/**
 * Dashboard Charts Component
 * Interactive charts and KPI widgets using Recharts
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Paper,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrderIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
}) => {
  const theme = useTheme();
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            {icon && (
              <Avatar
                sx={{
                  bgcolor: `${color}.main`,
                  width: 40,
                  height: 40,
                }}
              >
                {icon}
              </Avatar>
            )}
          </Box>

          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>

          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPositive && <TrendingUpIcon color="success" fontSize="small" />}
              {isNegative && <TrendingDownIcon color="error" fontSize="small" />}
              <Typography
                variant="body2"
                color={isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary'}
              >
                {isPositive && '+'}
                {change}% {changeLabel || 'vs last period'}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; target?: number }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title="Revenue Trend"
        action={
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Revenue"
            />
            {data[0]?.target && (
              <Line
                type="monotone"
                dataKey="target"
                stroke={theme.palette.success.main}
                strokeDasharray="5 5"
                name="Target"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface SalesChartProps {
  data: Array<{ category: string; sales: number; orders: number }>;
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title="Sales by Category"
        action={
          <IconButton size="small">
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
            <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="sales"
              fill={theme.palette.primary.main}
              name="Sales ($)"
            />
            <Bar
              yAxisId="right"
              dataKey="orders"
              fill={theme.palette.secondary.main}
              name="Orders"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface OrderStatusChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data }) => {
  const theme = useTheme();
  
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader title="Order Status Distribution" />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface TopProductsProps {
  products: Array<{
    name: string;
    sales: number;
    units: number;
    change: number;
  }>;
}

export const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <Card>
      <CardHeader title="Top Products" />
      <CardContent>
        <Stack spacing={2}>
          {products.map((product, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main' }}>{index + 1}</Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">{product.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {product.units} units sold
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" fontWeight="bold">
                  ${product.sales.toLocaleString()}
                </Typography>
                <Chip
                  label={`${product.change > 0 ? '+' : ''}${product.change}%`}
                  size="small"
                  color={product.change > 0 ? 'success' : 'error'}
                  sx={{ height: 20 }}
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

interface DashboardProps {
  kpiData?: {
    revenue: { value: number; change: number };
    orders: { value: number; change: number };
    customers: { value: number; change: number };
    products: { value: number; change: number };
  };
  revenueData?: Array<{ month: string; revenue: number; target?: number }>;
  salesData?: Array<{ category: string; sales: number; orders: number }>;
  orderStatusData?: Array<{ name: string; value: number; color?: string }>;
  topProducts?: Array<{ name: string; sales: number; units: number; change: number }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  kpiData,
  revenueData = [],
  salesData = [],
  orderStatusData = [],
  topProducts = [],
}) => {
  return (
    <Box sx={{ p: 3 }}>
      {/* KPI Cards */}
      {kpiData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Revenue"
              value={`$${kpiData.revenue.value.toLocaleString()}`}
              change={kpiData.revenue.change}
              icon={<MoneyIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Orders"
              value={kpiData.orders.value.toLocaleString()}
              change={kpiData.orders.change}
              icon={<OrderIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Customers"
              value={kpiData.customers.value.toLocaleString()}
              change={kpiData.customers.change}
              icon={<PeopleIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Products"
              value={kpiData.products.value.toLocaleString()}
              change={kpiData.products.change}
              icon={<InventoryIcon />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <RevenueChart data={revenueData} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <OrderStatusChart data={orderStatusData} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <SalesChart data={salesData} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <TopProducts products={topProducts} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
