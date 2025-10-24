import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Avatar, LinearProgress
} from '@mui/material';
import {
  Person, CheckCircle, Schedule, LocationOn, 
  TrendingUp, Assignment, Group
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function FieldOperationsDashboard() {
  const [tab, setTab] = useState(0);
  const [agents, setAgents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentsRes, visitsRes, perfRes] = await Promise.all([
        axios.get(`${API_URL}/api/field-operations/agents`).catch(() => ({ data: { agents: [] } })),
        axios.get(`${API_URL}/api/field-operations/visits`).catch(() => ({ data: { visits: [] } })),
        axios.get(`${API_URL}/api/field-operations/performance`).catch(() => ({ data: { performance: {} } }))
      ]);
      
      setAgents(agentsRes.data.agents || []);
      setVisits(visitsRes.data.visits || []);
      setPerformance(perfRes.data.performance || {});
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
      completed: 'info',
      pending: 'warning',
      in_progress: 'primary'
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Field Operations Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Group color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{agents.length}</Typography>
                  <Typography color="textSecondary">Total Agents</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{visits.length}</Typography>
                  <Typography color="textSecondary">Today's Visits</Typography>
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
                  <Typography variant="h4">
                    {visits.filter(v => v.status === 'completed').length}
                  </Typography>
                  <Typography color="textSecondary">Completed</Typography>
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
                  <Typography variant="h4">
                    {performance.completion_rate || 0}%
                  </Typography>
                  <Typography color="textSecondary">Completion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Field Agents" />
          <Tab label="Today's Visits" />
          <Tab label="Performance" />
        </Tabs>

        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              {/* Agents Tab */}
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Territory</TableCell>
                        <TableCell>Visits Today</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Location</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 1 }}>{agent.name?.[0]}</Avatar>
                              {agent.name || 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell>{agent.territory || 'N/A'}</TableCell>
                          <TableCell>{agent.visits_today || 0}</TableCell>
                          <TableCell>{agent.completed_today || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={agent.status || 'active'}
                              color={getStatusColor(agent.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                              {agent.last_location || 'Unknown'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Visits Tab */}
              {tab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Visit ID</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Scheduled Time</TableCell>
                        <TableCell>Check-in</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Purpose</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>#{visit.id}</TableCell>
                          <TableCell>Agent {visit.agent_id}</TableCell>
                          <TableCell>{visit.customer_name || `Customer ${visit.customer_id}`}</TableCell>
                          <TableCell>
                            {visit.scheduled_time ? new Date(visit.scheduled_time).toLocaleTimeString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={visit.status || 'pending'}
                              color={getStatusColor(visit.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{visit.purpose || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Performance Tab */}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Daily Metrics</Typography>
                        <Typography>Total Visits: {visits.length}</Typography>
                        <Typography>
                          Completed: {visits.filter(v => v.status === 'completed').length}
                        </Typography>
                        <Typography>
                          In Progress: {visits.filter(v => v.status === 'in_progress').length}
                        </Typography>
                        <Typography>
                          Pending: {visits.filter(v => v.status === 'pending').length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Agent Activity</Typography>
                        <Typography>
                          Active Agents: {agents.filter(a => a.status === 'active').length}
                        </Typography>
                        <Typography>
                          Avg Visits/Agent: {
                            agents.length > 0 ? (visits.length / agents.length).toFixed(1) : 0
                          }
                        </Typography>
                        <Typography>
                          Top Performer: {
                            agents.sort((a, b) => (b.completed_today || 0) - (a.completed_today || 0))[0]?.name || 'N/A'
                          }
                        </Typography>
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
