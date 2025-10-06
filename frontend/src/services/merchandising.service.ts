import { apiClient } from '@/lib/api-client'

export interface Visit {
  id?: string
  customerId: string
  customerName?: string
  agentId: string
  agentName?: string
  visitDate: string
  visitType: 'planned' | 'unplanned' | 'follow_up'
  purpose: string
  duration?: number
  photos?: string[]
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  notes?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  createdAt?: string
}

export interface ShelfAudit {
  id?: string
  visitId: string
  customerId: string
  customerName?: string
  auditDate: string
  productId: string
  productName?: string
  shelfPosition: string
  facings: number
  stockLevel: 'full' | 'medium' | 'low' | 'out_of_stock'
  priceCorrect: boolean
  displayedPrice?: number
  photos?: string[]
  notes?: string
  createdAt?: string
}

export interface CompetitorAudit {
  id?: string
  visitId: string
  customerId: string
  competitorBrand: string
  productName: string
  price: number
  promotionActive: boolean
  promotionDetails?: string
  shelfSpace: number
  stockLevel: 'full' | 'medium' | 'low' | 'out_of_stock'
  photos?: string[]
  notes?: string
  auditDate: string
  createdAt?: string
}

export interface Planogram {
  id?: string
  name: string
  description?: string
  category: string
  storeType: string
  products: Array<{
    productId: string
    position: number
    facings: number
    shelfLevel: number
  }>
  imageUrl?: string
  effectiveDate: string
  expiryDate?: string
  status: 'draft' | 'active' | 'expired'
  createdAt?: string
}

class MerchandisingService {
  private baseUrl = '/merchandising'

  // Visits
  async getVisits(filters?: any) {
    return apiClient.get<{ visits: Visit[]; total: number }>(`${this.baseUrl}/visits`, { params: filters })
  }

  async getVisitById(id: string) {
    return apiClient.get<Visit>(`${this.baseUrl}/visits/${id}`)
  }

  async createVisit(visit: Visit) {
    return apiClient.post<Visit>(`${this.baseUrl}/visits`, visit)
  }

  async updateVisit(id: string, visit: Partial<Visit>) {
    return apiClient.put<Visit>(`${this.baseUrl}/visits/${id}`, visit)
  }

  async deleteVisit(id: string) {
    return apiClient.delete(`${this.baseUrl}/visits/${id}`)
  }

  async uploadVisitPhoto(visitId: string, file: File) {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient.upload<{ photoUrl: string }>(`${this.baseUrl}/visits/${visitId}/photos`, formData)
  }

  // Shelf Audits
  async getShelfAudits(filters?: any) {
    return apiClient.get<{ audits: ShelfAudit[]; total: number }>(`${this.baseUrl}/shelf-audits`, { params: filters })
  }

  async createShelfAudit(audit: ShelfAudit) {
    return apiClient.post<ShelfAudit>(`${this.baseUrl}/shelf-audits`, audit)
  }

  async updateShelfAudit(id: string, audit: Partial<ShelfAudit>) {
    return apiClient.put<ShelfAudit>(`${this.baseUrl}/shelf-audits/${id}`, audit)
  }

  // Competitor Audits
  async getCompetitorAudits(filters?: any) {
    return apiClient.get<{ audits: CompetitorAudit[]; total: number }>(`${this.baseUrl}/competitor-audits`, { params: filters })
  }

  async createCompetitorAudit(audit: CompetitorAudit) {
    return apiClient.post<CompetitorAudit>(`${this.baseUrl}/competitor-audits`, audit)
  }

  // Planograms
  async getPlanograms(filters?: any) {
    return apiClient.get<{ planograms: Planogram[]; total: number }>(`${this.baseUrl}/planograms`, { params: filters })
  }

  async getPlanogramById(id: string) {
    return apiClient.get<Planogram>(`${this.baseUrl}/planograms/${id}`)
  }

  async createPlanogram(planogram: Planogram) {
    return apiClient.post<Planogram>(`${this.baseUrl}/planograms`, planogram)
  }

  async updatePlanogram(id: string, planogram: Partial<Planogram>) {
    return apiClient.put<Planogram>(`${this.baseUrl}/planograms/${id}`, planogram)
  }

  async deletePlanogram(id: string) {
    return apiClient.delete(`${this.baseUrl}/planograms/${id}`)
  }
}

export const merchandisingService = new MerchandisingService()
