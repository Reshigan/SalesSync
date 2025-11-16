import apiClient from './api';

export interface Survey {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  target_type: 'business' | 'individual' | 'both';
  status: string;
  response_count: number;
}

export interface VisitSurvey {
  visit_survey_id: string;
  visit_id: string;
  survey_id: string;
  subject_type: 'business' | 'individual';
  subject_id: string | null;
  subject_name: string | null;
  required: boolean;
  status: 'assigned' | 'in_progress' | 'completed' | 'skipped';
  skip_reason: string | null;
  assigned_at: string;
  completed_at: string | null;
  survey_title: string;
  survey_description: string;
  survey_type: string;
  target_type: string;
}

export interface SurveyAssignment {
  survey_id: string;
  subject_type: 'business' | 'individual';
  subject_id: string | null;
  required: boolean;
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  is_required: boolean;
  sequence_order: number;
}

export interface SurveyAnswer {
  question_id: string;
  question_text: string;
  answer_value: any;
}

const visitSurveysService = {
  getAvailableSurveys: async (targetType?: 'business' | 'individual' | 'both', brandId?: string | null) => {
    const params: any = {};
    if (targetType) params.target_type = targetType;
    if (brandId) params.brand_id = brandId;
    const response = await apiClient.get('/visit-surveys/available', { params });
    return response.data;
  },

  assignSurveys: async (visitId: string, surveys: SurveyAssignment[]) => {
    const response = await apiClient.post('/visit-surveys/assign', {
      visit_id: visitId,
      surveys
    });
    return response.data;
  },

  getVisitSurveys: async (visitId: string) => {
    const response = await apiClient.get(`/visit-surveys/${visitId}`);
    return response.data;
  },

  updateSurveyStatus: async (
    visitSurveyId: string,
    status: 'assigned' | 'in_progress' | 'completed' | 'skipped',
    skipReason?: string
  ) => {
    const response = await apiClient.put(`/visit-surveys/${visitSurveyId}/status`, {
      status,
      skip_reason: skipReason
    });
    return response.data;
  },

  removeSurveyAssignment: async (visitSurveyId: string) => {
    const response = await apiClient.delete(`/visit-surveys/${visitSurveyId}`);
    return response.data;
  },

  getSurveyQuestions: async (visitSurveyId: string) => {
    const response = await apiClient.get(`/visit-surveys/${visitSurveyId}/questions`);
    return response.data;
  },

  submitSurveyResponses: async (visitSurveyId: string, answers: SurveyAnswer[]) => {
    const response = await apiClient.post(`/visit-surveys/${visitSurveyId}/responses`, {
      answers
    });
    return response.data;
  },

  getSurveyResponses: async (visitSurveyId: string) => {
    const response = await apiClient.get(`/visit-surveys/${visitSurveyId}/responses`);
    return response.data;
  }
};

export default visitSurveysService;
