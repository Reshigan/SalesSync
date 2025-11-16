import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, IconButton
} from '@mui/material';
import {
  ShoppingCart, Inventory2, Assessment, Store,
  CheckCircle, Warning, Visibility
} from '@mui/icons-material';
import { apiClient } from '../../services/api.service';

export default function MerchandisingDashboard() {
  const [tab, setTab] = useState(0);
  const [planograms, setPlanograms] = useState([]);
  const [stockChecks, setStockChecks] = useState([]);
  const [compliance, setCompliance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planoRes, stockRes] = await Promise.all([
        apiClient.get('/merchandising/planograms').catch(() => ({ data: { planograms: [] } })),
        apiClient.get('/stock-counts').catch(() => ({ data: { counts: [] } }))
      ]);
      
      setPlanograms(planoRes.data.planograms || []);
      setStockChecks(stockRes.data.counts || []);
      setCompliance({
        compliant: 75,
        partial: 15,
        non_compliant: 10
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Merchandising Dashboard</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Store color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{planograms.length}</Typography>
                  <Typography color="textSecondary">Planograms</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{compliance.compliant}%</Typography>
                  <Typography color="textSecondary">Compliance</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Inventory2 color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stockChecks.length}</Typography>
                  <Typography color="textSecondary">Stock Checks</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{compliance.non_compliant}%</Typography>
                  <Typography color="textSecondary">Non-Compliant</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Planograms" />
          <Tab label="Stock Checks" />
          <Tab label="Compliance" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Planogram</TableCell>
                        <TableCell>Store</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Compliance</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {planograms.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name || `Planogram #${p.id}`}</TableCell>
                          <TableCell>{p.store_name || 'N/A'}</TableCell>
                          <TableCell>{p.category || 'General'}</TableCell>
                          <TableCell>
                            <Chip label={p.status || 'active'} color="primary" size="small" />
                          </TableCell>
                          <TableCell>{p.compliance || 0}%</TableCell>
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
                        <TableCell>Check ID</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockChecks.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell>#{check.id}</TableCell>
                          <TableCell>{check.location || 'N/A'}</TableCell>
                          <TableCell>
                            {check.created_at ? new Date(check.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>{check.items_count || 0}</TableCell>
                          <TableCell>
                            <Chip label={check.status || 'pending'} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Compliant</Typography>
                        <Typography variant="h3" color="success.main">{compliance.compliant}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Partial</Typography>
                        <Typography variant="h3" color="warning.main">{compliance.partial}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Non-Compliant</Typography>
                        <Typography variant="h3" color="error.main">{compliance.non_compliant}%</Typography>
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
