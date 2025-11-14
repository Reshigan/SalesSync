import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { apiClient } from '../services/api.service';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserProfile() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    in_app_enabled: true,
    order_notifications: true,
    inventory_notifications: true,
    financial_notifications: true,
    marketing_notifications: false
  });

  // Login history
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchLoginHistory();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get('/auth/me');

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        setProfileForm({
          username: userData.username || '',
          email: userData.email || '',
          full_name: userData.full_name || '',
          phone: userData.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showSnackbar('Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await apiClient.get('/users/login-history');

      if (response.data.success) {
        setLoginHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await apiClient.put(`/users/${user.id}`, profileForm);

      if (response.data.success) {
        showSnackbar('Profile updated successfully', 'success');
        fetchUserData();
      }
    } catch (error) {
      showSnackbar('Failed to update profile', 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data.success) {
        showSnackbar('Password changed successfully', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to change password', 'error');
    }
  };

  const handleNotificationPrefsUpdate = async () => {
    try {
      const response = await apiClient.put('/notifications/preferences', notificationPrefs);

      if (response.data.success) {
        showSnackbar('Notification preferences updated', 'success');
      }
    } catch (error) {
      showSnackbar('Failed to update preferences', 'error');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('resource_type', 'user_avatar');
    formData.append('resource_id', user.id);

    try {
      const response = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showSnackbar('Avatar uploaded successfully', 'success');
        fetchUserData();
      }
    } catch (error) {
      showSnackbar('Failed to upload avatar', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{ width: 120, height: 120, bgcolor: 'primary.main' }}
                src={user?.avatar}
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0)}
              </Avatar>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarUpload}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper'
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">{user?.full_name || user?.username}</Typography>
            <Typography color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={user?.role?.toUpperCase()} color="primary" size="small" sx={{ mr: 1 }} />
              <Chip
                label={user?.status?.toUpperCase()}
                color={user?.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<LockIcon />} label="Security" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<HistoryIcon />} label="Activity" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                InputProps={{ startAdornment: <BadgeIcon sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleProfileUpdate}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<LockIcon />}
                onClick={handlePasswordChange}
              >
                Change Password
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Two-factor authentication adds an extra layer of security to your account.
          </Alert>
          <Button variant="outlined" startIcon={<SecurityIcon />}>
            Enable 2FA
          </Button>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Channels
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText primary="Email Notifications" secondary="Receive notifications via email" />
              <Switch
                checked={notificationPrefs.email_enabled}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email_enabled: e.target.checked })}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PhoneIcon />
              </ListItemIcon>
              <ListItemText primary="SMS Notifications" secondary="Receive notifications via SMS" />
              <Switch
                checked={notificationPrefs.sms_enabled}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, sms_enabled: e.target.checked })}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText primary="Push Notifications" secondary="Receive browser push notifications" />
              <Switch
                checked={notificationPrefs.push_enabled}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push_enabled: e.target.checked })}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Notification Types
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Order Notifications" secondary="Updates about orders" />
              <Switch
                checked={notificationPrefs.order_notifications}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, order_notifications: e.target.checked })}
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Inventory Notifications" secondary="Stock alerts and updates" />
              <Switch
                checked={notificationPrefs.inventory_notifications}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, inventory_notifications: e.target.checked })}
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Financial Notifications" secondary="Payment and invoice updates" />
              <Switch
                checked={notificationPrefs.financial_notifications}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, financial_notifications: e.target.checked })}
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Marketing Notifications" secondary="Campaigns and promotions" />
              <Switch
                checked={notificationPrefs.marketing_notifications}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, marketing_notifications: e.target.checked })}
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleNotificationPrefsUpdate}
            >
              Save Preferences
            </Button>
          </Box>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Login History
          </Typography>
          <List>
            {loginHistory.length === 0 ? (
              <Typography color="text.secondary">No recent activity</Typography>
            ) : (
              loginHistory.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Login ${item.success ? 'successful' : 'failed'}`}
                    secondary={`${item.ip_address} • ${new Date(item.created_at).toLocaleString()}`}
                  />
                  <Chip
                    label={item.success ? 'Success' : 'Failed'}
                    color={item.success ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
              ))
            )}
          </List>
        </TabPanel>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
