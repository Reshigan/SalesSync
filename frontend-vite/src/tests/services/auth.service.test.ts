import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../store/auth.store', () => ({
  getAuthToken: vi.fn(() => 'mock-token'),
  useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) },
}))

vi.mock('../../services/tenant.service', () => ({
  tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') },
}))

describe('Auth Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call POST /auth/login with credentials', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'admin', status: 'active', permissions: [] },
            tokens: { access_token: 'token123', refresh_token: 'refresh123', expires_in: 86400, token_type: 'Bearer' },
          },
        },
      };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { authService } = await import('../../services/auth.service')
      const result = await authService.login({ email: 'test@test.com', password: 'password123', tenantId: 'tenant1' })
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', expect.any(Object))
      expect(result).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
    })

    it('should handle login with valid email and password', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'admin@company.com', firstName: 'Admin', lastName: 'User', role: 'admin', status: 'active', permissions: ['read', 'write'] },
            tokens: { access_token: 'valid-token', refresh_token: 'valid-refresh', expires_in: 3600, token_type: 'Bearer' },
          },
        },
      };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { authService } = await import('../../services/auth.service')
      const result = await authService.login({ email: 'admin@company.com', password: 'SecurePass123!', tenantId: 't1' })
      expect(result.user.email).toBe('admin@company.com')
      expect(result.tokens.access_token).toBe('valid-token')
    })

    it('should handle login failure with wrong password', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 401, data: { message: 'Invalid credentials' } } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test@test.com', password: 'wrong', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle login failure with non-existent email', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 401, data: { message: 'User not found' } } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'noone@test.com', password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle network error during login', async () => {
      (apiClient.post as any).mockRejectedValue(new Error('Network Error'))
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })).rejects.toThrow('Network Error')
    })

    it('should handle server error during login', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 500, data: { message: 'Internal Server Error' } } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle timeout during login', async () => {
      (apiClient.post as any).mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout' })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should parse expires_in from string format', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'admin', status: 'active' },
            tokens: { access_token: 'tk', refresh_token: 'rf', expires_in: '24h', token_type: 'Bearer' },
          },
        },
      };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { authService } = await import('../../services/auth.service')
      const result = await authService.login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      expect(result.tokens.expires_in).toBeGreaterThan(0)
    })

    it('should handle missing permissions in response', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'viewer', status: 'active' },
            tokens: { access_token: 'tk', refresh_token: 'rf', expires_in: 3600, token_type: 'Bearer' },
          },
        },
      };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { authService } = await import('../../services/auth.service')
      const result = await authService.login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      expect(result.user.permissions).toEqual([])
    })

    it('should handle token without refresh token', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'admin', status: 'active' },
            tokens: { access_token: 'tk', expires_in: 3600, token_type: 'Bearer' },
          },
        },
      };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { authService } = await import('../../services/auth.service')
      const result = await authService.login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      expect(result.tokens.access_token).toBe('tk')
    })
  })

  describe('logout', () => {
    it('should call POST /auth/logout', async () => {
      (apiClient.post as any).mockResolvedValue({ data: {} })
      const { authService } = await import('../../services/auth.service')
      await authService.logout()
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('should handle logout failure gracefully', async () => {
      (apiClient.post as any).mockRejectedValue(new Error('Network error'))
      const { authService } = await import('../../services/auth.service')
      await expect(authService.logout()).rejects.toBeDefined()
    })
  })

  describe('refreshToken', () => {
    it('should call POST /auth/refresh with token', async () => {
      const mockResponse = { data: { data: { token: 'new-token', expires_in: 3600 } } };
      (apiClient.post as any).mockResolvedValue(mockResponse)
      const { authService } = await import('../../services/auth.service')
      const result = await authService.refreshToken('old-refresh-token')
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old-refresh-token' })
      expect(result.access_token).toBe('new-token')
    })

    it('should handle expired refresh token', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 401, data: { message: 'Token expired' } } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.refreshToken('expired-token')).rejects.toBeDefined()
    })

    it('should handle invalid refresh token', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 401 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.refreshToken('invalid')).rejects.toBeDefined()
    })
  })

  describe('forgotPassword', () => {
    it('should call POST /auth/forgot-password', async () => {
      (apiClient.post as any).mockResolvedValue({ data: {} })
      const { authService } = await import('../../services/auth.service')
      await authService.forgotPassword({ email: 'test@test.com' })
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@test.com' })
    })

    it('should handle non-existent email', async () => {
      (apiClient.post as any).mockResolvedValue({ data: {} })
      const { authService } = await import('../../services/auth.service')
      await authService.forgotPassword({ email: 'nobody@test.com' })
      expect(apiClient.post).toHaveBeenCalled()
    })

    it('should handle network error', async () => {
      (apiClient.post as any).mockRejectedValue(new Error('Network Error'))
      const { authService } = await import('../../services/auth.service')
      await expect(authService.forgotPassword({ email: 'test@test.com' })).rejects.toThrow()
    })
  })

  describe('resetPassword', () => {
    it('should call POST /auth/reset-password', async () => {
      (apiClient.post as any).mockResolvedValue({ data: {} })
      const { authService } = await import('../../services/auth.service')
      await authService.resetPassword({ token: 'reset-token', password: 'newPassword123!' })
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', expect.any(Object))
    })

    it('should handle invalid reset token', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.resetPassword({ token: 'invalid', password: 'pass' })).rejects.toBeDefined()
    })
  })

  describe('changePassword', () => {
    it('should call POST /auth/change-password', async () => {
      (apiClient.post as any).mockResolvedValue({ data: {} })
      const { authService } = await import('../../services/auth.service')
      await authService.changePassword({ currentPassword: 'old', newPassword: 'new123!', confirmPassword: 'new123!' })
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', expect.any(Object))
    })

    it('should handle wrong current password', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400, data: { message: 'Current password incorrect' } } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.changePassword({ currentPassword: 'wrong', newPassword: 'new', confirmPassword: 'new' })).rejects.toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty email', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: '', password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle empty password', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test@test.com', password: '', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle special characters in email', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test+special@test.com', password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle very long password', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'test@test.com', password: 'a'.repeat(1000), tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle unicode in credentials', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: 'тест@test.com', password: 'пароль', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle SQL injection in email', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: "' OR 1=1 --", password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })

    it('should handle XSS in email', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { authService } = await import('../../services/auth.service')
      await expect(authService.login({ email: '<script>alert(1)</script>', password: 'pass', tenantId: 't1' })).rejects.toBeDefined()
    })
  })
})
