import { apiClient } from '@/lib/api-client';

export interface LoginRequest {
  email: string;
  password: string;
  tenantCode?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      tenantId: string;
      tenantCode: string;
      tenantName: string;
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
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: any;
    tenant: any;
    permissions: any[];
  };
}

class AuthService {
  async login(email: string, password: string, tenantCode: string = 'DEMO'): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', 
      { email, password },
      {
        headers: {
          'X-Tenant-Code': tenantCode
        }
      }
    );
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken
    });
    return response.data;
  }

  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }
}

const authService = new AuthService();
export default authService;