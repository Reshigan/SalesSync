import api from './api'

export const crmService = {
  // Customers
  getCustomers: () => api.get('/customers'),
  getCustomer: (id: number) => api.get(`/customers/${id}`),
  createCustomer: (data: any) => api.post('/customers', data),
  updateCustomer: (id: number, data: any) => api.put(`/customers/${id}`, data),
  
  getKYCCases: () => api.get('/kyc/cases'),
  getKYCCase: (id: number) => api.get(`/kyc/cases/${id}`),
  createKYCCase: (data: any) => api.post('/kyc/cases', data),
  
  getSurveys: () => api.get('/surveys'),
  getSurvey: (id: number) => api.get(`/surveys/${id}`),
  createSurvey: (data: any) => api.post('/surveys', data),
  
  getUsers: () => api.get('/users'),
}
