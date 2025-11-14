import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress
} from '@mui/material';
import {
  Map, People, LocationOn, TrendingUp
} from '@mui/icons-material';
import { apiClient } from '../../services/api.service';

export default function TerritoryManagement() {
  const [tab, setTab] = useState(0);
  const [territories, setTerritories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [terrRes, assignRes] = await Promise.all([
        apiClient.get('/territories').catch(() => ({ data: { territories: [] } })),
        apiClient.get('/field-operations/agents').catch(() => ({ data: { agents: [] } }))
      ]);
      
      setTerritories(terrRes.data.territories || []);
      setAssignments(assignRes.data.agents || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Territory Management</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { icon: Map, value: territories.length, label: 'Territories', color: 'primary' },
          { icon: People, value: assignments.length, label: 'Assigned Agents', color: 'info' },
          { icon: LocationOn, value: territories.reduce((sum, t) => sum + (t.customers || 0), 0), label: 'Total Customers', color: 'success' },
          { icon: TrendingUp, value: '92%', label: 'Coverage', color: 'warning' }
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
          <Tab label="Territories" />
          <Tab label="Assignments" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Territory</TableCell>
                        <TableCell>Region</TableCell>
                        <TableCell>Customers</TableCell>
                        <TableCell>Assigned Agent</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {territories.map((terr) => (
                        <TableRow key={terr.id}>
                          <TableCell>{terr.name || `Territory ${terr.id}`}</TableCell>
                          <TableCell>{terr.region || 'N/A'}</TableCell>
                          <TableCell>{terr.customers || 0}</TableCell>
                          <TableCell>{terr.agent_name || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Chip label={terr.status || 'active'} color="success" size="small" />
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
                        <TableCell>Territory</TableCell>
                        <TableCell>Customers</TableCell>
                        <TableCell>Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((assign) => (
                        <TableRow key={assign.id}>
                          <TableCell>{assign.name || `Agent ${assign.id}`}</TableCell>
                          <TableCell>{assign.territory || 'N/A'}</TableCell>
                          <TableCell>{assign.customers || 0}</TableCell>
                          <TableCell>
                            <Chip label={`${assign.performance || 85}%`} color="success" size="small" />
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
