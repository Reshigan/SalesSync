
import { apiClient } from '../lib/api-client'

export interface VanRoute {
  id: string;
  name: string;
  driver_id: string;
  status: 'active' | 'inactive';
  customers: string[];
  created_at: string;
  updated_at: string;
}

export interface VanDriver {
  id: string;
  name: string;
  license_number: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface VanLocation {
  van_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export const vanSalesService = {

  getRoutes: async (): Promise<VanRoute[]> => {
    return await apiClient.get<VanRoute[]>('/van-sales/routes');
  },
  getDrivers: async (): Promise<VanDriver[]> => {
    return await apiClient.get<VanDriver[]>('/van-sales/drivers');
  },
  trackVan: async (vanId: string): Promise<VanLocation> => {
    return await apiClient.get<VanLocation>(`/van-sales/tracking/${vanId}`);
  },
  updateLocation: async (data: VanLocation): Promise<VanLocation> => {
    return await apiClient.post<VanLocation>('/van-sales/location', data);
  },
};

export default vanSalesService;
