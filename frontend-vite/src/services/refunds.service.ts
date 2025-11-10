import apiClient from './api'

export const refundsService = {
  async getRefunds(filter?: any) {
    try {
      const response = await apiClient.get('/orders-enhanced/refunds', { params: filter })
      return response.data
    } catch (error) {
      console.error('Error fetching refunds:', error)
      throw error
    }
  },

  async getRefundById(id: string) {
    try {
      const response = await apiClient.get(`/orders-enhanced/refunds/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching refund:', error)
      throw error
    }
  },

  async createRefund(data: any) {
    try {
      const response = await apiClient.post('/orders-enhanced/refunds', data)
      return response.data
    } catch (error) {
      console.error('Error creating refund:', error)
      throw error
    }
  },

  async processRefund(id: string, data: any) {
    try {
      const response = await apiClient.post(`/orders-enhanced/refunds/${id}/process`, data)
      return response.data
    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    }
  }
}
