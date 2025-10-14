/**
 * SalesSync Tier-1 Visit Management Component
 * Comprehensive visit management for all agent types
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  LocationOn,
  Schedule,
  Person,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Navigation,
  Camera,
  Assignment
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useAuth } from '../../contexts/AuthContext';
import { useVisits } from '../../hooks/useVisits';
import { formatDateTime, getStatusColor } from '../../utils/formatters';

const VISIT_TYPES = {
  VAN_SALES: [
    { value: 'sales_visit', label: 'Sales Visit' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'collection', label: 'Collection' },
    { value: 'customer_service', label: 'Customer Service' }
  ],
  TRADE_MARKETING: [
    { value: 'merchandising_visit', label: 'Merchandising Visit' },
    { value: 'campaign_execution', label: 'Campaign Execution' },
    { value: 'trade_audit', label: 'Trade Audit' },
    { value: 'brand_activation', label: 'Brand Activation' }
  ],
  PROMOTION_EVENTS: [
    { value: 'event_setup', label: 'Event Setup' },
    { value: 'promotion_execution', label: 'Promotion Execution' },
    { value: 'sampling_activity', label: 'Sampling Activity' },
    { value: 'brand_engagement', label: 'Brand Engagement' }
  ],
  FIELD_MARKETING: [
    { value: 'market_research', label: 'Market Research' },
    { value: 'competitor_audit', label: 'Competitor Audit' },
    { value: 'customer_survey', label: 'Customer Survey' },
    { value: 'lead_qualification', label: 'Lead Qualification' }
  ]
};

const VisitManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const {
    visits,
    loading,
    createVisit,
    updateVisit,
    deleteVisit,
    assignVisit,
    completeVisit
  } = useVisits();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    visit_type: '',
    visit_purpose: '',
    scheduled_date: new Date(),
    estimated_duration: 60,
    priority: 'medium',
    special_instructions: '',
    objectives: [],
    agent_id: user?.id
  });

  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Delhi default

  const handleOpenDialog = (visit = null) => {
    if (visit) {
      setSelectedVisit(visit);
      setFormData({
        ...visit,
        scheduled_date: new Date(visit.scheduled_date)
      });
    } else {
      setSelectedVisit(null);
      setFormData({
        customer_id: '',
        visit_type: '',
        visit_purpose: '',
        scheduled_date: new Date(),
        estimated_duration: 60,
        priority: 'medium',
        special_instructions: '',
        objectives: [],
        agent_id: user?.id
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVisit(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedVisit) {
        await updateVisit(selectedVisit.id, formData);
      } else {
        await createVisit(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving visit:', error);
    }
  };

  const handleCompleteVisit = async (visitId) => {
    try {
      await completeVisit(visitId, {
        completion_notes: 'Visit completed successfully',
        completion_time: new Date()
      });
    } catch (error) {
      console.error('Error completing visit:', error);
    }
  };

  const getVisitTypeOptions = () => {
    return VISIT_TYPES[user?.agent_type] || VISIT_TYPES.FIELD_MARKETING;
  };

  const VisitCard = ({ visit }) => (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {visit.customer_name}
            </Typography>
            <Chip
              label={visit.visit_type.replace('_', ' ').toUpperCase()}
              size="small"
              color="primary"
              sx={{ mr: 1 }}
            />
            <Chip
              label={visit.status.toUpperCase()}
              size="small"
              color={getStatusColor(visit.status)}
            />
          </Box>
          <Box>
            <IconButton size="small" onClick={() => handleOpenDialog(visit)}>
              <Edit />
            </IconButton>
            <IconButton size="small" onClick={() => deleteVisit(visit.id)}>
              <Delete />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Schedule fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {formatDateTime(visit.scheduled_date)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {visit.agent_name}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {visit.customer_address}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Assignment fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {visit.visit_purpose}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {visit.status === 'assigned' && (
          <Box mt={2} display="flex" gap={1}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleCompleteVisit(visit.id)}
            >
              Complete Visit
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Navigation />}
            >
              Navigate
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Camera />}
            >
              Capture
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const VisitDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedVisit ? 'Edit Visit' : 'Create New Visit'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              select
            >
              {/* Customer options would be loaded from API */}
              <MenuItem value="customer1">Customer 1</MenuItem>
              <MenuItem value="customer2">Customer 2</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Visit Type</InputLabel>
              <Select
                value={formData.visit_type}
                onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
              >
                {getVisitTypeOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Visit Purpose"
              value={formData.visit_purpose}
              onChange={(e) => setFormData({ ...formData, visit_purpose: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Scheduled Date & Time"
                value={formData.scheduled_date}
                onChange={(date) => setFormData({ ...formData, scheduled_date: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Duration (minutes)"
              type="number"
              value={formData.estimated_duration}
              onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Agent"
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              select
            >
              {/* Agent options would be loaded from API */}
              <MenuItem value={user?.id}>{user?.first_name} {user?.last_name}</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Instructions"
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {selectedVisit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Visit Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Visit
        </Button>
      </Box>

      {/* Visit Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Visits
              </Typography>
              <Typography variant="h4">
                {visits?.filter(v => new Date(v.scheduled_date).toDateString() === new Date().toDateString()).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {visits?.filter(v => v.status === 'completed').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {visits?.filter(v => v.status === 'assigned').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" color="error.main">
                {visits?.filter(v => v.status === 'overdue').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visit List */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Scheduled Visits
          </Typography>
          {visits?.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Visit Map
              </Typography>
              <Box height={400}>
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={10}
                  >
                    {visits?.map((visit) => (
                      <Marker
                        key={visit.id}
                        position={{
                          lat: visit.customer_latitude,
                          lng: visit.customer_longitude
                        }}
                        title={visit.customer_name}
                      />
                    ))}
                  </GoogleMap>
                </LoadScript>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <VisitDialog />

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenDialog()}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default VisitManagement;