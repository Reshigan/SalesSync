import { apiClient } from './api.service'

export interface Discount {
  id: string
  tenant_id: string
  name: string
  code: string | null
  discount_type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number
  max_discount_amount: number | null
  applicable_to: 'all' | 'product' | 'customer' | 'category'
  product_ids: string | null
  category_ids: string | null
  customer_ids: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

class DiscountsService {
  private readonly baseUrl = '/discounts'

  async getDiscounts(params?: { is_active?: boolean; applicable_to?: string }): Promise<Discount[]> {
    try {
      const response = await apiClient.get(this.baseUrl, { params })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch discounts:', error)
      return []
    }
  }

  async getDiscount(id: string): Promise<Discount | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data.data || null
    } catch (error) {
      console.error('Failed to fetch discount:', error)
      return null
    }
  }

  async createDiscount(discount: Partial<Discount>): Promise<{ id: string } | null> {
    try {
      const response = await apiClient.post(this.baseUrl, discount)
      return response.data.data
    } catch (error) {
      console.error('Failed to create discount:', error)
      throw error
    }
  }

  async updateDiscount(id: string, discount: Partial<Discount>): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}`, discount)
    } catch (error) {
      console.error('Failed to update discount:', error)
      throw error
    }
  }

  async deleteDiscount(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete discount:', error)
      throw error
    }
  }

  async getApplicableDiscounts(params: { product_id?: string; customer_id?: string; category_id?: string }): Promise<Discount[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/applicable`, { params })
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch applicable discounts:', error)
      return []
    }
  }
}

export const discountsService = new DiscountsService()
