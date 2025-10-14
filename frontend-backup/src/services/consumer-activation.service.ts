import { apiClient } from '@/lib/api-client'

export interface KYCLite {
  fullName: string
  idType: 'national_id' | 'passport' | 'drivers_license' | 'voter_id' | 'other'
  idNumber: string
  phoneNumber: string
  alternatePhone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  city?: string
  region?: string
  occupation?: string
  photoIdFront?: string
  photoIdBack?: string
  photoSelfie?: string
}

export interface ConsumerActivation {
  id?: string
  agentId: string
  agentName?: string
  brandId: string
  brandName?: string
  visitId?: string
  customerId?: string
  customerName?: string
  activationType: 'sim_distribution' | 'voucher_distribution' | 'survey' | 'registration'
  activationDate: string
  location: string
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  kyc: KYCLite
  simCard?: {
    simNumber: string
    mobileNumber: string
    carrier: string
  }
  voucher?: {
    voucherCode: string
    type: string
    value: number
  }
  surveyResponses?: Array<{
    questionId: string
    question: string
    answer: string | number | boolean
  }>
  consumerConsent: boolean
  marketingConsent: boolean
  notes?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  createdAt?: string
}

export interface ActivationStats {
  totalActivations: number
  simDistributions: number
  voucherDistributions: number
  completedKYCs: number
  byBrand: Record<string, number>
  byAgent: Record<string, number>
  byRegion: Record<string, number>
}

class ConsumerActivationService {
  private baseUrl = '/consumer-activations'

  async getActivations(filters?: any) {
    return apiClient.get<{ activations: ConsumerActivation[]; total: number }>(this.baseUrl, { params: filters })
  }

  async getActivationById(id: string) {
    return apiClient.get<ConsumerActivation>(`${this.baseUrl}/${id}`)
  }

  async createActivation(activation: ConsumerActivation) {
    return apiClient.post<ConsumerActivation>(this.baseUrl, activation)
  }

  async updateActivation(id: string, activation: Partial<ConsumerActivation>) {
    return apiClient.put<ConsumerActivation>(`${this.baseUrl}/${id}`, activation)
  }

  async deleteActivation(id: string) {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async uploadKYCDocument(activationId: string, documentType: 'idFront' | 'idBack' | 'selfie', file: File) {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('type', documentType)
    return apiClient.upload<{ documentUrl: string }>(`${this.baseUrl}/${activationId}/kyc-documents`, formData)
  }

  async getActivationStats(filters?: any) {
    return apiClient.get<ActivationStats>(`${this.baseUrl}/stats`, { params: filters })
  }

  async getAgentActivations(agentId: string, filters?: any) {
    return apiClient.get<{ activations: ConsumerActivation[]; total: number }>(
      `${this.baseUrl}/agent/${agentId}`,
      { params: filters }
    )
  }

  async getBrandActivations(brandId: string, filters?: any) {
    return apiClient.get<{ activations: ConsumerActivation[]; total: number }>(
      `${this.baseUrl}/brand/${brandId}`,
      { params: filters }
    )
  }

  async verifyKYC(activationId: string, verified: boolean, notes?: string) {
    return apiClient.post(`${this.baseUrl}/${activationId}/verify-kyc`, { verified, notes })
  }
}

export const consumerActivationService = new ConsumerActivationService()
