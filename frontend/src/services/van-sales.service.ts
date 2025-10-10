
import apiService from '@/lib/api';

export const vanSalesService = {

  getRoutes: async () => {
    const response = await apiService.get('/van-sales/routes');
    return response.data;
  },
  getDrivers: async () => {
    const response = await apiService.get('/van-sales/drivers');
    return response.data;
  },
  trackVan: async (vanId: string) => {
    const response = await apiService.get('/van-sales/tracking');
    return response.data;
  },
  updateLocation: async (data: any) => {
    const response = await apiService.post('/van-sales/location', data);
    return response.data;
  },
};

export default vanSalesService;
