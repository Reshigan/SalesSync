import { apiClient } from '@/lib/api-client'

export interface SimCard {
  id?: string
  simNumber: string
  mobileNumber: string
  carrier: string
  status: 'active' | 'inactive' | 'suspended' | 'lost'
  agentId?: string
  agentName?: string
  assignedDate?: string
  activationDate?: string
  expiryDate?: string
  dataBalance?: number
  creditBalance?: number
  lastRecharge?: string
  notes?: string
  createdAt?: string
}

export interface Voucher {
  id?: string
  voucherCode: string
  type: 'airtime' | 'data' | 'bonus' | 'promotional'
  value: number
  carrier?: string
  status: 'available' | 'assigned' | 'used' | 'expired' | 'cancelled'
  agentId?: string
  agentName?: string
  customerId?: string
  customerName?: string
  assignedDate?: string
  usedDate?: string
  expiryDate?: string
  batchNumber?: string
  notes?: string
  createdAt?: string
}

export interface Board {
  id?: string
  boardNumber: string
  type: 'promotional' | 'informational' | 'directional'
  size: string
  location: string
  customerId?: string
  customerName?: string
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  installationDate?: string
  lastInspectionDate?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  photos?: string[]
  maintenanceRequired: boolean
  maintenanceNotes?: string
  status: 'active' | 'inactive' | 'removed'
  monthlyCost?: number
  createdAt?: string
}

export interface MapLocation {
  id?: string
  customerId: string
  customerName?: string
  latitude: number
  longitude: number
  address: string
  city?: string
  region?: string
  customerType?: 'retail' | 'wholesale'
  status?: 'active' | 'inactive'
  lastVisit?: string
  visitFrequency?: number
  notes?: string
}

class FieldAgentsService {
  private baseUrl = '/field-agents'

  // SIM Cards
  async getSimCards(filters?: any) {
    return apiClient.get<{ simCards: SimCard[]; total: number }>(`${this.baseUrl}/sims`, { params: filters })
  }

  async getSimCardById(id: string) {
    return apiClient.get<SimCard>(`${this.baseUrl}/sims/${id}`)
  }

  async createSimCard(sim: SimCard) {
    return apiClient.post<SimCard>(`${this.baseUrl}/sims`, sim)
  }

  async updateSimCard(id: string, sim: Partial<SimCard>) {
    return apiClient.put<SimCard>(`${this.baseUrl}/sims/${id}`, sim)
  }

  async deleteSimCard(id: string) {
    return apiClient.delete(`${this.baseUrl}/sims/${id}`)
  }

  async assignSimToAgent(id: string, agentId: string) {
    return apiClient.patch<SimCard>(`${this.baseUrl}/sims/${id}/assign`, { agentId })
  }

  async rechargeSimCard(id: string, amount: number, type: 'data' | 'credit') {
    return apiClient.post(`${this.baseUrl}/sims/${id}/recharge`, { amount, type })
  }

  // Vouchers
  async getVouchers(filters?: any) {
    return apiClient.get<{ vouchers: Voucher[]; total: number }>(`${this.baseUrl}/vouchers`, { params: filters })
  }

  async getVoucherById(id: string) {
    return apiClient.get<Voucher>(`${this.baseUrl}/vouchers/${id}`)
  }

  async createVoucher(voucher: Voucher) {
    return apiClient.post<Voucher>(`${this.baseUrl}/vouchers`, voucher)
  }

  async updateVoucher(id: string, voucher: Partial<Voucher>) {
    return apiClient.put<Voucher>(`${this.baseUrl}/vouchers/${id}`, voucher)
  }

  async deleteVoucher(id: string) {
    return apiClient.delete(`${this.baseUrl}/vouchers/${id}`)
  }

  async assignVoucher(id: string, agentId: string, customerId?: string) {
    return apiClient.patch<Voucher>(`${this.baseUrl}/vouchers/${id}/assign`, { agentId, customerId })
  }

  async redeemVoucher(id: string, customerId: string) {
    return apiClient.post(`${this.baseUrl}/vouchers/${id}/redeem`, { customerId })
  }

  async bulkCreateVouchers(batch: { type: string; value: number; count: number; carrier?: string; expiryDate?: string }) {
    return apiClient.post<{ created: number; vouchers: Voucher[] }>(`${this.baseUrl}/vouchers/bulk`, batch)
  }

  // Boards
  async getBoards(filters?: any) {
    return apiClient.get<{ boards: Board[]; total: number }>(`${this.baseUrl}/boards`, { params: filters })
  }

  async getBoardById(id: string) {
    return apiClient.get<Board>(`${this.baseUrl}/boards/${id}`)
  }

  async createBoard(board: Board) {
    return apiClient.post<Board>(`${this.baseUrl}/boards`, board)
  }

  async updateBoard(id: string, board: Partial<Board>) {
    return apiClient.put<Board>(`${this.baseUrl}/boards/${id}`, board)
  }

  async deleteBoard(id: string) {
    return apiClient.delete(`${this.baseUrl}/boards/${id}`)
  }

  async uploadBoardPhoto(boardId: string, file: File) {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient.upload<{ photoUrl: string }>(`${this.baseUrl}/boards/${boardId}/photos`, formData)
  }

  async recordInspection(boardId: string, inspection: { condition: string; maintenanceRequired: boolean; notes?: string; photos?: string[] }) {
    return apiClient.post(`${this.baseUrl}/boards/${boardId}/inspections`, inspection)
  }

  // Mapping
  async getMapLocations(filters?: any) {
    return apiClient.get<{ locations: MapLocation[]; total: number }>(`${this.baseUrl}/mapping`, { params: filters })
  }

  async updateCustomerLocation(customerId: string, location: { latitude: number; longitude: number; address: string }) {
    return apiClient.patch<MapLocation>(`${this.baseUrl}/mapping/${customerId}`, location)
  }

  async getNearbyCustomers(latitude: number, longitude: number, radius: number) {
    return apiClient.get<MapLocation[]>(`${this.baseUrl}/mapping/nearby`, {
      params: { latitude, longitude, radius }
    })
  }
}

export const fieldAgentsService = new FieldAgentsService()
