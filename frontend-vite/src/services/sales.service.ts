import api from './api'

export const salesService = {
  // Orders
  getOrders: () => api.get('/sales/orders'),
  getOrder: (id: number) => api.get(`/sales/orders/${id}`),
  createOrder: (data: any) => api.post('/sales/orders', data),
  updateOrder: (id: number, data: any) => api.put(`/sales/orders/${id}`, data),
  
  // Invoices
  getInvoices: () => api.get('/sales/invoices'),
  getInvoice: (id: number) => api.get(`/sales/invoices/${id}`),
  createInvoice: (data: any) => api.post('/sales/invoices', data),
  
  // Payments
  getPayments: () => api.get('/sales/payments'),
  getPayment: (id: number) => api.get(`/sales/payments/${id}`),
  createPayment: (data: any) => api.post('/sales/payments', data),
  
  getCreditNotes: () => api.get('/sales/credit-notes'),
  getCreditNote: (id: number) => api.get(`/sales/credit-notes/${id}`),
  createCreditNote: (data: any) => api.post('/sales/credit-notes', data),
  
  getReturns: () => api.get('/sales/returns'),
  getReturn: (id: number) => api.get(`/sales/returns/${id}`),
  createReturn: (data: any) => api.post('/sales/returns', data),
}
