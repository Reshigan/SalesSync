import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

describe('Auth Store - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should import useAuthStore', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    expect(useAuthStore).toBeDefined()
  })

  it('should have initial state', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should export getAuthToken', async () => {
    const { getAuthToken } = await import('../../store/auth.store')
    expect(getAuthToken).toBeDefined()
    const token = getAuthToken()
    expect(token === undefined || typeof token === 'string').toBe(true)
  })

  it('should export isAuthenticated', async () => {
    const { isAuthenticated } = await import('../../store/auth.store')
    expect(isAuthenticated).toBeDefined()
    expect(typeof isAuthenticated()).toBe('boolean')
  })

  it('should export getCurrentUser', async () => {
    const { getCurrentUser } = await import('../../store/auth.store')
    expect(getCurrentUser).toBeDefined()
    const user = getCurrentUser()
    expect(user === null || typeof user === 'object').toBe(true)
  })

  it('should export hasRole', async () => {
    const { hasRole } = await import('../../store/auth.store')
    expect(hasRole).toBeDefined()
    expect(hasRole('admin')).toBe(false)
  })

  it('should export hasPermission', async () => {
    const { hasPermission } = await import('../../store/auth.store')
    expect(hasPermission).toBeDefined()
    expect(hasPermission('read')).toBe(false)
  })

  it('should clear error', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('should set hydrated', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.getState().setHydrated(true)
    expect(useAuthStore.getState().hydrated).toBe(true)
  })

  it('should handle login success', async () => {
    const { authService } = await import('../../services/auth.service')
    ;(authService.login as any).mockResolvedValue({
      user: { id: '1', email: 'test@test.com', role: 'admin', permissions: [] },
      tokens: { access_token: 'tk', refresh_token: 'rf', expires_in: 3600, token_type: 'Bearer' },
    })
    const { useAuthStore } = await import('../../store/auth.store')
    await useAuthStore.getState().login({ email: 'test@test.com', password: 'pass', tenantId: 't1' })
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toBeDefined()
    expect(state.tokens).toBeDefined()
  })

  it('should handle login failure', async () => {
    const { authService } = await import('../../services/auth.service')
    ;(authService.login as any).mockRejectedValue(new Error('Invalid credentials'))
    const { useAuthStore } = await import('../../store/auth.store')
    await expect(
      useAuthStore.getState().login({ email: 'test@test.com', password: 'wrong', tenantId: 't1' })
    ).rejects.toThrow()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.error).toBeDefined()
  })

  it('should handle logout', async () => {
    const { authService } = await import('../../services/auth.service')
    ;(authService.logout as any).mockResolvedValue({})
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.tokens).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should handle refreshToken with no token', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({ tokens: null })
    await useAuthStore.getState().refreshToken()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('should handle refreshToken success', async () => {
    const { authService } = await import('../../services/auth.service')
    ;(authService.refreshToken as any).mockResolvedValue({
      access_token: 'new-token',
      expires_in: 3600,
    })
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({
      tokens: { access_token: 'old', refresh_token: 'rf', expires_in: 3600, token_type: 'Bearer' },
    })
    await useAuthStore.getState().refreshToken()
    expect(useAuthStore.getState().tokens?.access_token).toBe('new-token')
  })

  it('should handle refreshToken failure', async () => {
    const { authService } = await import('../../services/auth.service')
    ;(authService.refreshToken as any).mockRejectedValue(new Error('expired'))
    ;(authService.logout as any).mockResolvedValue({})
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({
      tokens: { access_token: 'old', refresh_token: 'rf', expires_in: 3600, token_type: 'Bearer' },
    })
    await useAuthStore.getState().refreshToken()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('should initialize with valid tokens', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', role: 'admin' } as any,
      tokens: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.test', refresh_token: 'rf', expires_in: 3600, token_type: 'Bearer' },
    })
    useAuthStore.getState().initialize()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('should initialize with no tokens', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false })
    useAuthStore.getState().initialize()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.tokens).toBeNull()
  })

  it('should updateUser', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', first_name: 'Test', role: 'admin' } as any,
    })
    useAuthStore.getState().updateUser({ first_name: 'Updated' } as any)
    expect(useAuthStore.getState().user?.first_name).toBe('Updated')
  })

  it('should not updateUser if no user', async () => {
    const { useAuthStore } = await import('../../store/auth.store')
    useAuthStore.setState({ user: null })
    useAuthStore.getState().updateUser({ first_name: 'Test' } as any)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('should hasRole return true for admin', async () => {
    const { useAuthStore, hasRole } = await import('../../store/auth.store')
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', role: 'admin', permissions: [] } as any,
    })
    expect(hasRole('admin')).toBe(true)
    expect(hasRole('manager')).toBe(true)
  })

  it('should hasPermission return true for admin', async () => {
    const { useAuthStore, hasPermission } = await import('../../store/auth.store')
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', role: 'admin', permissions: [] } as any,
    })
    expect(hasPermission('any-permission')).toBe(true)
  })

  it('should hasPermission check specific permissions', async () => {
    const { useAuthStore, hasPermission } = await import('../../store/auth.store')
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', role: 'viewer', permissions: ['read'] } as any,
    })
    expect(hasPermission('read')).toBe(true)
    expect(hasPermission('write')).toBe(false)
  })
})
