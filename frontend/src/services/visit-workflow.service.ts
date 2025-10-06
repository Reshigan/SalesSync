import { apiClient } from '@/lib/api-client'
import { settingsService } from './settings.service'

export interface CustomerLocation {
  customerId: string
  customerName: string
  lastVisitDate: string
  gpsLocation: {
    latitude: number
    longitude: number
  }
  completedSurveys: Array<{
    surveyId: string
    surveyTitle: string
    completedAt: string
    expiresAt?: string
  }>
}

export interface VisitInitiation {
  visitType: 'new_customer' | 'existing_customer'
  customerId?: string
  customerName?: string
  currentLocation: {
    latitude: number
    longitude: number
  }
  agentId: string
  agentType: string
  brandId?: string
}

export interface VisitValidation {
  isValid: boolean
  requiresNewVisit: boolean
  locationMatch: boolean
  distanceFromPrevious?: number
  pendingSurveys: Array<{
    surveyId: string
    surveyTitle: string
    isMandatory: boolean
    dueDate?: string
  }>
  completedSurveys: Array<{
    surveyId: string
    surveyTitle: string
    completedAt: string
  }>
  skipSurveys: boolean // If true, agent can skip surveys
  message: string
}

class VisitWorkflowService {
  private baseUrl = '/visits/workflow'

  /**
   * Step 1: Agent starts a visit - Check if customer exists and validate location
   */
  async initiateVisit(data: VisitInitiation): Promise<VisitValidation> {
    try {
      // If existing customer, validate location and survey status
      if (data.visitType === 'existing_customer' && data.customerId) {
        return await this.validateExistingCustomerVisit(data)
      }
      
      // New customer - will need to capture all details and complete mandatory surveys
      return {
        isValid: true,
        requiresNewVisit: true,
        locationMatch: false,
        pendingSurveys: await this.getApplicableSurveys(data.agentType, data.brandId),
        completedSurveys: [],
        skipSurveys: false,
        message: 'New customer visit - capture customer details and complete mandatory surveys'
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate visit')
    }
  }

  /**
   * Validate existing customer visit - Check GPS and survey completion
   */
  private async validateExistingCustomerVisit(data: VisitInitiation): Promise<VisitValidation> {
    try {
      // Get system settings
      const settings = await settingsService.getSettings()
      
      // Get customer's last visit location
      const customerLocation = await apiClient.get<CustomerLocation>(
        `/customers/${data.customerId}/last-location`
      )

      // Calculate distance from last visit
      const distance = settingsService.calculateDistance(
        data.currentLocation.latitude,
        data.currentLocation.longitude,
        customerLocation.gpsLocation.latitude,
        customerLocation.gpsLocation.longitude
      )

      const withinRadius = distance <= settings.gpsValidationRadius

      // Check which surveys are still valid
      const validSurveys = customerLocation.completedSurveys.filter(survey => {
        if (!survey.expiresAt) return true
        return new Date(survey.expiresAt) > new Date()
      })

      // Get pending surveys that need to be completed
      const allApplicableSurveys = await this.getApplicableSurveys(data.agentType, data.brandId)
      const completedSurveyIds = validSurveys.map(s => s.surveyId)
      const pendingSurveys = allApplicableSurveys.filter(
        s => !completedSurveyIds.includes(s.surveyId)
      )

      // Determine if surveys can be skipped
      const skipSurveys = settings.skipCompletedSurveys && withinRadius && pendingSurveys.length === 0

      let message = ''
      if (withinRadius) {
        if (skipSurveys) {
          message = `Location verified (${Math.round(distance)}m from last visit). All surveys completed.`
        } else if (pendingSurveys.length > 0) {
          const mandatoryCount = pendingSurveys.filter(s => s.isMandatory).length
          message = `Location verified. ${mandatoryCount} mandatory and ${pendingSurveys.length - mandatoryCount} optional surveys pending.`
        }
      } else {
        message = `Location mismatch (${Math.round(distance)}m from last visit, allowed ${settings.gpsValidationRadius}m). New surveys required.`
      }

      return {
        isValid: true,
        requiresNewVisit: !withinRadius || pendingSurveys.length > 0,
        locationMatch: withinRadius,
        distanceFromPrevious: Math.round(distance),
        pendingSurveys,
        completedSurveys: validSurveys,
        skipSurveys,
        message
      }
    } catch (error: any) {
      // If customer not found or error, treat as new customer
      return {
        isValid: true,
        requiresNewVisit: true,
        locationMatch: false,
        pendingSurveys: await this.getApplicableSurveys(data.agentType, data.brandId),
        completedSurveys: [],
        skipSurveys: false,
        message: 'Customer not found or error - treating as new customer visit'
      }
    }
  }

  /**
   * Get applicable surveys for agent type and brand
   */
  private async getApplicableSurveys(
    agentType: string,
    brandId?: string
  ): Promise<Array<{ surveyId: string; surveyTitle: string; isMandatory: boolean; dueDate?: string }>> {
    try {
      const response = await apiClient.get<{ surveys: any[] }>('/surveys/applicable', {
        params: { agentType, brandId, active: true }
      })

      return response.surveys.map(survey => ({
        surveyId: survey.id,
        surveyTitle: survey.title,
        isMandatory: survey.isMandatory,
        dueDate: survey.endDate
      }))
    } catch (error) {
      console.error('Error fetching applicable surveys:', error)
      return []
    }
  }

  /**
   * Create new customer with visit details
   */
  async createCustomerWithVisit(data: {
    customerDetails: any
    visitDetails: any
    gpsLocation: { latitude: number; longitude: number }
    agentId: string
  }) {
    return apiClient.post(`${this.baseUrl}/new-customer`, data)
  }

  /**
   * Start visit for existing customer
   */
  async startExistingCustomerVisit(data: {
    customerId: string
    visitDetails: any
    gpsLocation: { latitude: number; longitude: number }
    agentId: string
    skipSurveys: boolean
  }) {
    return apiClient.post(`${this.baseUrl}/existing-customer`, data)
  }

  /**
   * Submit survey during visit
   */
  async submitVisitSurvey(data: {
    visitId: string
    surveyId: string
    responses: any[]
  }) {
    return apiClient.post(`${this.baseUrl}/survey`, data)
  }

  /**
   * Complete visit
   */
  async completeVisit(visitId: string, data: {
    notes?: string
    photos?: string[]
    completedSurveyIds: string[]
  }) {
    return apiClient.post(`${this.baseUrl}/${visitId}/complete`, data)
  }
}

export const visitWorkflowService = new VisitWorkflowService()
