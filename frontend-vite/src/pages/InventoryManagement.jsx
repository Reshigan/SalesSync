import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Tabs, Tab, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, CircularProgress, Tooltip
} from '@mui/material';
import {
  Inventory, Warehouse, SwapHoriz, TrendingUp, Warning, Add,
  Refresh, FileDownload, QrCode, LocalShipping
} from '@mui/icons-material';
import { apiClient } from '../../services/api.service';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [lots, setLots] = useState([]);
  
  // Dialog states
  const [transferDialog, setTransferDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [lotDialog, setLotDialog] = useState(false);
  
  // Form states
  const [transferForm, setTransferForm] = useState({
    productId: '',
    fromWarehouseId: 1,
    toWarehouseId: 2,
    quantity: 0,
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 0: // Multi-location
          const invRes = await apiClient.get('/inventory/multi-location');
          setInventory(invRes.data.inventory || []);
          break;
        case 1: // Analytics
          const analyticsRes = await apiClient.get('/inventory/analytics?warehouseId=1');
          setAnalytics(analyticsRes.data);
          break;
        case 2: // Reorder
          const reorderRes = await apiClient.get('/inventory/reorder-suggestions');
          setReorderSuggestions(reorderRes.data.suggestions || []);
          break;
        case 3: // Lots
          const lotsRes = await apiClient.get('/inventory/lots?expiringWithinDays=90');
          setLots(lotsRes.data || []);
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      await apiClient.post('/inventory/transfer', transferForm);
      setTransferDialog(false);
      setTransferForm({ productId: '', fromWarehouseId: 1, toWarehouseId: 2, quantity: 0, reason: '', notes: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low': return 'error';
      case 'overstock': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          <Inventory sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Inventory Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<SwapHoriz />}
            onClick={() => setTransferDialog(true)}
            sx={{ mr: 1 }}
          >
            Transfer Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Products</Typography>
              <Typography variant="h4">{inventory.length}</Typography>
              <Typography variant="body2" color="success.main">
                <TrendingUp sx={{ fontSize: 16, verticalAlign: 'middle' }} /> Across all locations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Quantity</Typography>
              <Typography variant="h4">
                {inventory.reduce((sum, i) => sum + (i.quantity || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2">Units in stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Low Stock Items</Typography>
              <Typography variant="h4" color="error">
                {inventory.filter(i => i.stock_status === 'low').length}
              </Typography>
              <Typography variant="body2">Need attention</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Inventory Value</Typography>
              <Typography variant="h4">
                ${analytics?.currentStock?.inventory_value?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2">Total worth</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Multi-Location View" icon={<Warehouse />} iconPosition="start" />
          <Tab label="Analytics" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Reorder Suggestions" icon={<Warning />} iconPosition="start" />
          <Tab label="Lot Tracking" icon={<QrCode />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Multi-Location View */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Total Qty</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell align="right">Reserved</TableCell>
                    <TableCell align="right">Min/Max</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <Chip label={item.warehouse_name} size="small" />
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.available_quantity}</TableCell>
                      <TableCell align="right">{item.reserved_quantity}</TableCell>
                      <TableCell align="right">
                        {item.min_stock_level} / {item.max_stock_level}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.stock_status?.toUpperCase()}
                          color={getStockStatusColor(item.stock_status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Analytics */}
          {activeTab === 1 && analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Stock Summary</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography>Total Products: {analytics.currentStock?.total_products}</Typography>
                    <Typography>Total Warehouses: {analytics.currentStock?.total_warehouses}</Typography>
                    <Typography>Total Quantity: {analytics.currentStock?.total_quantity?.toLocaleString()}</Typography>
                    <Typography>Available: {analytics.currentStock?.available_quantity?.toLocaleString()}</Typography>
                    <Typography>Reserved: {analytics.currentStock?.reserved_quantity?.toLocaleString()}</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Top Moving Products</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Out</TableCell>
                        <TableCell align="right">In</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.topMovingProducts?.slice(0, 5).map((product) => (
                        <TableRow key={product.product_id}>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell align="right">{product.total_out}</TableCell>
                          <TableCell align="right">{product.total_in}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Reorder Suggestions */}
          {activeTab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="right">Reorder Point</TableCell>
                    <TableCell align="right">Suggested Qty</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reorderSuggestions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell align="right">
                        <Chip label={item.available_quantity} color="error" size="small" />
                      </TableCell>
                      <TableCell align="right">{item.reorder_point}</TableCell>
                      <TableCell align="right">{item.reorder_quantity}</TableCell>
                      <TableCell align="right">${item.estimated_cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small">Create PO</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Lot Tracking */}
          {activeTab === 3 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lot Number</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Mfg Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Days to Expiry</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.lot_number}</TableCell>
                      <TableCell>{lot.product_name}</TableCell>
                      <TableCell>{lot.warehouse_name}</TableCell>
                      <TableCell align="right">{lot.available_quantity}</TableCell>
                      <TableCell>{lot.manufacture_date}</TableCell>
                      <TableCell>{lot.expiry_date}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${Math.floor(lot.days_to_expiry)} days`}
                          color={lot.days_to_expiry < 30 ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Product ID"
              type="number"
              value={transferForm.productId}
              onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="From Warehouse"
              type="number"
              value={transferForm.fromWarehouseId}
              onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="To Warehouse"
              type="number"
              value={transferForm.toWarehouseId}
              onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Reason"
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialog(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
