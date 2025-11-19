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
  Divider,
  Alert,
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../services/api';

interface SurveyQuestion {
  id: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'photo' | 'signature';
  label: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface Survey {
  id?: number;
  name: string;
  description: string;
  brand_id?: number;
  is_mandatory: boolean;
  questions: SurveyQuestion[];
}

const SurveyBuilderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey>({
    name: '',
    description: '',
    is_mandatory: false,
    questions: [],
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBrands();
    if (id) {
      loadSurvey();
    }
  }, [id]);

  const loadBrands = async () => {
    try {
      const response = await apiClient.get('/brands');
      const brandsData = response.data.data?.brands || response.data.data || [];
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  const loadSurvey = async () => {
    try {
      const response = await apiClient.get(`/surveys/${id}`);
      const data = response.data.data;
      setSurvey({
        ...data,
        questions: JSON.parse(data.questions || '[]'),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load survey');
    }
  };

  const addQuestion = () => {
    setSurvey({
      ...survey,
      questions: [
        ...survey.questions,
        {
          id: `q${Date.now()}`,
          type: 'text',
          label: '',
          required: false,
        },
      ],
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...survey.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setSurvey({ ...survey, questions: newQuestions });
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = survey.questions.filter((_, i) => i !== index);
    setSurvey({ ...survey, questions: newQuestions });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...survey.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setSurvey({ ...survey, questions: newQuestions });
  };

  const handleSave = async () => {
    if (!survey.name.trim()) {
      setError('Survey name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...survey,
        questions: JSON.stringify(survey.questions),
      };

      if (id) {
        await apiClient.put(`/surveys/${id}`, payload);
        setSuccess('Survey updated successfully');
      } else {
        await apiClient.post('/surveys', payload);
        setSuccess('Survey created successfully');
      }

      setTimeout(() => navigate('/admin/surveys'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save survey');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{id ? 'Edit Survey' : 'Create Survey'}</Typography>
        <Box>
          <Button onClick={() => navigate('/admin/surveys')} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            Save Survey
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Survey Details</Typography>
          <TextField
            fullWidth
            label="Survey Name"
            value={survey.name}
            onChange={(e) => setSurvey({ ...survey, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={survey.description}
            onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Brand (Optional)</InputLabel>
            <Select
              value={survey.brand_id || ''}
              onChange={(e) => setSurvey({ ...survey, brand_id: e.target.value as number })}
            >
              <MenuItem value="">None</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={survey.is_mandatory}
                onChange={(e) => setSurvey({ ...survey, is_mandatory: e.target.checked })}
              />
            }
            label="Mandatory Survey"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Questions</Typography>
            <Button startIcon={<Add />} onClick={addQuestion}>
              Add Question
            </Button>
          </Box>

          {survey.questions.length === 0 && (
            <Alert severity="info">No questions added yet. Click "Add Question" to get started.</Alert>
          )}

          {survey.questions.map((question, index) => (
            <Card key={question.id} sx={{ mb: 2, bgcolor: 'grey.50' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">Question {index + 1}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUpward />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === survey.questions.length - 1}
                    >
                      <ArrowDownward />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteQuestion(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="Question Label"
                  value={question.label}
                  onChange={(e) => updateQuestion(index, 'label', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={question.type}
                      onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="select">Select (Single)</MenuItem>
                      <MenuItem value="multiselect">Select (Multiple)</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="photo">Photo</MenuItem>
                      <MenuItem value="signature">Signature</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={question.required}
                        onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                      />
                    }
                    label="Required"
                  />
                </Box>

                {(question.type === 'select' || question.type === 'multiselect') && (
                  <TextField
                    fullWidth
                    label="Options (comma-separated)"
                    value={(question.options || []).join(', ')}
                    onChange={(e) =>
                      updateQuestion(
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

export default SurveyBuilderPage;
