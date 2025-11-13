import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Avatar, IconButton
} from '@mui/material';
import {
  People, AccountBalance, CalendarToday, TrendingUp,
  Visibility, Edit
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function HRDashboard() {
  const [tab, setTab] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        axios.get(`${API_URL}/api/users`).catch(() => ({ data: { users: [] } })),
        apiClient.get('/api/field-operations/agents`).catch(() => ({ data: { agents: [] } }))
      ]);
      
      setEmployees(empRes.data.users || []);
      setAttendance(attRes.data.agents || []);
      setPayroll({
        total_payroll: 250000,
        pending_payments: 45000,
        avg_salary: 5000
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>HR & Payroll Dashboard</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{employees.length}</Typography>
                  <Typography color="textSecondary">Total Employees</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">${(payroll.total_payroll / 1000).toFixed(0)}K</Typography>
                  <Typography color="textSecondary">Total Payroll</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarToday color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{attendance.length}</Typography>
                  <Typography color="textSecondary">Active Today</Typography>
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
                  <Typography variant="h4">${payroll.avg_salary}</Typography>
                  <Typography color="textSecondary">Avg Salary</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Employees" />
          <Tab label="Attendance" />
          <Tab label="Payroll" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employees.slice(0, 20).map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 1 }}>{emp.name?.[0] || emp.username?.[0]}</Avatar>
                              {emp.name || emp.username}
                            </Box>
                          </TableCell>
                          <TableCell>{emp.role || 'Staff'}</TableCell>
                          <TableCell>{emp.department || 'General'}</TableCell>
                          <TableCell>
                            <Chip label={emp.status || 'active'} color="success" size="small" />
                          </TableCell>
                          <TableCell>
                            {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                            <IconButton size="small"><Edit fontSize="small" /></IconButton>
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
                        <TableCell>Employee</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.map((att) => (
                        <TableRow key={att.id}>
                          <TableCell>{att.name || `Employee ${att.id}`}</TableCell>
                          <TableCell>{att.check_in || '09:00'}</TableCell>
                          <TableCell>{att.check_out || '-'}</TableCell>
                          <TableCell>{att.hours || '0'}</TableCell>
                          <TableCell>
                            <Chip label={att.status || 'present'} color="success" size="small" />
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
                        <Typography variant="h6" gutterBottom>Monthly Payroll</Typography>
                        <Typography variant="h4">${payroll.total_payroll.toLocaleString()}</Typography>
                        <Typography color="textSecondary" variant="body2">Current Month</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Pending Payments</Typography>
                        <Typography variant="h4" color="warning.main">
                          ${payroll.pending_payments.toLocaleString()}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">To be processed</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Average Salary</Typography>
                        <Typography variant="h4">${payroll.avg_salary.toLocaleString()}</Typography>
                        <Typography color="textSecondary" variant="body2">Per employee</Typography>
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
