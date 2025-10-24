import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  LocalShipping, Route, Inventory, AttachMoney, 
  PlayArrow, Stop, CheckCircle, Timeline
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function VanSalesManagement() {
  const [tab, setTab] = useState(0);
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadTrips();
    loadRoutes();
    loadVehicles();
    loadAnalytics();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/van-sales-operations/trips`);
      setTrips(res.data.trips || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/van-sales-operations/routes`);
      setRoutes(res.data.routes || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/van-sales-operations/vehicles`);
      setVehicles(res.data.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/van-sales-operations/analytics`);
      setAnalytics(res.data.analytics || {});
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const startTrip = async (tripId) => {
    try {
      await axios.post(`${API_URL}/api/van-sales-operations/trips/${tripId}/start`, {
        start_odometer: 0
      });
      loadTrips();
    } catch (error) {
      console.error('Error starting trip:', error);
    }
  };

  const completeTrip = async (tripId) => {
    try {
      await axios.post(`${API_URL}/api/van-sales-operations/trips/${tripId}/complete`, {
        end_odometer: 0,
        fuel_cost: 0
      });
      loadTrips();
    } catch (error) {
      console.error('Error completing trip:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'default',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Van Sales Management
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalShipping color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_trips || 0}</Typography>
                  <Typography color="textSecondary">Total Trips</Typography>
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
                  <Typography variant="h4">
                    ${(analytics.total_sales || 0).toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">Total Sales</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Route color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.customers_visited || 0}</Typography>
                  <Typography color="textSecondary">Customers Visited</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_distance || 0} km</Typography>
                  <Typography color="textSecondary">Distance Traveled</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Active Trips" />
          <Tab label="Routes" />
          <Tab label="Vehicles" />
          <Tab label="Analytics" />
        </Tabs>

        <CardContent>
          {/* Active Trips Tab */}
          {tab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sales</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>#{trip.id}</TableCell>
                      <TableCell>{trip.route_name || 'N/A'}</TableCell>
                      <TableCell>{new Date(trip.trip_date).toLocaleDateString()}</TableCell>
                      <TableCell>Driver {trip.driver_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={trip.status}
                          color={getStatusColor(trip.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${(trip.total_sales || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {trip.status === 'planned' && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => startTrip(trip.id)}
                          >
                            <PlayArrow />
                          </IconButton>
                        )}
                        {trip.status === 'in_progress' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => completeTrip(trip.id)}
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Routes Tab */}
          {tab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route Code</TableCell>
                    <TableCell>Route Name</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Total Trips</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>{route.route_code}</TableCell>
                      <TableCell>{route.route_name}</TableCell>
                      <TableCell>{route.day_of_week || 'N/A'}</TableCell>
                      <TableCell>{route.estimated_duration} mins</TableCell>
                      <TableCell>{route.total_trips || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={route.status}
                          color={route.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Vehicles Tab */}
          {tab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle Code</TableCell>
                    <TableCell>License Plate</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Odometer</TableCell>
                    <TableCell>Total Trips</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.vehicle_code}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell>{vehicle.vehicle_type}</TableCell>
                      <TableCell>{vehicle.capacity_weight} kg</TableCell>
                      <TableCell>{vehicle.current_odometer} km</TableCell>
                      <TableCell>{vehicle.total_trips || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={vehicle.status}
                          color={vehicle.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Analytics Tab */}
          {tab === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Trip Performance</Typography>
                    <Typography>Total Trips: {analytics.total_trips || 0}</Typography>
                    <Typography>Completed: {analytics.completed_trips || 0}</Typography>
                    <Typography>
                      Completion Rate: {
                        analytics.total_trips > 0
                          ? ((analytics.completed_trips / analytics.total_trips) * 100).toFixed(1)
                          : 0
                      }%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                    <Typography>Total Sales: ${(analytics.total_sales || 0).toLocaleString()}</Typography>
                    <Typography>Avg Sale: ${(analytics.avg_sale_amount || 0).toFixed(2)}</Typography>
                    <Typography>Fuel Costs: ${(analytics.total_fuel_cost || 0).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
