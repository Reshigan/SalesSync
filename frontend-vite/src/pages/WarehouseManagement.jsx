import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Tabs, Tab, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, LinearProgress
} from '@mui/material';
import {
  LocalShipping, Inventory2, CheckCircle, Refresh
} from '@mui/icons-material';
import { apiClient } from '../../services/api.service';

export default function WarehouseManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receiving, setReceiving] = useState([]);
  const [picking, setPicking] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 0: // Receiving
          const recRes = await apiClient.get('/warehouse/receiving/pending?warehouseId=1');
          setReceiving(recRes.data.pending || []);
          break;
        case 1: // Picking
          const pickRes = await apiClient.get('/warehouse/pick/active?warehouseId=1');
          setPicking(pickRes.data.active || []);
          break;
        case 2: // Analytics
          const analyticsRes = await apiClient.get('/warehouse/analytics?warehouseId=1');
          setAnalytics(analyticsRes.data.metrics);
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
          <LocalShipping sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Warehouse Management
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Receiving Tasks</Typography>
              <Typography variant="h4">{receiving.length}</Typography>
              <Typography variant="body2">Pending receipts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Picks</Typography>
              <Typography variant="h4">{picking.length}</Typography>
              <Typography variant="body2">In progress</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Shipments</Typography>
              <Typography variant="h4">{analytics?.shipping?.total_shipments || 0}</Typography>
              <Typography variant="body2">Total shipped</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Receiving" icon={<Inventory2 />} iconPosition="start" />
          <Tab label="Picking" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Analytics" icon={<LocalShipping />} iconPosition="start" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Receiving Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receiving.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.po_number}</TableCell>
                      <TableCell>{task.supplier_name}</TableCell>
                      <TableCell>{task.items_count}</TableCell>
                      <TableCell>
                        <Chip label={task.status} color="warning" size="small" />
                      </TableCell>
                      <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small">Process</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Picking Tab */}
          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {picking.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.order_number}</TableCell>
                      <TableCell>{task.customer_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={task.priority} 
                          color={task.priority === 'high' ? 'error' : 'default'}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(task.picked_items / task.total_items) * 100}
                            sx={{ width: 100 }}
                          />
                          <Typography variant="body2">
                            {task.picked_items}/{task.total_items}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={task.status} size="small" />
                      </TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small">Continue</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Analytics Tab */}
          {activeTab === 2 && analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Receiving Metrics</Typography>
                  <Typography>Total Receipts: {analytics.receiving?.total_receipts}</Typography>
                  <Typography>Completed: {analytics.receiving?.completed}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Picking Metrics</Typography>
                  <Typography>Total Picks: {analytics.picking?.total_picks}</Typography>
                  <Typography>
                    Avg Time: {analytics.picking?.avg_pick_time?.toFixed(2)} days
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Shipping Metrics</Typography>
                  <Typography>Total Shipments: {analytics.shipping?.total_shipments}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
