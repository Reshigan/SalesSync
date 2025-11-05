import api from './api'

export const marketingService = {
  getCampaigns: () => api.get('/marketing/campaigns'),
  getCampaign: (id: number) => api.get(`/marketing/campaigns/${id}`),
  createCampaign: (data: any) => api.post('/marketing/campaigns', data),
  updateCampaign: (id: number, data: any) => api.put(`/marketing/campaigns/${id}`, data),
  
  getEvents: () => api.get('/marketing/events'),
  getEvent: (id: number) => api.get(`/marketing/events/${id}`),
  createEvent: (data: any) => api.post('/marketing/events', data),
  updateEvent: (id: number, data: any) => api.put(`/marketing/events/${id}`, data),
  
  getPromotions: () => api.get('/marketing/promotions'),
  getPromotion: (id: number) => api.get(`/marketing/promotions/${id}`),
  createPromotion: (data: any) => api.post('/marketing/promotions', data),
  
  getActivations: () => api.get('/marketing/activations'),
  getActivation: (id: number) => api.get(`/marketing/activations/${id}`),
  createActivation: (data: any) => api.post('/marketing/activations', data),
  
  getAgents: () => api.get('/field-agents'),
}
