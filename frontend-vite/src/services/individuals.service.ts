import apiClient from './api';

export interface Individual {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  id_type: string;
  id_number: string;
  address: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  updated_at: string;
}

const individualsService = {
  getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/individuals', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/individuals/${id}`);
    return response.data;
  },

  create: async (data: Partial<Individual>) => {
    const response = await apiClient.post('/individuals', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Individual>) => {
    const response = await apiClient.put(`/individuals/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/individuals/${id}`);
    return response.data;
  }
};

export default individualsService;
