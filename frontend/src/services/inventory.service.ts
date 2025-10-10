
import apiService from '@/lib/api';

export const inventoryService = {

  getStock: async () => {
    const response = await apiService.get('/inventory/stock');
    return response.data;
  },
  updateStock: async (data: any) => {
    const response = await apiService.post('/inventory/movements', data);
    return response.data;
  },
  getLowStock: async () => {
    const response = await apiService.get('/inventory/low-stock');
    return response.data;
  },
  getMovements: async () => {
    const response = await apiService.get('/inventory/movements');
    return response.data;
  },
};

export default inventoryService;
