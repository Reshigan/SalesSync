/**
 * Agent Workflow Page - Mobile-First Field Marketing Agent Workflow
 * 
 * Flow:
 * 1. Customer Selection (existing/new)
 * 2. GPS Validation (10m radius)
 * 3. Brand Selection
 * 4. Visit Task List (surveys, boards, distributions)
 * 5. Task Completion
 * 6. Commission Summary
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  TextField,
  Autocomplete,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from '@mui/material';
import {
  LocationOn,
  Store,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
  Image,
  Inventory,
  AttachMoney,
  WifiOff,
  Wifi,
  Refresh,
} from '@mui/icons-material';
import { apiClient } from '../../services/api';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { offlineQueueService } from '../../services/offline-queue.service';

interface Customer {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Brand {
  id: string;
  name: string;
}

interface VisitTask {
  id: string;
  task_type: 'survey' | 'board' | 'distribution';
  task_ref_id: string;
  is_mandatory: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  sequence_order: number;
}

const steps = [
  'Customer Selection',
  'GPS Validation',
  'Brand Selection',
  'Visit Tasks',
  'Complete Visit',
];

export default function AgentWorkflowPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [queuedVisitsCount, setQueuedVisitsCount] = useState(0);

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [requiresOverride, setRequiresOverride] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([]);

  const [visitId, setVisitId] = useState<string | null>(null);
  const [visitTasks, setVisitTasks] = useState<VisitTask[]>([]);

  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    loadCustomers();
    loadBrands();
  }, []);

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await apiClient.get('/customers');
      setCustomers(response.data.data || []);
      setCustomersLoading(false);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers. Please check your connection and try again.');
      setCustomersLoading(false);
    }
  };

  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await apiClient.get('/brands');
      setBrands(response.data.data || []);
      setBrandsLoading(false);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError('Failed to load brands. Please check your connection and try again.');
      setBrandsLoading(false);
    }
  };

  const handleNext = async () => {
    setError(null);

    if (activeStep === 0) {
      if (!isNewCustomer && !selectedCustomer) {
        setError('Please select a customer');
        return;
      }
      if (isNewCustomer && !newCustomerName.trim()) {
        setError('Please enter customer name');
        return;
      }
    }

    if (activeStep === 1) {
      if (!currentLocation) {
        setError('GPS location is required. Please enable location services and try again.');
        return;
      }
      if (gpsAccuracy && gpsAccuracy > 100) {
        setError('GPS accuracy is poor (> 100m). Please move to an area with better GPS signal or wait for better accuracy.');
        return;
      }
      if (requiresOverride) {
        setError('You are more than 10m away from the customer location. Please move closer or request manager override.');
        return;
      }
    }

    if (activeStep === 2) {
      if (selectedBrands.length === 0) {
        setError('Please select at least one brand');
        return;
      }
      await createVisit();
    }

    if (activeStep === 3) {
      const incompleteMandatory = visitTasks.filter(
        (t) => t.is_mandatory && t.status !== 'completed'
      );
      if (incompleteMandatory.length > 0) {
        setError('Please complete all mandatory tasks');
        return;
      }
    }

    if (activeStep === 4) {
      await completeVisit();
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getCurrentPosition = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);

        if (selectedCustomer) {
          const distance = calculateDistance(
            latitude,
            longitude,
            selectedCustomer.latitude,
            selectedCustomer.longitude
          );
          setDistanceMeters(distance);
          setRequiresOverride(distance > 10);
        }

        setLoading(false);
      },
      (err) => {
        setError(`GPS Error: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const createVisit = async () => {
    setLoading(true);
    try {
      const visitData = {
        customer_id: isNewCustomer ? null : selectedCustomer?.id,
        brand_ids: selectedBrands.map((b) => b.id),
        gps_lat: currentLocation?.lat,
        gps_lng: currentLocation?.lng,
        gps_accuracy: gpsAccuracy,
        visit_type: 'field_marketing',
        is_new_customer: isNewCustomer,
        new_customer_name: isNewCustomer ? newCustomerName : null,
        idempotency_key: `visit-${Date.now()}`,
      };

      const response = await apiClient.post('/field-operations/visits', visitData);

      setVisitId(response.data.data.visit.id);
      setVisitTasks(response.data.data.tasks || []);
      setLoading(false);
    } catch (err: any) {
      if (!isOnline || err.message?.includes('Network') || err.message?.includes('connection')) {
        const queueId = offlineQueueService.addToQueue('/field-operations/visits', 'POST', {
          customer_id: isNewCustomer ? null : selectedCustomer?.id,
          brand_ids: selectedBrands.map((b) => b.id),
          gps_lat: currentLocation?.lat,
          gps_lng: currentLocation?.lng,
          gps_accuracy: gpsAccuracy,
          visit_type: 'field_marketing',
          is_new_customer: isNewCustomer,
          new_customer_name: isNewCustomer ? newCustomerName : null,
          idempotency_key: `visit-${Date.now()}`,
        });
        setQueuedVisitsCount(offlineQueueService.getQueueCount());
        setError('You are offline. Visit has been queued and will be submitted when connection is restored.');
        setVisitId(queueId);
        setVisitTasks([]);
        setLoading(false);
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to create visit. Please try again.');
      setLoading(false);
      throw err;
    }
  };

  const completeVisit = async () => {
    if (!visitId) return;

    setLoading(true);
    try {
      const response = await apiClient.post(`/field-operations/visits/${visitId}/complete`);
      setTotalCommission(response.data.data.total_commission || 0);
      setLoading(false);
      setActiveStep((prev) => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete visit');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Customer
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant={!isNewCustomer ? 'contained' : 'outlined'}
                onClick={() => setIsNewCustomer(false)}
                sx={{ mr: 1 }}
              >
                Existing Customer
              </Button>
              <Button
                variant={isNewCustomer ? 'contained' : 'outlined'}
                onClick={() => setIsNewCustomer(true)}
              >
                New Customer
              </Button>
            </Box>

            {!isNewCustomer ? (
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Customer" fullWidth />
                )}
              />
            ) : (
              <TextField
                label="Customer Name"
                fullWidth
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Enter store name"
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              GPS Validation
            </Typography>
            {!currentLocation ? (
              <Button
                variant="contained"
                startIcon={<LocationOn />}
                onClick={getCurrentPosition}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Getting Location...' : 'Get Current Location'}
              </Button>
            ) : (
              <Box>
                <Alert severity={requiresOverride ? 'warning' : 'success'} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Accuracy:</strong> ±{gpsAccuracy?.toFixed(1)}m
                  </Typography>
                  {distanceMeters !== null && (
                    <Typography variant="body2">
                      <strong>Distance from customer:</strong> {distanceMeters.toFixed(1)}m
                    </Typography>
                  )}
                </Alert>
                {requiresOverride && (
                  <Alert severity="error">
                    Distance exceeds 10m threshold. Manager override required.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Brands
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the brand(s) you're visiting for
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {brands.map((brand) => (
                <Chip
                  key={brand.id}
                  label={brand.name}
                  onClick={() => {
                    if (selectedBrands.find((b) => b.id === brand.id)) {
                      setSelectedBrands(selectedBrands.filter((b) => b.id !== brand.id));
                    } else {
                      setSelectedBrands([...selectedBrands, brand]);
                    }
                  }}
                  color={selectedBrands.find((b) => b.id === brand.id) ? 'primary' : 'default'}
                  variant={selectedBrands.find((b) => b.id === brand.id) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Visit Tasks
            </Typography>
            <List>
              {visitTasks.map((task) => (
                <ListItem
                  key={task.id}
                  button
                  onClick={() => navigate(`/field-agents/task/${task.id}`)}
                >
                  <ListItemIcon>
                    {task.status === 'completed' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <RadioButtonUnchecked />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {task.task_type === 'survey' && <Assignment />}
                        {task.task_type === 'board' && <Image />}
                        {task.task_type === 'distribution' && <Inventory />}
                        <Typography>
                          {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
                        </Typography>
                        {task.is_mandatory && (
                          <Chip label="Mandatory" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={`Status: ${task.status}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 4:
        return (
          <Box textAlign="center">
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Visit Completed!
            </Typography>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <AttachMoney />
                  <Typography variant="h6">Total Commission</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  R {totalCommission.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
            <Button
              variant="contained"
              onClick={() => navigate('/field-agents')}
              sx={{ mt: 3 }}
              fullWidth
            >
              Back to Dashboard
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Field Agent Workflow
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {renderStepContent()}

          {activeStep < 4 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : activeStep === steps.length - 2 ? 'Complete Visit' : 'Next'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
