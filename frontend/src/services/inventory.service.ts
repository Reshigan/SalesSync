
import apiService from '@/lib/api';

export const inventoryService = {

  getStock: async () => {
    const response = await apiService.getInventory();
    return response.data;
  },
  updateStock: async (data: any) => {
    const response = await apiService.createInventoryItem(data);
    return response.data;
  },
  getLowStock: async () => {
    const response = await apiService.getInventory({ lowStock: true });
    return response.data;
  },
  getMovements: async () => {
    const response = await apiService.getInventory();
    return response.data;
  },
};

export default inventoryService;
