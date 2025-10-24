import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface CustomerFormData {
  name: string;
  code: string;
  type: 'retail' | 'wholesale' | 'distributor';
  phone: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
  creditLimit: number;
  paymentTerms: number;
  status?: string;
}

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  customer?: any;
  mode: 'create' | 'edit';
}

const API_URL = import.meta.env.VITE_API_URL || 'https://ss.gonxt.tech/api';

export default function CustomerFormModal({ open, onClose, customer, mode }: CustomerFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    code: '',
    type: 'retail',
    phone: '',
    email: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    creditLimit: 0,
    paymentTerms: 0,
    status: 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer && mode === 'edit') {
      setFormData({
        name: customer.name || '',
        code: customer.code || '',
        type: customer.type || 'retail',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        latitude: customer.latitude,
        longitude: customer.longitude,
        creditLimit: customer.credit_limit || 0,
        paymentTerms: customer.payment_terms || 0,
        status: customer.status || 'active'
      });
    } else if (mode === 'create') {
      const code = `CUST-${Date.now().toString().slice(-6)}`;
      setFormData(prev => ({ ...prev, code }));
    }
  }, [customer, mode, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const token = localStorage.getItem('token');
      const url = mode === 'create' 
        ? `${API_URL}/customers`
        : `${API_URL}/customers/${customer.id}`;
      
      const method = mode === 'create' ? 'post' : 'put';
      
      const payload = {
        name: data.name,
        code: data.code,
        type: data.type,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        creditLimit: Number(data.creditLimit) || 0,
        paymentTerms: Number(data.paymentTerms) || 0,
        status: data.status
      };

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      }
    }
  });

  const handleChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.code.trim()) newErrors.code = 'Customer code is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create New Customer' : 'Edit Customer'}
        </DialogTitle>
        
        <DialogContent>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
                autoFocus
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                error={!!errors.code}
                helperText={errors.code}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  label="Customer Type"
                >
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="wholesale">Wholesale</MenuItem>
                  <MenuItem value="distributor">Distributor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {mode === 'edit' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 100 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Terms (Days)"
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                InputProps={{
                  inputProps: { min: 0, step: 1 }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saveMutation.isPending}
            startIcon={saveMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
