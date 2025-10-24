import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, IconButton
} from '@mui/material';
import {
  Campaign, BarChart, TrendingUp, People,
  PlayArrow, Pause, CheckCircle, Visibility
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function MarketingCampaigns() {
  const [tab, setTab] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/api/field-marketing/campaigns`).catch(() => ({ data: { campaigns: [] } })),
        axios.get(`${API_URL}/api/campaign-analytics/summary`).catch(() => ({ data: { analytics: {} } }))
      ]);
      
      setCampaigns(campaignsRes.data.campaigns || []);
      setAnalytics(analyticsRes.data.analytics || {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      draft: 'default',
      scheduled: 'info',
      completed: 'primary',
      paused: 'warning'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Marketing Campaigns
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Campaign color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{campaigns.length}</Typography>
                  <Typography color="textSecondary">Total Campaigns</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {campaigns.filter(c => c.status === 'active').length}
                  </Typography>
                  <Typography color="textSecondary">Active</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_reach || 0}</Typography>
                  <Typography color="textSecondary">Total Reach</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BarChart color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.conversion_rate || 0}%</Typography>
                  <Typography color="textSecondary">Conversion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="All Campaigns" />
          <Tab label="Active" />
          <Tab label="Performance" />
        </Tabs>

        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              {/* All Campaigns Tab */}
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Campaign</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Budget</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>{campaign.name || `Campaign #${campaign.id}`}</TableCell>
                          <TableCell>{campaign.type || 'General'}</TableCell>
                          <TableCell>
                            {campaign.start_date 
                              ? new Date(campaign.start_date).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {campaign.end_date 
                              ? new Date(campaign.end_date).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            ${(campaign.budget || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={campaign.status || 'draft'}
                              color={getStatusColor(campaign.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Visibility fontSize="small" />
                            </IconButton>
                            {campaign.status === 'active' ? (
                              <IconButton size="small" color="warning">
                                <Pause fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton size="small" color="success">
                                <PlayArrow fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Active Campaigns Tab */}
              {tab === 1 && (
                <Grid container spacing={2}>
                  {campaigns.filter(c => c.status === 'active').map((campaign) => (
                    <Grid item xs={12} md={6} key={campaign.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {campaign.name || `Campaign #${campaign.id}`}
                          </Typography>
                          <Typography color="textSecondary" gutterBottom>
                            {campaign.description || 'No description'}
                          </Typography>
                          <Box mt={2}>
                            <Typography variant="body2">
                              Budget: ${(campaign.budget || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              Reach: {campaign.reach || 0} customers
                            </Typography>
                            <Typography variant="body2">
                              Conversion: {campaign.conversion_rate || 0}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Performance Tab */}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Campaign Metrics</Typography>
                        <Typography>Total Campaigns: {campaigns.length}</Typography>
                        <Typography>
                          Active: {campaigns.filter(c => c.status === 'active').length}
                        </Typography>
                        <Typography>
                          Completed: {campaigns.filter(c => c.status === 'completed').length}
                        </Typography>
                        <Typography>
                          Draft: {campaigns.filter(c => c.status === 'draft').length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>ROI Analysis</Typography>
                        <Typography>
                          Total Budget: ${campaigns.reduce((sum, c) => sum + (c.budget || 0), 0).toLocaleString()}
                        </Typography>
                        <Typography>Total Reach: {analytics.total_reach || 0}</Typography>
                        <Typography>Avg Conversion: {analytics.conversion_rate || 0}%</Typography>
                        <Typography>ROI: {analytics.roi || 0}%</Typography>
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
