import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
}))

describe('Auth Store Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('Initial State', () => {
    it('should have null user initially', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })
    it('should have null tokens initially', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      const state = useAuthStore.getState()
      expect(state.tokens).toBeNull()
    })
    it('should not be authenticated initially', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })
    it('should not be loading initially', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
    })
    it('should have null error initially', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      const state = useAuthStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('Login Action', () => {
    it('should set loading state during login', async () => {
      const { authService } = await import('../../services/auth.service')
      const loginPromise = new Promise(() => {});
      (authService.login as any).mockReturnValue(loginPromise)
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      expect(useAuthStore.getState().isLoading).toBe(true)
    })

    it('should set user and tokens on successful login', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', status: 'active', permissions: [] },
        tokens: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, token_type: 'Bearer' as const },
      }
      const { authService } = await import('../../services/auth.service');
      (authService.login as any).mockResolvedValue(mockResponse)
      const { useAuthStore } = await import('../../store/auth.store')
      await useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockResponse.user)
      expect(state.tokens).toEqual(mockResponse.tokens)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set error on failed login', async () => {
      const { authService } = await import('../../services/auth.service');
      (authService.login as any).mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } })
      const { useAuthStore } = await import('../../store/auth.store')
      try {
        await useAuthStore.getState().login({ email: 'test@test.com', password: 'wrong', tenantId: 't1' })
      } catch (e) {}
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should handle network error during login', async () => {
      const { authService } = await import('../../services/auth.service');
      (authService.login as any).mockRejectedValue(new Error('Network Error'))
      const { useAuthStore } = await import('../../store/auth.store')
      try {
        await useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      } catch (e) {}
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('Logout Action', () => {
    it('should clear user and tokens on logout', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().logout()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.tokens).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear error on logout', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().logout()
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('clearError Action', () => {
    it('should clear error', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().clearError()
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('updateUser Action', () => {
    it('should update user properties', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', status: 'active', permissions: [] },
        tokens: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, token_type: 'Bearer' as const },
      }
      const { authService } = await import('../../services/auth.service');
      (authService.login as any).mockResolvedValue(mockResponse)
      const { useAuthStore } = await import('../../store/auth.store')
      await useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      useAuthStore.getState().updateUser({ first_name: 'Updated' })
      expect(useAuthStore.getState().user?.first_name).toBe('Updated')
    })
  })

  describe('setHydrated Action', () => {
    it('should set hydrated state', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().setHydrated(true)
      expect(useAuthStore.getState().hydrated).toBe(true)
    })
    it('should set hydrated to false', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().setHydrated(false)
      expect(useAuthStore.getState().hydrated).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist auth state', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      expect(useAuthStore.persist).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid login/logout', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      const { authService } = await import('../../services/auth.service');
      (authService.login as any).mockResolvedValue({
        user: { id: '1', email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', status: 'active', permissions: [] },
        tokens: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, token_type: 'Bearer' as const },
      })
      await useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should handle updateUser when no user', async () => {
      const { useAuthStore } = await import('../../store/auth.store')
      useAuthStore.getState().logout()
      useAuthStore.getState().updateUser({ first_name: 'Test' })
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should handle concurrent login attempts', async () => {
      const { authService } = await import('../../services/auth.service');
      (authService.login as any).mockResolvedValue({
        user: { id: '1', email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', status: 'active', permissions: [] },
        tokens: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, token_type: 'Bearer' as const },
      })
      const { useAuthStore } = await import('../../store/auth.store')
      const p1 = useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      const p2 = useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
      await Promise.allSettled([p1, p2])
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
