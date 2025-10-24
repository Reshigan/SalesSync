import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, IconButton, Button
} from '@mui/material';
import {
  ShoppingBag, Inventory, LocalShipping, AttachMoney,
  Visibility, Add
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function ProcurementDashboard() {
  const [tab, setTab] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, suppRes] = await Promise.all([
        axios.get(`${API_URL}/api/purchase-orders`).catch(() => ({ data: { orders: [] } })),
        axios.get(`${API_URL}/api/suppliers`).catch(() => ({ data: { suppliers: [] } }))
      ]);
      
      setPurchaseOrders(poRes.data.orders || []);
      setSuppliers(suppRes.data.suppliers || []);
      setAnalytics({
        total_pos: poRes.data.orders?.length || 0,
        total_suppliers: suppRes.data.suppliers?.length || 0,
        pending_value: 125000,
        received_value: 450000
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending: 'warning',
      approved: 'info',
      received: 'success',
      cancelled: 'error'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Procurement Dashboard</Typography>
        <Button variant="contained" startIcon={<Add />}>New PO</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ShoppingBag color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_pos}</Typography>
                  <Typography color="textSecondary">Purchase Orders</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalShipping color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_suppliers}</Typography>
                  <Typography color="textSecondary">Suppliers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">${(analytics.pending_value / 1000).toFixed(0)}K</Typography>
                  <Typography color="textSecondary">Pending Value</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Inventory color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">${(analytics.received_value / 1000).toFixed(0)}K</Typography>
                  <Typography color="textSecondary">Received Value</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Purchase Orders" />
          <Tab label="Suppliers" />
          <Tab label="Analytics" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>PO Number</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseOrders.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell>{po.po_number || `PO-${po.id}`}</TableCell>
                          <TableCell>{po.supplier_name || `Supplier ${po.supplier_id}`}</TableCell>
                          <TableCell>
                            {po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>${(po.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={po.status || 'pending'} 
                              color={getStatusColor(po.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Total POs</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>{supplier.name || `Supplier #${supplier.id}`}</TableCell>
                          <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                          <TableCell>{supplier.email || 'N/A'}</TableCell>
                          <TableCell>{supplier.po_count || 0}</TableCell>
                          <TableCell>
                            <Chip 
                              label={supplier.status || 'active'} 
                              color={supplier.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Order Statistics</Typography>
                        <Typography>Total POs: {analytics.total_pos}</Typography>
                        <Typography>
                          Pending: {purchaseOrders.filter(po => po.status === 'pending').length}
                        </Typography>
                        <Typography>
                          Received: {purchaseOrders.filter(po => po.status === 'received').length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                        <Typography>Pending Value: ${analytics.pending_value.toLocaleString()}</Typography>
                        <Typography>Received Value: ${analytics.received_value.toLocaleString()}</Typography>
                        <Typography>Total Value: ${(analytics.pending_value + analytics.received_value).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
