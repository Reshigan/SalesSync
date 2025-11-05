import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../services/api';

interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'date' | 'photo' | 'signature';
  label: string;
  required: boolean;
  options?: string[];
}

interface ProductType {
  id?: number;
  name: string;
  description: string;
  form_schema: FormField[];
  commission_amount: number;
}

const ProductTypeBuilderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productType, setProductType] = useState<ProductType>({
    name: '',
    description: '',
    form_schema: [],
    commission_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      loadProductType();
    }
  }, [id]);

  const loadProductType = async () => {
    try {
      const response = await apiClient.get(`/product-types/${id}`);
      const data = response.data.data;
      setProductType({
        ...data,
        form_schema: JSON.parse(data.form_schema || '[]'),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product type');
    }
  };

  const addField = () => {
    setProductType({
      ...productType,
      form_schema: [
        ...productType.form_schema,
        {
          id: `field${Date.now()}`,
          type: 'text',
          label: '',
          required: false,
        },
      ],
    });
  };

  const updateField = (index: number, field: string, value: any) => {
    const newFields = [...productType.form_schema];
    newFields[index] = { ...newFields[index], [field]: value };
    setProductType({ ...productType, form_schema: newFields });
  };

  const deleteField = (index: number) => {
    const newFields = productType.form_schema.filter((_, i) => i !== index);
    setProductType({ ...productType, form_schema: newFields });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...productType.form_schema];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFields.length) return;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setProductType({ ...productType, form_schema: newFields });
  };

  const handleSave = async () => {
    if (!productType.name.trim()) {
      setError('Product type name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...productType,
        form_schema: JSON.stringify(productType.form_schema),
      };

      if (id) {
        await apiClient.put(`/product-types/${id}`, payload);
        setSuccess('Product type updated successfully');
      } else {
        await apiClient.post('/product-types', payload);
        setSuccess('Product type created successfully');
      }

      setTimeout(() => navigate('/admin/product-types'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product type');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{id ? 'Edit Product Type' : 'Create Product Type'}</Typography>
        <Box>
          <Button onClick={() => navigate('/admin/product-types')} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            Save Product Type
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Product Type Details</Typography>
          <TextField
            fullWidth
            label="Product Type Name"
            value={productType.name}
            onChange={(e) => setProductType({ ...productType, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={productType.description}
            onChange={(e) => setProductType({ ...productType, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Commission Amount (ZAR)"
            value={productType.commission_amount}
            onChange={(e) => setProductType({ ...productType, commission_amount: parseFloat(e.target.value) })}
            InputProps={{ startAdornment: 'R' }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Distribution Form Fields</Typography>
            <Button startIcon={<Add />} onClick={addField}>
              Add Field
            </Button>
          </Box>

          {productType.form_schema.length === 0 && (
            <Alert severity="info">No form fields added yet. Click "Add Field" to get started.</Alert>
          )}

          {productType.form_schema.map((field, index) => (
            <Card key={field.id} sx={{ mb: 2, bgcolor: 'grey.50' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">Field {index + 1}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUpward />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === productType.form_schema.length - 1}
                    >
                      <ArrowDownward />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteField(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="Field Label"
                  value={field.label}
                  onChange={(e) => updateField(index, 'label', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Field Type</InputLabel>
                    <Select
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="select">Select</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="photo">Photo</MenuItem>
                      <MenuItem value="signature">Signature</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.required}
                        onChange={(e) => updateField(index, 'required', e.target.checked)}
                      />
                    }
                    label="Required"
                  />
                </Box>

                {field.type === 'select' && (
                  <TextField
                    fullWidth
                    label="Options (comma-separated)"
                    value={(field.options || []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        index,
                        'options',
                        e.target.value.split(',').map((o) => o.trim())
                      )
                    }
                    helperText="Enter options separated by commas"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductTypeBuilderPage;
