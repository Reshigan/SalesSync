import { apiClient } from '../lib/api-client'

export interface SurveyTemplate {
  id: string
  name: string
  description?: string
  type: 'MANDATORY' | 'ADHOC' | 'BRAND_SPECIFIC'
  brandId?: string
  brandName?: string
  category: string
  isActive: boolean
  version: number
  questions: SurveyQuestion[]
  conditionalLogic: ConditionalLogic[]
  estimatedDuration: number // in minutes
  requiredPhotos: number
  validFrom: string
  validTo?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface SurveyQuestion {
  id: string
  templateId: string
  questionText: string
  questionType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING' | 'PHOTO' | 'DATE' | 'TIME'
  isRequired: boolean
  order: number
  options?: string[]
  validation?: QuestionValidation
  helpText?: string
  placeholder?: string
  conditional?: QuestionConditional
  photoRequirements?: PhotoRequirements
  ratingScale?: RatingScale
}

export interface QuestionValidation {
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
  customValidation?: string
  errorMessage?: string
}

export interface QuestionConditional {
  dependsOnQuestionId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface PhotoRequirements {
  minPhotos: number
  maxPhotos: number
  requiredAngles?: string[]
  qualityRequirements?: {
    minResolution?: string
    maxFileSize?: number
    allowedFormats?: string[]
  }
  geotagRequired?: boolean
  timestampRequired?: boolean
}

export interface RatingScale {
  minValue: number
  maxValue: number
  step: number
  labels?: {
    min: string
    max: string
    middle?: string
  }
}

export interface ConditionalLogic {
  id: string
  templateId: string
  name: string
  conditions: LogicCondition[]
  actions: LogicAction[]
  isActive: boolean
}

export interface LogicCondition {
  questionId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface LogicAction {
  type: 'SHOW_QUESTION' | 'HIDE_QUESTION' | 'REQUIRE_QUESTION' | 'SKIP_SECTION' | 'END_SURVEY'
  targetQuestionId?: string
  targetSectionId?: string
  message?: string
}

export interface Survey {
  id: string
  templateId: string
  visitId?: string
  customerId: string
  agentId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED'
  startedAt?: string
  completedAt?: string
  duration?: number // in seconds
  responses: SurveyResponse[]
  progress: number // percentage
  currentQuestionId?: string
  metadata?: Record<string, any>
  notes?: string
  createdAt: string
  updatedAt: string
  
  // Relationships
  template?: SurveyTemplate
  customer?: {
    id: string
    name: string
    address: string
  }
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  visit?: {
    id: string
    scheduledDate: string
    purpose: string
  }
}

export interface SurveyResponse {
  id: string
  surveyId: string
  questionId: string
  questionText: string
  questionType: string
  response: any
  photoUrls?: string[]
  notes?: string
  responseTime?: number // in seconds
  gpsLocation?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  timestamp: string
  isSkipped: boolean
  skipReason?: string
}

export interface SurveySearchParams {
  agentId?: string
  customerId?: string
  templateId?: string
  visitId?: string
  status?: string
  type?: string
  brandId?: string
  dateFrom?: string
  dateTo?: string
  completedOnly?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SurveyTemplateCreateRequest {
  name: string
  description?: string
  type: 'MANDATORY' | 'ADHOC' | 'BRAND_SPECIFIC'
  brandId?: string
  category: string
  questions: Omit<SurveyQuestion, 'id' | 'templateId'>[]
  conditionalLogic?: Omit<ConditionalLogic, 'id' | 'templateId'>[]
  estimatedDuration: number
  validFrom: string
  validTo?: string
}

export interface SurveyTemplateUpdateRequest extends Partial<SurveyTemplateCreateRequest> {
  isActive?: boolean
  version?: number
}

export interface SurveyCreateRequest {
  templateId: string
  visitId?: string
  customerId: string
  metadata?: Record<string, any>
  notes?: string
}

export interface SurveyResponseRequest {
  questionId: string
  response: any
  photoUrls?: string[]
  notes?: string
  gpsLocation?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  responseTime?: number
}

class SurveyService {
  private baseUrl = '/surveys'

  // Survey templates management
  async getSurveyTemplates(params?: {
    type?: string
    brandId?: string
    category?: string
    isActive?: boolean
    page?: number
    limit?: number
  }): Promise<{ templates: SurveyTemplate[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.type) queryParams.append('type', params.type)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString() ? `${this.baseUrl}/templates?${queryParams.toString()}` : `${this.baseUrl}/templates`
    return await apiClient.get<{ templates: SurveyTemplate[]; total: number; page: number; limit: number }>(url)
  }

  async getSurveyTemplate(id: string): Promise<SurveyTemplate> {
    return await apiClient.get<SurveyTemplate>(`${this.baseUrl}/templates/${id}`)
  }

  async createSurveyTemplate(data: SurveyTemplateCreateRequest): Promise<SurveyTemplate> {
    return await apiClient.post<SurveyTemplate>(`${this.baseUrl}/templates`, data)
  }

  async updateSurveyTemplate(id: string, data: SurveyTemplateUpdateRequest): Promise<SurveyTemplate> {
    return await apiClient.put<SurveyTemplate>(`${this.baseUrl}/templates/${id}`, data)
  }

  async deleteSurveyTemplate(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/templates/${id}`)
  }

  async cloneSurveyTemplate(id: string, name: string): Promise<SurveyTemplate> {
    return await apiClient.post<SurveyTemplate>(`${this.baseUrl}/templates/${id}/clone`, { name })
  }

  // Survey template questions
  async addQuestionToTemplate(templateId: string, question: Omit<SurveyQuestion, 'id' | 'templateId'>): Promise<SurveyQuestion> {
    return await apiClient.post<SurveyQuestion>(`${this.baseUrl}/templates/${templateId}/questions`, question)
  }

  async updateTemplateQuestion(templateId: string, questionId: string, data: Partial<Omit<SurveyQuestion, 'id' | 'templateId'>>): Promise<SurveyQuestion> {
    return await apiClient.put<SurveyQuestion>(`${this.baseUrl}/templates/${templateId}/questions/${questionId}`, data)
  }

  async deleteTemplateQuestion(templateId: string, questionId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/templates/${templateId}/questions/${questionId}`)
  }

  async reorderTemplateQuestions(templateId: string, questionOrders: Array<{ questionId: string; order: number }>): Promise<SurveyTemplate> {
    return await apiClient.put<SurveyTemplate>(`${this.baseUrl}/templates/${templateId}/questions/reorder`, {
      questionOrders
    })
  }

  // Survey instances
  async getSurveys(params?: SurveySearchParams): Promise<{ surveys: Survey[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.templateId) queryParams.append('templateId', params.templateId)
    if (params?.visitId) queryParams.append('visitId', params.visitId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.completedOnly) queryParams.append('completedOnly', params.completedOnly.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl
    return await apiClient.get<{ surveys: Survey[]; total: number; page: number; limit: number }>(url)
  }

  async getSurvey(id: string): Promise<Survey> {
    return await apiClient.get<Survey>(`${this.baseUrl}/${id}`)
  }

  async createSurvey(data: SurveyCreateRequest): Promise<Survey> {
    return await apiClient.post<Survey>(this.baseUrl, data)
  }

  async deleteSurvey(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Survey workflow
  async startSurvey(id: string, gpsLocation?: { latitude: number; longitude: number; accuracy: number }): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${id}/start`, { gpsLocation })
  }

  async pauseSurvey(id: string): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${id}/pause`)
  }

  async resumeSurvey(id: string): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${id}/resume`)
  }

  async completeSurvey(id: string, gpsLocation?: { latitude: number; longitude: number; accuracy: number }): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${id}/complete`, { gpsLocation })
  }

  async skipSurvey(id: string, reason: string): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${id}/skip`, { reason })
  }

  async cancelSurvey(id: string, reason: string): Promise<Survey> {
    return await apiClient.post<Survey>(`${this.baseUrl}/${id}/cancel`, { reason })
  }

  // Survey responses
  async submitResponse(surveyId: string, response: SurveyResponseRequest): Promise<SurveyResponse> {
    return await apiClient.post<SurveyResponse>(`${this.baseUrl}/${surveyId}/responses`, response)
  }

  async updateResponse(surveyId: string, responseId: string, data: Partial<SurveyResponseRequest>): Promise<SurveyResponse> {
    return await apiClient.put<SurveyResponse>(`${this.baseUrl}/${surveyId}/responses/${responseId}`, data)
  }

  async deleteResponse(surveyId: string, responseId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${surveyId}/responses/${responseId}`)
  }

  async skipQuestion(surveyId: string, questionId: string, reason: string): Promise<SurveyResponse> {
    return await apiClient.post<SurveyResponse>(`${this.baseUrl}/${surveyId}/responses/skip`, {
      questionId,
      reason
    })
  }

  // Photo upload for survey responses
  async uploadSurveyPhoto(surveyId: string, questionId: string, file: File, metadata?: Record<string, any>): Promise<{ photoUrl: string }> {
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('questionId', questionId)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }
    
    return await apiClient.upload<{ photoUrl: string }>(`${this.baseUrl}/${surveyId}/photos`, formData)
  }

  async deleteSurveyPhoto(surveyId: string, photoUrl: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${surveyId}/photos`, {
      data: { photoUrl }
    })
  }

  // Survey navigation
  async getNextQuestion(surveyId: string, currentQuestionId?: string): Promise<{
    question: SurveyQuestion | null
    isLastQuestion: boolean
    progress: number
    conditionalLogicApplied?: string[]
  }> {
    const params = currentQuestionId ? `?currentQuestionId=${currentQuestionId}` : ''
    return await apiClient.get<{
      question: SurveyQuestion | null
      isLastQuestion: boolean
      progress: number
      conditionalLogicApplied?: string[]
    }>(`${this.baseUrl}/${surveyId}/next-question${params}`)
  }

  async getPreviousQuestion(surveyId: string, currentQuestionId: string): Promise<{
    question: SurveyQuestion | null
    isFirstQuestion: boolean
    progress: number
  }> {
    return await apiClient.get<{
      question: SurveyQuestion | null
      isFirstQuestion: boolean
      progress: number
    }>(`${this.baseUrl}/${surveyId}/previous-question?currentQuestionId=${currentQuestionId}`)
  }

  async jumpToQuestion(surveyId: string, questionId: string): Promise<{
    question: SurveyQuestion
    progress: number
    allowedNavigation: boolean
  }> {
    return await apiClient.post<{
      question: SurveyQuestion
      progress: number
      allowedNavigation: boolean
    }>(`${this.baseUrl}/${surveyId}/jump-to-question`, { questionId })
  }

  // Survey validation
  async validateSurveyResponse(surveyId: string, questionId: string, response: any): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    return await apiClient.post<{
      isValid: boolean
      errors: string[]
      warnings: string[]
    }>(`${this.baseUrl}/${surveyId}/validate-response`, {
      questionId,
      response
    })
  }

  async validateSurveyCompletion(surveyId: string): Promise<{
    isComplete: boolean
    missingRequiredQuestions: string[]
    validationErrors: Array<{
      questionId: string
      questionText: string
      errors: string[]
    }>
  }> {
    return await apiClient.get<{
      isComplete: boolean
      missingRequiredQuestions: string[]
      validationErrors: Array<{
        questionId: string
        questionText: string
        errors: string[]
      }>
    }>(`${this.baseUrl}/${surveyId}/validate-completion`)
  }

  // Survey analytics
  async getSurveyStats(params?: {
    templateId?: string
    agentId?: string
    brandId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    totalSurveys: number
    completedSurveys: number
    skippedSurveys: number
    cancelledSurveys: number
    averageCompletionTime: number
    completionRate: number
    skipRate: number
    averageResponsesPerSurvey: number
    topSkippedQuestions: Array<{
      questionId: string
      questionText: string
      skipCount: number
      skipRate: number
    }>
    surveysByTemplate: Array<{
      templateId: string
      templateName: string
      count: number
      completionRate: number
    }>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.templateId) queryParams.append('templateId', params.templateId)
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.brandId) queryParams.append('brandId', params.brandId)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/stats?${queryParams.toString()}`
      : `${this.baseUrl}/stats`
    
    return await apiClient.get(url)
  }

  async getAgentSurveyPerformance(agentId: string, period?: string): Promise<{
    totalSurveys: number
    completedSurveys: number
    completionRate: number
    averageCompletionTime: number
    totalResponseTime: number
    surveysPerDay: number
    topPerformingTemplates: Array<{
      templateId: string
      templateName: string
      count: number
      completionRate: number
      averageTime: number
    }>
    recentSurveys: Survey[]
  }> {
    const url = period 
      ? `${this.baseUrl}/agent/${agentId}/performance?period=${period}`
      : `${this.baseUrl}/agent/${agentId}/performance`
    
    return await apiClient.get(url)
  }

  // Survey recommendations
  async getRecommendedSurveys(params: {
    customerId: string
    visitId?: string
    brandIds?: string[]
    customerType?: string
    lastVisitDate?: string
  }): Promise<Array<{
    template: SurveyTemplate
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    reason: string
    estimatedDuration: number
    isRequired: boolean
  }>> {
    return await apiClient.post<Array<{
      template: SurveyTemplate
      priority: 'HIGH' | 'MEDIUM' | 'LOW'
      reason: string
      estimatedDuration: number
      isRequired: boolean
    }>>(`${this.baseUrl}/recommendations`, params)
  }

  // Bulk operations
  async bulkCreateSurveys(surveys: SurveyCreateRequest[]): Promise<{ created: number; errors: any[] }> {
    return await apiClient.post<{ created: number; errors: any[] }>(`${this.baseUrl}/bulk-create`, {
      surveys
    })
  }

  async bulkUpdateSurveys(surveyIds: string[], updates: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED'
    notes?: string
  }): Promise<{ updated: number; errors: any[] }> {
    return await apiClient.post<{ updated: number; errors: any[] }>(`${this.baseUrl}/bulk-update`, {
      surveyIds,
      updates
    })
  }

  // Offline sync support
  async getSurveysForOfflineSync(agentId: string, lastSyncDate?: string): Promise<{
    surveys: Survey[]
    templates: SurveyTemplate[]
    syncToken: string
  }> {
    const params = lastSyncDate ? `?lastSyncDate=${lastSyncDate}` : ''
    return await apiClient.get<{
      surveys: Survey[]
      templates: SurveyTemplate[]
      syncToken: string
    }>(`${this.baseUrl}/offline-sync/${agentId}${params}`)
  }

  async syncOfflineSurveys(agentId: string, data: {
    surveys: Survey[]
    responses: SurveyResponse[]
    syncToken: string
  }): Promise<{
    syncedSurveys: number
    syncedResponses: number
    conflicts: Array<{
      surveyId: string
      conflictType: string
      resolution: string
    }>
    newSyncToken: string
  }> {
    return await apiClient.post<{
      syncedSurveys: number
      syncedResponses: number
      conflicts: Array<{
        surveyId: string
        conflictType: string
        resolution: string
      }>
      newSyncToken: string
    }>(`${this.baseUrl}/offline-sync/${agentId}`, data)
  }

  // Export and reporting
  async exportSurveys(params?: SurveySearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.templateId) queryParams.append('templateId', params.templateId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/export?${queryParams.toString()}`
      : `${this.baseUrl}/export`
    
    return await apiClient.download(url)
  }

  async exportSurveyResponses(surveyId: string, format: 'CSV' | 'EXCEL' | 'PDF' = 'CSV'): Promise<Blob> {
    return await apiClient.download(`${this.baseUrl}/${surveyId}/export?format=${format}`)
  }

  // Survey template preview
  async previewSurveyTemplate(templateId: string): Promise<{
    template: SurveyTemplate
    sampleQuestions: SurveyQuestion[]
    estimatedFlow: Array<{
      questionId: string
      questionText: string
      conditionalLogic?: string[]
    }>
  }> {
    return await apiClient.get<{
      template: SurveyTemplate
      sampleQuestions: SurveyQuestion[]
      estimatedFlow: Array<{
        questionId: string
        questionText: string
        conditionalLogic?: string[]
      }>
    }>(`${this.baseUrl}/templates/${templateId}/preview`)
  }
}

const surveyService = new SurveyService()
export default surveyService