import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, LinearProgress, IconButton
} from '@mui/material';
import {
  People, TrendingUp, AttachMoney, Event,
  Phone, Email, LocationOn, Edit, Visibility
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function CRMDashboard() {
  const [tab, setTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersRes, leadsRes, oppRes, actRes] = await Promise.all([
        axios.get(`${API_URL}/api/customers`).catch(() => ({ data: { customers: [] } })),
        axios.get(`${API_URL}/api/customers?type=lead`).catch(() => ({ data: { customers: [] } })),
        axios.get(`${API_URL}/api/customers?type=opportunity`).catch(() => ({ data: { customers: [] } })),
        axios.get(`${API_URL}/api/visits`).catch(() => ({ data: { visits: [] } }))
      ]);
      
      setCustomers(customersRes.data.customers || []);
      setLeads(leadsRes.data.customers || []);
      setOpportunities(oppRes.data.customers || []);
      setActivities(actRes.data.visits || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      lead: 'info',
      prospect: 'warning',
      customer: 'success',
      hot: 'error',
      warm: 'warning',
      cold: 'info'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CRM Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{customers.length}</Typography>
                  <Typography color="textSecondary">Total Customers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{leads.length}</Typography>
                  <Typography color="textSecondary">Active Leads</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{opportunities.length}</Typography>
                  <Typography color="textSecondary">Opportunities</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Event color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{activities.length}</Typography>
                  <Typography color="textSecondary">Activities</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Customers" />
          <Tab label="Leads" />
          <Tab label="Opportunities" />
          <Tab label="Activities" />
        </Tabs>

        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              {/* Customers Tab */}
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customers.slice(0, 20).map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 1 }}>{customer.name?.[0]}</Avatar>
                              <Box>
                                <Typography variant="body2">{customer.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  ID: {customer.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box display="flex" alignItems="center" mb={0.5}>
                                <Phone fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="caption">{customer.phone || 'N/A'}</Typography>
                              </Box>
                              <Box display="flex" alignItems="center">
                                <Email fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="caption">{customer.email || 'N/A'}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                              <Typography variant="caption">{customer.address || 'N/A'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={customer.status || 'active'}
                              color={getStatusColor(customer.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {customer.last_activity 
                              ? new Date(customer.last_activity).toLocaleDateString() 
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Leads Tab */}
              {tab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Lead Name</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Temperature</TableCell>
                        <TableCell>Est. Value</TableCell>
                        <TableCell>Assigned To</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>{lead.name}</TableCell>
                          <TableCell>{lead.source || 'Direct'}</TableCell>
                          <TableCell>
                            <Chip
                              label={lead.temperature || 'Warm'}
                              color={getStatusColor(lead.temperature)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>${(lead.estimated_value || 0).toLocaleString()}</TableCell>
                          <TableCell>{lead.assigned_to || 'Unassigned'}</TableCell>
                          <TableCell>
                            {lead.created_at 
                              ? new Date(lead.created_at).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Opportunities Tab */}
              {tab === 2 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Opportunity</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Stage</TableCell>
                        <TableCell>Probability</TableCell>
                        <TableCell>Close Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opportunities.map((opp) => (
                        <TableRow key={opp.id}>
                          <TableCell>{opp.opportunity_name || opp.name}</TableCell>
                          <TableCell>{opp.customer_name || opp.name}</TableCell>
                          <TableCell>${(opp.value || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={opp.stage || 'Prospecting'}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{opp.probability || 50}%</TableCell>
                          <TableCell>
                            {opp.close_date 
                              ? new Date(opp.close_date).toLocaleDateString()
                              : 'TBD'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Activities Tab */}
              {tab === 3 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activities.slice(0, 20).map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            {activity.created_at 
                              ? new Date(activity.created_at).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{activity.type || 'Visit'}</TableCell>
                          <TableCell>Customer {activity.customer_id}</TableCell>
                          <TableCell>Agent {activity.agent_id}</TableCell>
                          <TableCell>{activity.notes || 'No notes'}</TableCell>
                          <TableCell>
                            <Chip
                              label={activity.status || 'completed'}
                              color={getStatusColor(activity.status)}
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
        </CardContent>
      </Card>
    </Box>
  );
}
