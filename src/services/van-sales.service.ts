import { apiClient } from '@/lib/api-client'

export interface VanLoad {
  vanId: string
  agentId: string
  warehouseId: string
  loadDate: string
  cashFloat: number
  items: Array<{
    productId: string
    quantity: number
  }>
}

export interface VanSale {
  vanLoadId: string
  customerId: string
  saleDate: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    discount: number
  }>
  paymentMethod: 'cash' | 'credit' | 'mpesa'
  amountPaid: number
}

export interface VanReconciliation {
  vanLoadId: string
  reconciliationDate: string
  cashReturned: number
  stockReturned: Array<{
    productId: string
    quantity: number
  }>
  expenses: Array<{
    description: string
    amount: number
  }>
  notes?: string
}

class VanSalesService {
  private baseUrl = '/van-sales'

  async loadVan(load: VanLoad) {
    return apiClient.post(`${this.baseUrl}/load`, load)
  }

  async getActiveLoads(agentId?: string) {
    return apiClient.get<any[]>(`${this.baseUrl}/active-loads`, { params: { agentId } })
  }

  async recordSale(sale: VanSale) {
    return apiClient.post(`${this.baseUrl}/sale`, sale)
  }

  async reconcile(reconciliation: VanReconciliation) {
    return apiClient.post(`${this.baseUrl}/reconcile`, reconciliation)
  }

  async getLoadDetails(loadId: string) {
    return apiClient.get(`${this.baseUrl}/loads/${loadId}`)
  }

  async getSalesHistory(agentId?: string, fromDate?: string, toDate?: string) {
    return apiClient.get<any[]>(`${this.baseUrl}/sales`, { 
      params: { agentId, fromDate, toDate }
    })
  }
}

export const vanSalesService = new VanSalesService()
