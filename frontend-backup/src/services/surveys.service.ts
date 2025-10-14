import { apiClient } from '@/lib/api-client'
import { Survey } from '@/components/surveys/SurveyForm'

export interface SurveyResponse {
  id?: string
  surveyId: string
  surveyTitle?: string
  respondentType: 'shop_owner' | 'consumer'
  respondentId?: string
  respondentName?: string
  agentId: string
  agentName?: string
  visitId?: string
  location?: string
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  responses: Array<{
    questionId: string
    question: string
    answer: any
  }>
  submittedAt: string
  createdAt?: string
}

export interface SurveyAnalytics {
  totalResponses: number
  byCategory: Record<string, number>
  byBrand: Record<string, number>
  byAgent: Record<string, number>
  byRespondentType: Record<string, number>
  questionAnalytics: Array<{
    questionId: string
    question: string
    type: string
    responses: any[]
    summary: any
  }>
}

class SurveysService {
  private baseUrl = '/surveys'

  // Survey Management
  async getSurveys(filters?: any) {
    return apiClient.get<{ surveys: Survey[]; total: number }>(this.baseUrl, { params: filters })
  }

  async getSurveyById(id: string) {
    return apiClient.get<Survey>(`${this.baseUrl}/${id}`)
  }

  async createSurvey(survey: Survey) {
    return apiClient.post<Survey>(this.baseUrl, survey)
  }

  async updateSurvey(id: string, survey: Partial<Survey>) {
    return apiClient.put<Survey>(`${this.baseUrl}/${id}`, survey)
  }

  async deleteSurvey(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async toggleSurveyStatus(id: string, active: boolean) {
    return apiClient.patch<Survey>(`${this.baseUrl}/${id}/status`, { active })
  }

  // Survey Responses
  async getResponses(filters?: any) {
    return apiClient.get<{ responses: SurveyResponse[]; total: number }>(`${this.baseUrl}/responses`, {
      params: filters
    })
  }

  async getResponseById(id: string) {
    return apiClient.get<SurveyResponse>(`${this.baseUrl}/responses/${id}`)
  }

  async submitResponse(response: SurveyResponse) {
    return apiClient.post<SurveyResponse>(`${this.baseUrl}/responses`, response)
  }

  async getSurveyResponses(surveyId: string, filters?: any) {
    return apiClient.get<{ responses: SurveyResponse[]; total: number }>(
      `${this.baseUrl}/${surveyId}/responses`,
      { params: filters }
    )
  }

  // Analytics
  async getSurveyAnalytics(surveyId: string) {
    return apiClient.get<SurveyAnalytics>(`${this.baseUrl}/${surveyId}/analytics`)
  }

  async getOverallAnalytics(filters?: any) {
    return apiClient.get<SurveyAnalytics>(`${this.baseUrl}/analytics`, { params: filters })
  }

  // Export
  async exportSurveyResponses(surveyId: string, format: 'csv' | 'excel' | 'pdf') {
    return apiClient.download(`${this.baseUrl}/${surveyId}/export`, { format })
  }
}

export const surveysService = new SurveysService()
