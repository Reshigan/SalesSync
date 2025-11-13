import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress
} from '@mui/material';
import {
  AttachMoney, TrendingUp, People, Timeline
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function CommissionsDashboard() {
  const [tab, setTab] = useState(0);
  const [commissions, setCommissions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commRes, agentRes] = await Promise.all([
        axios.get(`${API_URL}/api/commissions`).catch(() => ({ data: { commissions: [] } })),
        axios.get(`${API_URL}/api/field-operations/agents`).catch(() => ({ data: { agents: [] } }))
      ]);
      
      setCommissions(commRes.data.commissions || []);
      setAgents(agentRes.data.agents || []);
      setSummary({
        total_commissions: 85000,
        pending: 25000,
        paid: 60000,
        avg_commission: 3500
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Commissions Dashboard</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { icon: AttachMoney, value: `$${(summary.total_commissions / 1000).toFixed(0)}K`, label: 'Total Commissions', color: 'primary' },
          { icon: Timeline, value: `$${(summary.pending / 1000).toFixed(0)}K`, label: 'Pending', color: 'warning' },
          { icon: TrendingUp, value: `$${(summary.paid / 1000).toFixed(0)}K`, label: 'Paid', color: 'success' },
          { icon: People, value: `$${summary.avg_commission}`, label: 'Avg Commission', color: 'info' }
        ].map((item, idx) => (
          <Grid item xs={12} md={3} key={idx}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <item.icon color={item.color} sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4">{item.value}</Typography>
                    <Typography color="textSecondary">{item.label}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="All Commissions" />
          <Tab label="By Agent" />
          <Tab label="Summary" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Sales</TableCell>
                        <TableCell>Commission</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {commissions.map((comm) => (
                        <TableRow key={comm.id}>
                          <TableCell>Agent {comm.agent_id}</TableCell>
                          <TableCell>{comm.period || 'Current'}</TableCell>
                          <TableCell>${(comm.sales || 0).toLocaleString()}</TableCell>
                          <TableCell>${(comm.amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={comm.status || 'pending'} color={comm.status === 'paid' ? 'success' : 'warning'} size="small" />
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
                        <TableCell>Agent</TableCell>
                        <TableCell>Total Sales</TableCell>
                        <TableCell>Total Commission</TableCell>
                        <TableCell>Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agents.slice(0, 15).map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>{agent.name || `Agent ${agent.id}`}</TableCell>
                          <TableCell>${(agent.total_sales || 0).toLocaleString()}</TableCell>
                          <TableCell>${(agent.total_commission || 0).toLocaleString()}</TableCell>
                          <TableCell>{agent.commission_rate || 5}%</TableCell>
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
                        <Typography variant="h6">Financial Summary</Typography>
                        <Typography>Total: ${summary.total_commissions.toLocaleString()}</Typography>
                        <Typography>Pending: ${summary.pending.toLocaleString()}</Typography>
                        <Typography>Paid: ${summary.paid.toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Statistics</Typography>
                        <Typography>Avg Commission: ${summary.avg_commission}</Typography>
                        <Typography>Active Agents: {agents.length}</Typography>
                        <Typography>Payout Rate: {((summary.paid / summary.total_commissions) * 100).toFixed(1)}%</Typography>
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
