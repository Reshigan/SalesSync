import { apiClient } from './api.service'

export interface PurchaseOrder {
  id: string
  tenant_id: string
  po_number: string
  supplier_id: string
  supplier_name?: string
  order_date: string
  expected_delivery_date?: string
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'
  subtotal: number
  tax_amount: number
  total_amount: number
  notes?: string
  created_at: string
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id?: string
  purchase_order_id?: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity: number
  unit_price: number
  tax_percentage?: number
  line_total: number
  received_quantity?: number
  product?: {
    id: string
    name: string
    code?: string
  }
}

export interface PurchaseOrderFilter {
  status?: string
  supplier_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

class PurchaseOrdersService {
  private readonly baseUrl = '/purchase-orders'

  async getPurchaseOrders(filter?: PurchaseOrderFilter): Promise<{ purchaseOrders: PurchaseOrder[], total: number }> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return {
        purchaseOrders: response.data.data?.purchaseOrders || response.data.data || [],
        total: response.data.data?.pagination?.total || response.data.data?.length || 0
      }
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error)
      throw error
    }
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data?.purchaseOrder || response.data.data || null
    } catch (error) {
      console.error('Failed to fetch purchase order:', error)
      return null
    }
  }

  async createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'created_at'>): Promise<PurchaseOrder> {
    try {
      const response = await apiClient.post(this.baseUrl, po)
      return response.data.data?.purchaseOrder || response.data.data
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      throw error
    }
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data.data?.purchaseOrder || response.data.data
    } catch (error) {
      console.error('Failed to update purchase order:', error)
      throw error
    }
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete purchase order:', error)
      throw error
    }
  }

  async approvePurchaseOrder(id: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${id}/approve`)
    } catch (error) {
      console.error('Failed to approve purchase order:', error)
      throw error
    }
  }

  async receivePurchaseOrder(id: string, items: Array<{ product_id: string, received_quantity: number }>): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${id}/receive`, { items })
    } catch (error) {
      console.error('Failed to receive purchase order:', error)
      throw error
    }
  }

  async getPurchaseOrderStats(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats/summary`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch purchase order stats:', error)
      return null
    }
  }
}

export const purchaseOrdersService = new PurchaseOrdersService()
