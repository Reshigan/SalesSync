import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Checkbox, FormControlLabel, Button, Chip, Alert } from '@mui/material';
import visitSurveysService, { Survey, SurveyAssignment } from '../../services/visitSurveys.service';
import individualsService, { Individual } from '../../services/individuals.service';

interface SurveyAssignmentStepProps {
  customerId: string;
  onAssignmentsChange: (assignments: SurveyAssignment[]) => void;
  initialAssignments?: SurveyAssignment[];
}

export default function SurveyAssignmentStep({
  customerId,
  onAssignmentsChange,
  initialAssignments = []
}: SurveyAssignmentStepProps) {
  const [businessSurveys, setBusinessSurveys] = useState<Survey[]>([]);
  const [individualSurveys, setIndividualSurveys] = useState<Survey[]>([]);
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [selectedBusinessSurveys, setSelectedBusinessSurveys] = useState<Set<string>>(new Set());
  const [requiredBusinessSurveys, setRequiredBusinessSurveys] = useState<Set<string>>(new Set());
  const [selectedIndividualSurveys, setSelectedIndividualSurveys] = useState<Map<string, Set<string>>>(new Map());
  const [requiredIndividualSurveys, setRequiredIndividualSurveys] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateAssignments();
  }, [selectedBusinessSurveys, requiredBusinessSurveys, selectedIndividualSurveys, requiredIndividualSurveys]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [businessRes, individualRes, individualsRes] = await Promise.all([
        visitSurveysService.getAvailableSurveys('business'),
        visitSurveysService.getAvailableSurveys('individual'),
        individualsService.getAll({ limit: 100 })
      ]);

      setBusinessSurveys(businessRes.data?.surveys || []);
      setIndividualSurveys(individualRes.data?.surveys || []);
      setIndividuals(individualsRes.data?.individuals || []);

      if (initialAssignments.length > 0) {
        const businessSelected = new Set<string>();
        const businessRequired = new Set<string>();
        const individualSelected = new Map<string, Set<string>>();
        const individualRequired = new Map<string, Set<string>>();

        initialAssignments.forEach(assignment => {
          if (assignment.subject_type === 'business') {
            businessSelected.add(assignment.survey_id);
            if (assignment.required) {
              businessRequired.add(assignment.survey_id);
            }
          } else if (assignment.subject_type === 'individual' && assignment.subject_id) {
            if (!individualSelected.has(assignment.subject_id)) {
              individualSelected.set(assignment.subject_id, new Set());
            }
            individualSelected.get(assignment.subject_id)!.add(assignment.survey_id);

            if (assignment.required) {
              if (!individualRequired.has(assignment.subject_id)) {
                individualRequired.set(assignment.subject_id, new Set());
              }
              individualRequired.get(assignment.subject_id)!.add(assignment.survey_id);
            }
          }
        });

        setSelectedBusinessSurveys(businessSelected);
        setRequiredBusinessSurveys(businessRequired);
        setSelectedIndividualSurveys(individualSelected);
        setRequiredIndividualSurveys(individualRequired);
      }
    } catch (err: any) {
      console.error('Failed to load survey data:', err);
      setError(err.message || 'Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const updateAssignments = () => {
    const assignments: SurveyAssignment[] = [];

    selectedBusinessSurveys.forEach(surveyId => {
      assignments.push({
        survey_id: surveyId,
        subject_type: 'business',
        subject_id: customerId,
        required: requiredBusinessSurveys.has(surveyId)
      });
    });

    selectedIndividualSurveys.forEach((surveyIds, individualId) => {
      surveyIds.forEach(surveyId => {
        assignments.push({
          survey_id: surveyId,
          subject_type: 'individual',
          subject_id: individualId,
          required: requiredIndividualSurveys.get(individualId)?.has(surveyId) || false
        });
      });
    });

    onAssignmentsChange(assignments);
  };

  const toggleBusinessSurvey = (surveyId: string) => {
    const newSelected = new Set(selectedBusinessSurveys);
    if (newSelected.has(surveyId)) {
      newSelected.delete(surveyId);
      const newRequired = new Set(requiredBusinessSurveys);
      newRequired.delete(surveyId);
      setRequiredBusinessSurveys(newRequired);
    } else {
      newSelected.add(surveyId);
    }
    setSelectedBusinessSurveys(newSelected);
  };

  const toggleBusinessRequired = (surveyId: string) => {
    const newRequired = new Set(requiredBusinessSurveys);
    if (newRequired.has(surveyId)) {
      newRequired.delete(surveyId);
    } else {
      newRequired.add(surveyId);
    }
    setRequiredBusinessSurveys(newRequired);
  };

  const toggleIndividualSurvey = (individualId: string, surveyId: string) => {
    const newSelected = new Map(selectedIndividualSurveys);
    if (!newSelected.has(individualId)) {
      newSelected.set(individualId, new Set());
    }
    const surveys = newSelected.get(individualId)!;
    if (surveys.has(surveyId)) {
      surveys.delete(surveyId);
      const newRequired = new Map(requiredIndividualSurveys);
      if (newRequired.has(individualId)) {
        newRequired.get(individualId)!.delete(surveyId);
      }
      setRequiredIndividualSurveys(newRequired);
    } else {
      surveys.add(surveyId);
    }
    setSelectedIndividualSurveys(newSelected);
  };

  const toggleIndividualRequired = (individualId: string, surveyId: string) => {
    const newRequired = new Map(requiredIndividualSurveys);
    if (!newRequired.has(individualId)) {
      newRequired.set(individualId, new Set());
    }
    const surveys = newRequired.get(individualId)!;
    if (surveys.has(surveyId)) {
      surveys.delete(surveyId);
    } else {
      surveys.add(surveyId);
    }
    setRequiredIndividualSurveys(newRequired);
  };

  if (loading) {
    return <Typography>Loading surveys...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Assign Surveys to Visit
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select surveys to assign to this visit. You can assign different surveys to the business (spaza shop) and to individuals (shop owner, staff, etc.).
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Business Surveys (Spaza Shop)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Surveys for the business/shop itself
            </Typography>

            {businessSurveys.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No business surveys available
              </Typography>
            ) : (
              <Box>
                {businessSurveys.map(survey => (
                  <Box key={survey.id} sx={{ mb: 2, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedBusinessSurveys.has(survey.id)}
                          onChange={() => toggleBusinessSurvey(survey.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {survey.title}
                          </Typography>
                          {survey.description && (
                            <Typography variant="body2" color="text.secondary">
                              {survey.description}
                            </Typography>
                          )}
                          <Box sx={{ mt: 0.5 }}>
                            <Chip label={survey.type} size="small" sx={{ mr: 0.5 }} />
                            <Chip label={survey.category} size="small" />
                          </Box>
                        </Box>
                      }
                    />
                    {selectedBusinessSurveys.has(survey.id) && (
                      <FormControlLabel
                        sx={{ ml: 4 }}
                        control={
                          <Checkbox
                            checked={requiredBusinessSurveys.has(survey.id)}
                            onChange={() => toggleBusinessRequired(survey.id)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">Required (must complete before visit ends)</Typography>}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Individual Surveys (People)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Surveys for individuals at the business (owner, staff, etc.)
            </Typography>

            {individuals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No individuals available. Create individuals first to assign surveys to them.
              </Typography>
            ) : (
              <Box>
                {individuals.map(individual => (
                  <Box key={individual.id} sx={{ mb: 3, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      {individual.name}
                    </Typography>
                    {individual.phone && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {individual.phone}
                      </Typography>
                    )}

                    {individualSurveys.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No individual surveys available
                      </Typography>
                    ) : (
                      <Box sx={{ mt: 1 }}>
                        {individualSurveys.map(survey => (
                          <Box key={survey.id} sx={{ mb: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedIndividualSurveys.get(individual.id)?.has(survey.id) || false}
                                  onChange={() => toggleIndividualSurvey(individual.id, survey.id)}
                                  size="small"
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {survey.title}
                                </Typography>
                              }
                            />
                            {selectedIndividualSurveys.get(individual.id)?.has(survey.id) && (
                              <FormControlLabel
                                sx={{ ml: 4 }}
                                control={
                                  <Checkbox
                                    checked={requiredIndividualSurveys.get(individual.id)?.has(survey.id) || false}
                                    onChange={() => toggleIndividualRequired(individual.id, survey.id)}
                                    size="small"
                                  />
                                }
                                label={<Typography variant="caption">Required</Typography>}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Summary:</strong> {selectedBusinessSurveys.size} business survey(s) and{' '}
            {Array.from(selectedIndividualSurveys.values()).reduce((sum, set) => sum + set.size, 0)} individual survey(s) selected
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}
