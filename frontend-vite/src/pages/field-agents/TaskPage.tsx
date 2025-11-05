/**
 * Task Page - Unified task handler for field agent visits
 * 
 * Handles three task types:
 * 1. Survey - Uses SurveyPage component
 * 2. Board Placement - Uses PolygonDrawer for coverage calculation
 * 3. Product Distribution - Uses DynamicForm for dynamic forms
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import { ArrowBack, CheckCircle, CameraAlt } from '@mui/icons-material';
import PolygonDrawer from '../../components/agent/PolygonDrawer';
import DynamicForm from '../../components/agent/DynamicForm';
import { apiClient } from '../../services/api';

interface VisitTask {
  id: string;
  visit_id: string;
  task_type: 'survey' | 'board' | 'distribution';
  task_ref_id: string;
  is_mandatory: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  sequence_order: number;
}

interface Survey {
  id: string;
  name: string;
  description: string;
  questions: any[];
}

interface Board {
  id: string;
  name: string;
  brand_id: string;
  dimensions_width: number;
  dimensions_height: number;
  commission_rate: number;
  min_coverage_percentage: number;
}

interface ProductType {
  id: string;
  name: string;
  form_schema: any;
  commission_rule: any;
}

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<VisitTask | null>(null);
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  
  const [board, setBoard] = useState<Board | null>(null);
  const [boardStep, setBoardStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [storefrontPolygon, setStorefrontPolygon] = useState<any[]>([]);
  const [boardPolygon, setBoardPolygon] = useState<any[]>([]);
  const [coveragePercentage, setCoveragePercentage] = useState<number | null>(null);
  
  const [productType, setProductType] = useState<ProductType | null>(null);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const taskResponse = await apiClient.get(`/field-operations/tasks/${taskId}`);
      const taskData = taskResponse.data.data;
      setTask(taskData);

      if (taskData.task_type === 'survey') {
        const surveyResponse = await apiClient.get(`/surveys/${taskData.task_ref_id}`);
        setSurvey(surveyResponse.data.data);
      } else if (taskData.task_type === 'board') {
        const boardResponse = await apiClient.get(`/boards/${taskData.task_ref_id}`);
        setBoard(boardResponse.data.data);
      } else if (taskData.task_type === 'distribution') {
        const productResponse = await apiClient.get(`/product-types/${taskData.task_ref_id}`);
        setProductType(productResponse.data.data);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      await apiClient.post(`/surveys/responses`, {
        task_id: taskId,
        visit_id: task?.visit_id,
        survey_id: survey?.id,
        responses: data,
      });

      await apiClient.patch(`/field-operations/tasks/${taskId}`, {
        status: 'completed',
      });

      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit survey');
      setLoading(false);
    }
  };

  const handlePhotoCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setPhotoUrl(dataUrl);
          setBoardStep(1);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleStorefrontComplete = (polygon: any[], area: number) => {
    setStorefrontPolygon(polygon);
    setBoardStep(2);
  };

  const handleBoardComplete = (polygon: any[], area: number) => {
    setBoardPolygon(polygon);
    
    const storefrontArea = calculatePolygonArea(storefrontPolygon);
    const boardArea = area;
    const coverage = (boardArea / storefrontArea) * 100;
    setCoveragePercentage(Math.round(coverage * 10) / 10);
    setBoardStep(3);
  };

  const calculatePolygonArea = (points: any[]): number => {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const handleBoardSubmit = async () => {
    if (!board || !photoUrl || !storefrontPolygon.length || !boardPolygon.length) {
      setError('Please complete all steps');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/field-operations/board-placements`, {
        task_id: taskId,
        visit_id: task?.visit_id,
        board_id: board.id,
        photo_url: photoUrl,
        storefront_polygon: storefrontPolygon,
        board_polygon: boardPolygon,
        coverage_percentage: coveragePercentage,
      });

      await apiClient.patch(`/field-operations/tasks/${taskId}`, {
        status: 'completed',
      });

      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit board placement');
      setLoading(false);
    }
  };

  const handleDistributionSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      await apiClient.post(`/field-operations/product-distributions`, {
        task_id: taskId,
        visit_id: task?.visit_id,
        product_type_id: productType?.id,
        form_data: data,
      });

      await apiClient.patch(`/field-operations/tasks/${taskId}`, {
        status: 'completed',
      });

      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit product distribution');
      setLoading(false);
    }
  };

  if (loading && !task) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading task...</Typography>
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

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Task not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">
            {task.task_type === 'survey' && 'Survey'}
            {task.task_type === 'board' && 'Board Placement'}
            {task.task_type === 'distribution' && 'Product Distribution'}
          </Typography>
        </Box>
        {task.is_mandatory && (
          <Chip label="Mandatory" color="error" size="small" />
        )}
      </Box>

      {/* Survey Task */}
      {task.task_type === 'survey' && survey && (
        <Card>
          <CardContent>
            <DynamicForm
              schema={{
                title: survey.name,
                description: survey.description,
                fields: survey.questions || [],
              }}
              onSubmit={handleSurveySubmit}
              onCancel={task.is_mandatory ? undefined : () => navigate(-1)}
            />
          </CardContent>
        </Card>
      )}

      {/* Board Placement Task */}
      {task.task_type === 'board' && board && (
        <Box>
          <Stepper activeStep={boardStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Capture Photo</StepLabel>
            </Step>
            <Step>
              <StepLabel>Draw Storefront</StepLabel>
            </Step>
            <Step>
              <StepLabel>Draw Board</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review & Submit</StepLabel>
            </Step>
          </Stepper>

          <Card>
            <CardContent>
              {boardStep === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {board.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Commission: R {board.commission_rate.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Minimum Coverage: {board.min_coverage_percentage}%
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CameraAlt />}
                    onClick={handlePhotoCapture}
                    size="large"
                  >
                    Capture Board Photo
                  </Button>
                </Box>
              )}

              {boardStep === 1 && photoUrl && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Draw Storefront Outline
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click on the image to draw the outline of the entire storefront
                  </Typography>
                  <PolygonDrawer
                    imageUrl={photoUrl}
                    onComplete={handleStorefrontComplete}
                    label="Storefront Outline"
                    color="#00ff00"
                  />
                </Box>
              )}

              {boardStep === 2 && photoUrl && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Draw Board Outline
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click on the image to draw the outline of the board
                  </Typography>
                  <PolygonDrawer
                    imageUrl={photoUrl}
                    onComplete={handleBoardComplete}
                    label="Board Outline"
                    color="#ff0000"
                  />
                </Box>
              )}

              {boardStep === 3 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Coverage Calculated
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ my: 2 }}>
                    {coveragePercentage}%
                  </Typography>
                  {coveragePercentage !== null && coveragePercentage < board.min_coverage_percentage && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Coverage is below minimum requirement of {board.min_coverage_percentage}%
                    </Alert>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Commission: R {board.commission_rate.toFixed(2)}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleBoardSubmit}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Submitting...' : 'Submit Board Placement'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Product Distribution Task */}
      {task.task_type === 'distribution' && productType && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {productType.name}
            </Typography>
            <DynamicForm
              schema={productType.form_schema}
              onSubmit={handleDistributionSubmit}
              onCancel={task.is_mandatory ? undefined : () => navigate(-1)}
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
