import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Tabs, Tab, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress
} from '@mui/material';
import {
  AccountBalance, TrendingUp, TrendingDown, Refresh, Payment
} from '@mui/icons-material';
import { apiClient } from '../../services/api.service';

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [arSummary, setArSummary] = useState(null);
  const [apSummary, setApSummary] = useState(null);
  const [arAging, setArAging] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 0: // AR
          const arRes = await apiClient.get('/finance/ar/summary');
          setArSummary(arRes.data.summary);
          const agingRes = await apiClient.get('/finance/ar/aging');
          setArAging(agingRes.data.aging || []);
          break;
        case 1: // AP
          const apRes = await apiClient.get('/finance/ap/summary');
          setApSummary(apRes.data.summary);
          break;
        case 2: // Reports
          const plRes = await apiClient.get('/finance/reports/profit-loss?startDate=2025-01-01&endDate=2025-12-31');
          setProfitLoss(plRes.data.report);
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          <AccountBalance sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Financial Management
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>AR Outstanding</Typography>
              <Typography variant="h4" color="success.main">
                ${arSummary?.total_outstanding?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2">Accounts Receivable</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>AR Overdue</Typography>
              <Typography variant="h4" color="error">
                ${arSummary?.total_overdue?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2">Past due amount</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>AP Outstanding</Typography>
              <Typography variant="h4" color="warning.main">
                ${apSummary?.total_outstanding?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2">Accounts Payable</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Gross Profit</Typography>
              <Typography variant="h4">
                ${profitLoss?.grossProfit?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2">{profitLoss?.grossMargin}% margin</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Accounts Receivable" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Accounts Payable" icon={<TrendingDown />} iconPosition="start" />
          <Tab label="Financial Reports" icon={<AccountBalance />} iconPosition="start" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* AR Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">1-30 Days</TableCell>
                    <TableCell align="right">31-60 Days</TableCell>
                    <TableCell align="right">61-90 Days</TableCell>
                    <TableCell align="right">90+ Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {arAging.map((row) => (
                    <TableRow key={row.customer_id}>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell align="right">${row.total_amount?.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.current?.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.days_1_30?.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.days_31_60?.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.days_61_90?.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Typography color="error">${row.days_90_plus?.toFixed(2)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* AP Tab */}
          {activeTab === 1 && apSummary && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>AP Summary</Typography>
              <Typography>Total Bills: {apSummary.total_bills}</Typography>
              <Typography>Outstanding: ${apSummary.total_outstanding?.toLocaleString()}</Typography>
              <Typography>Due This Week: ${apSummary.due_this_week?.toLocaleString()}</Typography>
              <Typography color="error">Overdue: ${apSummary.overdue?.toLocaleString()}</Typography>
            </Paper>
          )}

          {/* Reports Tab */}
          {activeTab === 2 && profitLoss && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Profit & Loss Statement</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Period: {profitLoss.period?.startDate} to {profitLoss.period?.endDate}</Typography>
                <Typography sx={{ mt: 2 }}>Revenue: ${profitLoss.revenue?.toLocaleString()}</Typography>
                <Typography>Cost of Goods Sold: ${profitLoss.cogs?.toLocaleString()}</Typography>
                <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
                  Gross Profit: ${profitLoss.grossProfit?.toLocaleString()}
                </Typography>
                <Typography>Gross Margin: {profitLoss.grossMargin}%</Typography>
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
