import { apiClient } from '@/lib/api-client'

export interface Campaign {
  id?: string
  name: string
  description?: string
  type: 'discount' | 'bundle' | 'free_gift' | 'cashback' | 'points' | 'other'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budget?: number
  targetCustomerType?: 'retail' | 'wholesale' | 'all'
  targetRegions?: string[]
  products: Array<{
    productId: string
    discountType?: 'percentage' | 'fixed'
    discountValue?: number
    minQuantity?: number
  }>
  redemptionCount?: number
  totalValue?: number
  createdAt?: string
}

export interface Activity {
  id?: string
  campaignId: string
  campaignName?: string
  activityType: 'activation' | 'sampling' | 'demo' | 'event' | 'other'
  name: string
  description?: string
  location: string
  customerId?: string
  customerName?: string
  scheduledDate: string
  duration?: number
  agentId: string
  agentName?: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  attendees?: number
  samplesDistributed?: number
  photos?: string[]
  notes?: string
  createdAt?: string
}

export interface Material {
  id?: string
  name: string
  type: 'poster' | 'banner' | 'standee' | 'brochure' | 'sample' | 'gift' | 'other'
  campaignId?: string
  campaignName?: string
  quantity: number
  unitCost?: number
  supplier?: string
  imageUrl?: string
  description?: string
  status: 'available' | 'allocated' | 'depleted'
  createdAt?: string
}

export interface Survey {
  id?: string
  title: string
  description?: string
  type: 'promotion' | 'customer_satisfaction' | 'product_feedback' | 'market_research'
  status: 'draft' | 'active' | 'closed'
  targetAudience?: string
  questions: Array<{
    id: string
    question: string
    type: 'text' | 'multiple_choice' | 'rating' | 'yes_no'
    options?: string[]
    required: boolean
  }>
  responseCount?: number
  startDate: string
  endDate?: string
  createdAt?: string
}

export interface SurveyResponse {
  id?: string
  surveyId: string
  respondentId?: string
  respondentName?: string
  customerId?: string
  customerName?: string
  responses: Array<{
    questionId: string
    answer: string | number | boolean
  }>
  submittedAt: string
}

class PromotionsService {
  private baseUrl = '/promotions'

  // Campaigns
  async getCampaigns(filters?: any) {
    return apiClient.get<{ campaigns: Campaign[]; total: number }>(`${this.baseUrl}/campaigns`, { params: filters })
  }

  async getCampaignById(id: string) {
    return apiClient.get<Campaign>(`${this.baseUrl}/campaigns/${id}`)
  }

  async createCampaign(campaign: Campaign) {
    return apiClient.post<Campaign>(`${this.baseUrl}/campaigns`, campaign)
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>) {
    return apiClient.put<Campaign>(`${this.baseUrl}/campaigns/${id}`, campaign)
  }

  async deleteCampaign(id: string) {
    return apiClient.delete(`${this.baseUrl}/campaigns/${id}`)
  }

  async updateCampaignStatus(id: string, status: Campaign['status']) {
    return apiClient.patch<Campaign>(`${this.baseUrl}/campaigns/${id}/status`, { status })
  }

  // Activities
  async getActivities(filters?: any) {
    return apiClient.get<{ activities: Activity[]; total: number }>(`${this.baseUrl}/activities`, { params: filters })
  }

  async getActivityById(id: string) {
    return apiClient.get<Activity>(`${this.baseUrl}/activities/${id}`)
  }

  async createActivity(activity: Activity) {
    return apiClient.post<Activity>(`${this.baseUrl}/activities`, activity)
  }

  async updateActivity(id: string, activity: Partial<Activity>) {
    return apiClient.put<Activity>(`${this.baseUrl}/activities/${id}`, activity)
  }

  async deleteActivity(id: string) {
    return apiClient.delete(`${this.baseUrl}/activities/${id}`)
  }

  async uploadActivityPhoto(activityId: string, file: File) {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient.upload<{ photoUrl: string }>(`${this.baseUrl}/activities/${activityId}/photos`, formData)
  }

  // Materials
  async getMaterials(filters?: any) {
    return apiClient.get<{ materials: Material[]; total: number }>(`${this.baseUrl}/materials`, { params: filters })
  }

  async createMaterial(material: Material) {
    return apiClient.post<Material>(`${this.baseUrl}/materials`, material)
  }

  async updateMaterial(id: string, material: Partial<Material>) {
    return apiClient.put<Material>(`${this.baseUrl}/materials/${id}`, material)
  }

  async deleteMaterial(id: string) {
    return apiClient.delete(`${this.baseUrl}/materials/${id}`)
  }

  // Surveys
  async getSurveys(filters?: any) {
    return apiClient.get<{ surveys: Survey[]; total: number }>(`${this.baseUrl}/surveys`, { params: filters })
  }

  async getSurveyById(id: string) {
    return apiClient.get<Survey>(`${this.baseUrl}/surveys/${id}`)
  }

  async createSurvey(survey: Survey) {
    return apiClient.post<Survey>(`${this.baseUrl}/surveys`, survey)
  }

  async updateSurvey(id: string, survey: Partial<Survey>) {
    return apiClient.put<Survey>(`${this.baseUrl}/surveys/${id}`, survey)
  }

  async deleteSurvey(id: string) {
    return apiClient.delete(`${this.baseUrl}/surveys/${id}`)
  }

  async getSurveyResponses(surveyId: string, filters?: any) {
    return apiClient.get<{ responses: SurveyResponse[]; total: number }>(
      `${this.baseUrl}/surveys/${surveyId}/responses`,
      { params: filters }
    )
  }

  async submitSurveyResponse(surveyId: string, response: SurveyResponse) {
    return apiClient.post<SurveyResponse>(`${this.baseUrl}/surveys/${surveyId}/responses`, response)
  }
}

export const promotionsService = new PromotionsService()
