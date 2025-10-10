
import { apiClient } from '../lib/api-client'

export interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference: string;
  notes?: string;
  created_at: string;
}

export const inventoryService = {

  getStock: async (): Promise<InventoryItem[]> => {
    return await apiClient.get<InventoryItem[]>('/inventory/stock');
  },
  updateStock: async (data: Partial<InventoryMovement>): Promise<InventoryMovement> => {
    return await apiClient.post<InventoryMovement>('/inventory/movements', data);
  },
  getLowStock: async (): Promise<InventoryItem[]> => {
    return await apiClient.get<InventoryItem[]>('/inventory/low-stock');
  },
  getMovements: async (): Promise<InventoryMovement[]> => {
    return await apiClient.get<InventoryMovement[]>('/inventory/movements');
  },
};

export default inventoryService;
