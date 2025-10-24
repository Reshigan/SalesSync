import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, IconButton, Button
} from '@mui/material';
import {
  Assignment, BarChart, People, TrendingUp,
  Visibility, Edit, Add
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:12001';

export default function DataCollectionDashboard() {
  const [tab, setTab] = useState(0);
  const [surveys, setSurveys] = useState([]);
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [surveyRes, responseRes] = await Promise.all([
        axios.get(`${API_URL}/api/surveys`).catch(() => ({ data: { surveys: [] } })),
        axios.get(`${API_URL}/api/surveys/responses`).catch(() => ({ data: { responses: [] } }))
      ]);
      
      setSurveys(surveyRes.data.surveys || []);
      setResponses(responseRes.data.responses || []);
      setAnalytics({
        total_surveys: surveyRes.data.surveys?.length || 0,
        total_responses: responseRes.data.responses?.length || 0,
        completion_rate: 78,
        avg_time: 5.2
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Data Collection Dashboard</Typography>
        <Button variant="contained" startIcon={<Add />}>New Survey</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_surveys}</Typography>
                  <Typography color="textSecondary">Total Surveys</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.total_responses}</Typography>
                  <Typography color="textSecondary">Responses</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.completion_rate}%</Typography>
                  <Typography color="textSecondary">Completion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BarChart color="warning" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.avg_time} min</Typography>
                  <Typography color="textSecondary">Avg Time</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Surveys" />
          <Tab label="Responses" />
          <Tab label="Analytics" />
        </Tabs>
        <CardContent>
          {loading ? <LinearProgress /> : (
            <>
              {tab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Survey</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Responses</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {surveys.map((survey) => (
                        <TableRow key={survey.id}>
                          <TableCell>{survey.title || `Survey #${survey.id}`}</TableCell>
                          <TableCell>{survey.type || 'General'}</TableCell>
                          <TableCell>
                            <Chip label={survey.status || 'active'} color="primary" size="small" />
                          </TableCell>
                          <TableCell>{survey.response_count || 0}</TableCell>
                          <TableCell>
                            {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                            <IconButton size="small"><Edit fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Response ID</TableCell>
                        <TableCell>Survey</TableCell>
                        <TableCell>Respondent</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {responses.map((resp) => (
                        <TableRow key={resp.id}>
                          <TableCell>#{resp.id}</TableCell>
                          <TableCell>Survey {resp.survey_id}</TableCell>
                          <TableCell>{resp.respondent || 'Anonymous'}</TableCell>
                          <TableCell>
                            {resp.created_at ? new Date(resp.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip label={resp.status || 'completed'} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {tab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Response Metrics</Typography>
                        <Typography>Total Responses: {analytics.total_responses}</Typography>
                        <Typography>Completion Rate: {analytics.completion_rate}%</Typography>
                        <Typography>Avg Time: {analytics.avg_time} minutes</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Survey Performance</Typography>
                        <Typography>Active Surveys: {surveys.filter(s => s.status === 'active').length}</Typography>
                        <Typography>Draft: {surveys.filter(s => s.status === 'draft').length}</Typography>
                        <Typography>Completed: {surveys.filter(s => s.status === 'completed').length}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
