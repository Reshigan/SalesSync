import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Button
} from '@mui/material';
import {
  AccountTree, PlayArrow, CheckCircle, Schedule, Add
} from '@mui/icons-material';
import { apiClient } from '../../services/api.service';

export default function WorkflowsDashboard() {
  const [tab, setTab] = useState(0);
  const [workflows, setWorkflows] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wfRes, instRes] = await Promise.all([
        apiClient.get('/workflows').catch(() => ({ data: { workflows: [] } })),
        apiClient.get('/workflows/instances').catch(() => ({ data: { instances: [] } }))
      ]);
      
      setWorkflows(wfRes.data.workflows || []);
      setInstances(instRes.data.instances || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { active: 'primary', completed: 'success', pending: 'warning', failed: 'error' };
    return colors[status?.toLowerCase()] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Workflows Dashboard</Typography>
        <Button variant="contained" startIcon={<Add />}>New Workflow</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { icon: AccountTree, value: workflows.length, label: 'Total Workflows', color: 'primary' },
          { icon: PlayArrow, value: instances.filter(i => i.status === 'active').length, label: 'Active', color: 'info' },
          { icon: CheckCircle, value: instances.filter(i => i.status === 'completed').length, label: 'Completed', color: 'success' },
          { icon: Schedule, value: instances.filter(i => i.status === 'pending').length, label: 'Pending', color: 'warning' }
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
          <Tab label="Workflows" />
          <Tab label="Active Instances" />
          <Tab label="History" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Workflow</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Steps</TableCell>
                        <TableCell>Instances</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workflows.map((wf) => (
                        <TableRow key={wf.id}>
                          <TableCell>{wf.name || `Workflow ${wf.id}`}</TableCell>
                          <TableCell>{wf.type || 'General'}</TableCell>
                          <TableCell>{wf.steps || 0}</TableCell>
                          <TableCell>{wf.instances || 0}</TableCell>
                          <TableCell>
                            <Chip label={wf.status || 'active'} color="success" size="small" />
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
                        <TableCell>Instance ID</TableCell>
                        <TableCell>Workflow</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Current Step</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {instances.filter(i => i.status === 'active').map((inst) => (
                        <TableRow key={inst.id}>
                          <TableCell>#{inst.id}</TableCell>
                          <TableCell>Workflow {inst.workflow_id}</TableCell>
                          <TableCell>
                            {inst.started_at ? new Date(inst.started_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>Step {inst.current_step || 1}</TableCell>
                          <TableCell>
                            <Chip label={inst.status} color={getStatusColor(inst.status)} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 2 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Instance ID</TableCell>
                        <TableCell>Workflow</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {instances.map((inst) => (
                        <TableRow key={inst.id}>
                          <TableCell>#{inst.id}</TableCell>
                          <TableCell>Workflow {inst.workflow_id}</TableCell>
                          <TableCell>
                            {inst.started_at ? new Date(inst.started_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {inst.completed_at ? new Date(inst.completed_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip label={inst.status} color={getStatusColor(inst.status)} size="small" />
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
