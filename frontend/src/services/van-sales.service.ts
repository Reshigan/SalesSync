
import { apiClient } from '@/lib/api-client';

export const vanSalesService = {

  getRoutes: async () => {
    const response = await apiClient.get('/van-sales/routes') as any;
    return response.data;
  },
  getDrivers: async () => {
    const response = await apiClient.get('/van-sales/drivers') as any;
    return response.data;
  },
  trackVan: async (vanId: string) => {
    const response = await apiClient.get(`/van-sales/tracking/${vanId}`) as any;
    return response.data;
  },
  updateLocation: async (data: any) => {
    const response = await apiClient.post('/van-sales/location', data) as any;
    return response.data;
  },
  confirmLoading: async (data: any) => {
    const response = await apiClient.post('/van-sales/loadings', data) as any;
    return response.data;
  },
  getLoadings: async () => {
    const response = await apiClient.get('/van-sales/loadings') as any;
    return response.data;
  },
};

export default vanSalesService;
