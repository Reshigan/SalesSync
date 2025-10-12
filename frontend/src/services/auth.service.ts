import { apiClient } from '@/lib/api-client';

export interface LoginRequest {
  email: string;
  password: string;
  tenantCode?: string;
}

export interface LoginData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    tenantCode: string;
    tenantName: string;
    areaId?: string;
    routeId?: string;
    monthlyTarget?: number;
    status: string;
    lastLogin?: string;
    createdAt: string;
    permissions: Array<{
      module: string;
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canApprove: boolean;
      canExport: boolean;
    }>;
  };
  tenant: {
    id: string;
    name: string;
    code: string;
    features: any;
  };
  token: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  data: LoginData;
}

export interface RefreshTokenData {
  token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: RefreshTokenData;
}

export interface ProfileData {
  user: any;
  tenant: any;
  permissions: any[];
}

export interface ProfileResponse {
  success: boolean;
  data: ProfileData;
}

class AuthService {
  async login(email: string, password: string, tenantCode: string = 'DEMO'): Promise<any> {
    console.log('AuthService.login called with:', { email, tenantCode });
    try {
      const response = await apiClient.post('/auth/login', 
        { email, password },
        {
          headers: {
            'X-Tenant-Code': tenantCode
          }
        }
      );
      console.log('AuthService.login response:', response);
      return response;
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenData> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken
    });
    return response.data;
  }

  async getProfile(): Promise<ProfileData> {
    const response = await apiClient.get<ProfileResponse>('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }
}

const authService = new AuthService();
export default authService;