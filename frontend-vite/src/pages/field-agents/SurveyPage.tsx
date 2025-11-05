/**
 * Survey Page - Dynamic survey renderer for field agents
 * 
 * Features:
 * - Render surveys from JSON schema
 * - Support mandatory and ad-hoc surveys
 * - Brand-specific or combined surveys
 * - Progress tracking
 * - Offline support
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import { CheckCircle, ArrowBack } from '@mui/icons-material';
import DynamicForm from '../../components/agent/DynamicForm';
import { apiClient } from '../../services/api';

interface Survey {
  id: string;
  name: string;
  description: string;
  is_mandatory: boolean;
  scope: 'brand-specific' | 'combined';
  brand_ids: string[];
  questions: any; // JSON schema
  ui_schema: any;
}

interface SurveyInstance {
  id: string;
  visit_id: string;
  survey_id: string;
  brand_id?: string;
  status: 'pending' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
}

export default function SurveyPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [instance, setInstance] = useState<SurveyInstance | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadSurveyInstance();
  }, [instanceId]);

  const loadSurveyInstance = async () => {
    setLoading(true);
    try {
      const instanceResponse = await apiClient.get(`/surveys/instances/${instanceId}`);
      const instanceData = instanceResponse.data.data;
      setInstance(instanceData);

      const surveyResponse = await apiClient.get(`/surveys/${instanceData.survey_id}`);
      const surveyData = surveyResponse.data.data;
      setSurvey(surveyData);

      if (instanceData.status !== 'pending') {
        const responsesResponse = await apiClient.get(`/surveys/instances/${instanceId}/responses`);
        setResponses(responsesResponse.data.data || {});
      }

      if (instanceData.status === 'pending') {
        await apiClient.patch(`/surveys/instances/${instanceId}`, {
          status: 'in_progress',
          started_at: new Date().toISOString(),
        });
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      await apiClient.post(`/surveys/instances/${instanceId}/responses`, {
        responses: data,
      });

      await apiClient.patch(`/surveys/instances/${instanceId}`, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit survey');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (survey?.is_mandatory) {
      if (confirm('This is a mandatory survey. Are you sure you want to cancel?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  if (loading && !survey) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading survey...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!survey || !instance) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Survey not found</Alert>
      </Box>
    );
  }

  const formSchema = {
    title: survey.name,
    description: survey.description,
    fields: survey.questions || [],
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{survey.name}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {survey.is_mandatory && (
          <Chip label="Mandatory" color="error" size="small" />
        )}
        <Chip
          label={survey.scope === 'brand-specific' ? 'Brand-Specific' : 'Combined'}
          size="small"
        />
        {instance.status === 'completed' && (
          <Chip
            icon={<CheckCircle />}
            label="Completed"
            color="success"
            size="small"
          />
        )}
      </Box>

      {instance.status === 'completed' ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Survey Completed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thank you for completing this survey
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(-1)}
                sx={{ mt: 3 }}
              >
                Back to Visit
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <DynamicForm
              schema={formSchema}
              onSubmit={handleSubmit}
              onCancel={survey.is_mandatory ? undefined : handleCancel}
              initialData={responses}
            />
          </CardContent>
        </Card>
      )}

      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}
