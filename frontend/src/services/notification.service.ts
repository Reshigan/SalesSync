// Comprehensive Notification Preferences Service
import apiClient from '@/lib/api-client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NotificationPreferences {
  id: string
  userId: string
  email: EmailPreferences
  push: PushPreferences
  sms: SMSPreferences
  inApp: InAppPreferences
  digest: DigestPreferences
  doNotDisturb: DoNotDisturbSettings
  updatedAt: string
}

export interface EmailPreferences {
  enabled: boolean
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'NEVER'
  categories: {
    visits: boolean
    customers: boolean
    commissions: boolean
    boards: boolean
    products: boolean
    system: boolean
    marketing: boolean
    security: boolean
  }
  format: 'HTML' | 'TEXT'
  unsubscribeAll: boolean
}

export interface PushPreferences {
  enabled: boolean
  categories: {
    visits: boolean
    customers: boolean
    commissions: boolean
    boards: boolean
    products: boolean
    system: boolean
    security: boolean
    reminders: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
    timezone: string
  }
  sound: boolean
  vibration: boolean
  badge: boolean
}

export interface SMSPreferences {
  enabled: boolean
  phoneNumber: string
  categories: {
    urgent: boolean
    security: boolean
    reminders: boolean
    commissions: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
}

export interface InAppPreferences {
  enabled: boolean
  categories: {
    visits: boolean
    customers: boolean
    commissions: boolean
    boards: boolean
    products: boolean
    system: boolean
    social: boolean
    achievements: boolean
  }
  position: 'TOP_RIGHT' | 'TOP_LEFT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT'
  duration: number // seconds
  sound: boolean
  desktop: boolean
}

export interface DigestPreferences {
  enabled: boolean
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  time: string // HH:mm
  timezone: string
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  includeMetrics: boolean
  includeAchievements: boolean
  includeReminders: boolean
  format: 'SUMMARY' | 'DETAILED'
}

export interface DoNotDisturbSettings {
  enabled: boolean
  schedule: {
    start: string
    end: string
    timezone: string
    days: number[] // 0-6 (Sunday-Saturday)
  }
  exceptions: {
    urgent: boolean
    security: boolean
    fromManagers: boolean
    keywords: string[]
  }
  autoReply: {
    enabled: boolean
    message: string
  }
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP'
  category: string
  subject?: string
  content: string
  variables: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationHistory {
  id: string
  userId: string
  type: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP'
  category: string
  title: string
  content: string
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'BOUNCED'
  sentAt: string
  deliveredAt?: string
  readAt?: string
  metadata: Record<string, any>
}

export interface NotificationChannel {
  id: string
  name: string
  type: 'EMAIL' | 'PUSH' | 'SMS' | 'WEBHOOK' | 'SLACK'
  configuration: Record<string, any>
  enabled: boolean
  testMode: boolean
  rateLimits: {
    perMinute: number
    perHour: number
    perDay: number
  }
  failureHandling: {
    retryAttempts: number
    retryDelay: number
    fallbackChannel?: string
  }
}

interface NotificationStore {
  preferences: NotificationPreferences | null
  unreadCount: number
  notifications: NotificationHistory[]
  isLoading: boolean
  
  // Actions
  loadPreferences: () => Promise<void>
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>
  updateEmailPreferences: (email: Partial<EmailPreferences>) => Promise<void>
  updatePushPreferences: (push: Partial<PushPreferences>) => Promise<void>
  updateSMSPreferences: (sms: Partial<SMSPreferences>) => Promise<void>
  updateInAppPreferences: (inApp: Partial<InAppPreferences>) => Promise<void>
  updateDigestPreferences: (digest: Partial<DigestPreferences>) => Promise<void>
  updateDoNotDisturb: (dnd: Partial<DoNotDisturbSettings>) => Promise<void>
  
  // Notification management
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  getNotificationHistory: (page?: number, limit?: number) => Promise<void>
  
  // Subscription management
  subscribeToPush: () => Promise<void>
  unsubscribeFromPush: () => Promise<void>
  testNotification: (type: 'EMAIL' | 'PUSH' | 'SMS') => Promise<void>
}

// Create notification store
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      preferences: null,
      unreadCount: 0,
      notifications: [],
      isLoading: false,

      loadPreferences: async () => {
        set({ isLoading: true })
        try {
          const preferences = await notificationService.getPreferences()
          set({ preferences })
        } catch (error) {
          console.error('Failed to load notification preferences:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      updatePreferences: async (updates) => {
        const { preferences } = get()
        if (!preferences) return

        try {
          const updatedPreferences = await notificationService.updatePreferences(updates)
          set({ preferences: updatedPreferences })
        } catch (error) {
          console.error('Failed to update preferences:', error)
          throw error
        }
      },

      updateEmailPreferences: async (email) => {
        const { updatePreferences } = get()
        await updatePreferences({ email })
      },

      updatePushPreferences: async (push) => {
        const { updatePreferences } = get()
        await updatePreferences({ push })
      },

      updateSMSPreferences: async (sms) => {
        const { updatePreferences } = get()
        await updatePreferences({ sms })
      },

      updateInAppPreferences: async (inApp) => {
        const { updatePreferences } = get()
        await updatePreferences({ inApp })
      },

      updateDigestPreferences: async (digest) => {
        const { updatePreferences } = get()
        await updatePreferences({ digest })
      },

      updateDoNotDisturb: async (doNotDisturb) => {
        const { updatePreferences } = get()
        await updatePreferences({ doNotDisturb })
      },

      markAsRead: async (notificationId) => {
        try {
          await notificationService.markAsRead(notificationId)
          set((state) => ({
            notifications: state.notifications.map(n => 
              n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Failed to mark notification as read:', error)
        }
      },

      markAllAsRead: async () => {
        try {
          await notificationService.markAllAsRead()
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, readAt: new Date().toISOString() })),
            unreadCount: 0
          }))
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error)
        }
      },

      deleteNotification: async (notificationId) => {
        try {
          await notificationService.deleteNotification(notificationId)
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== notificationId)
          }))
        } catch (error) {
          console.error('Failed to delete notification:', error)
        }
      },

      getNotificationHistory: async (page = 1, limit = 20) => {
        try {
          const response = await notificationService.getNotificationHistory({ page, limit })
          set({ 
            notifications: response.notifications,
            unreadCount: response.unreadCount 
          })
        } catch (error) {
          console.error('Failed to load notification history:', error)
        }
      },

      subscribeToPush: async () => {
        try {
          await notificationService.subscribeToPushNotifications()
          const { updatePushPreferences } = get()
          await updatePushPreferences({ enabled: true })
        } catch (error) {
          console.error('Failed to subscribe to push notifications:', error)
          throw error
        }
      },

      unsubscribeFromPush: async () => {
        try {
          await notificationService.unsubscribeFromPushNotifications()
          const { updatePushPreferences } = get()
          await updatePushPreferences({ enabled: false })
        } catch (error) {
          console.error('Failed to unsubscribe from push notifications:', error)
          throw error
        }
      },

      testNotification: async (type) => {
        try {
          await notificationService.sendTestNotification(type)
        } catch (error) {
          console.error(`Failed to send test ${type} notification:`, error)
          throw error
        }
      }
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        preferences: state.preferences,
        unreadCount: state.unreadCount
      })
    }
  )
)

class NotificationService {
  // Preferences management
  async getPreferences(): Promise<NotificationPreferences> {
    return apiClient.get('/notifications/preferences')
  }

  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return apiClient.patch('/notifications/preferences', updates)
  }

  async resetPreferences(): Promise<NotificationPreferences> {
    return apiClient.post('/notifications/preferences/reset')
  }

  // Notification history
  async getNotificationHistory(params: {
    page?: number
    limit?: number
    type?: NotificationHistory['type']
    category?: string
    status?: NotificationHistory['status']
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<{
    notifications: NotificationHistory[]
    unreadCount: number
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get('/notifications/history', { params })
  }

  async getNotification(notificationId: string): Promise<NotificationHistory> {
    return apiClient.get(`/notifications/${notificationId}`)
  }

  async markAsRead(notificationId: string): Promise<void> {
    return apiClient.patch(`/notifications/${notificationId}/read`)
  }

  async markAllAsRead(): Promise<void> {
    return apiClient.patch('/notifications/read-all')
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete(`/notifications/${notificationId}`)
  }

  async deleteAllNotifications(): Promise<void> {
    return apiClient.delete('/notifications/all')
  }

  // Push notification management
  async subscribeToPushNotifications(): Promise<{ subscription: PushSubscription }> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported')
    }

    const registration = await navigator.serviceWorker.ready
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await this.getVAPIDPublicKey()
    })

    return apiClient.post('/notifications/push/subscribe', {
      subscription: subscription.toJSON()
    })
  }

  async unsubscribeFromPushNotifications(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      await apiClient.post('/notifications/push/unsubscribe')
    }
  }

  async getPushSubscriptionStatus(): Promise<{
    subscribed: boolean
    subscription?: PushSubscription
  }> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { subscribed: false }
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    return {
      subscribed: !!subscription,
      subscription: subscription || undefined
    }
  }

  private async getVAPIDPublicKey(): Promise<Uint8Array> {
    const response = await apiClient.get('/notifications/push/vapid-key')
    return new Uint8Array(response.publicKey)
  }

  // SMS management
  async verifySMSNumber(phoneNumber: string): Promise<{ verificationId: string }> {
    return apiClient.post('/notifications/sms/verify', { phoneNumber })
  }

  async confirmSMSVerification(verificationId: string, code: string): Promise<void> {
    return apiClient.post('/notifications/sms/confirm', { verificationId, code })
  }

  async removeSMSNumber(): Promise<void> {
    return apiClient.delete('/notifications/sms/number')
  }

  // Email management
  async verifyEmailAddress(email: string): Promise<{ verificationId: string }> {
    return apiClient.post('/notifications/email/verify', { email })
  }

  async confirmEmailVerification(verificationId: string, token: string): Promise<void> {
    return apiClient.post('/notifications/email/confirm', { verificationId, token })
  }

  async unsubscribeFromEmail(token: string): Promise<void> {
    return apiClient.post('/notifications/email/unsubscribe', { token })
  }

  async resubscribeToEmail(token: string): Promise<void> {
    return apiClient.post('/notifications/email/resubscribe', { token })
  }

  // Template management
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const response = await apiClient.get('/notifications/templates')
    return response.templates
  }

  async getNotificationTemplate(templateId: string): Promise<NotificationTemplate> {
    return apiClient.get(`/notifications/templates/${templateId}`)
  }

  async createNotificationTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    return apiClient.post('/notifications/templates', templateData)
  }

  async updateNotificationTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    return apiClient.put(`/notifications/templates/${templateId}`, updates)
  }

  async deleteNotificationTemplate(templateId: string): Promise<void> {
    return apiClient.delete(`/notifications/templates/${templateId}`)
  }

  // Channel management
  async getNotificationChannels(): Promise<NotificationChannel[]> {
    const response = await apiClient.get('/notifications/channels')
    return response.channels
  }

  async getNotificationChannel(channelId: string): Promise<NotificationChannel> {
    return apiClient.get(`/notifications/channels/${channelId}`)
  }

  async createNotificationChannel(channelData: Omit<NotificationChannel, 'id'>): Promise<NotificationChannel> {
    return apiClient.post('/notifications/channels', channelData)
  }

  async updateNotificationChannel(channelId: string, updates: Partial<NotificationChannel>): Promise<NotificationChannel> {
    return apiClient.put(`/notifications/channels/${channelId}`, updates)
  }

  async deleteNotificationChannel(channelId: string): Promise<void> {
    return apiClient.delete(`/notifications/channels/${channelId}`)
  }

  async testNotificationChannel(channelId: string): Promise<{
    success: boolean
    message: string
    latency?: number
  }> {
    return apiClient.post(`/notifications/channels/${channelId}/test`)
  }

  // Testing
  async sendTestNotification(type: 'EMAIL' | 'PUSH' | 'SMS'): Promise<void> {
    return apiClient.post('/notifications/test', { type })
  }

  async previewNotification(templateId: string, variables: Record<string, any>): Promise<{
    subject?: string
    content: string
    renderedContent: string
  }> {
    return apiClient.post(`/notifications/templates/${templateId}/preview`, { variables })
  }

  // Analytics
  async getNotificationAnalytics(timeRange: string = '30d'): Promise<{
    totalSent: number
    deliveryRate: number
    openRate: number
    clickRate: number
    unsubscribeRate: number
    byChannel: Record<string, {
      sent: number
      delivered: number
      opened: number
      clicked: number
    }>
    byCategory: Record<string, {
      sent: number
      delivered: number
      opened: number
    }>
    trends: Array<{
      date: string
      sent: number
      delivered: number
      opened: number
    }>
  }> {
    return apiClient.get('/notifications/analytics', { params: { timeRange } })
  }

  // Bulk operations
  async sendBulkNotification(notification: {
    type: 'EMAIL' | 'PUSH' | 'SMS'
    templateId: string
    recipients: string[]
    variables?: Record<string, any>
    scheduleAt?: string
  }): Promise<{ jobId: string }> {
    return apiClient.post('/notifications/bulk', notification)
  }

  async getBulkNotificationStatus(jobId: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    progress: number
    totalRecipients: number
    sentCount: number
    failedCount: number
    errors: string[]
  }> {
    return apiClient.get(`/notifications/bulk/${jobId}/status`)
  }

  // Scheduling
  async scheduleNotification(notification: {
    type: 'EMAIL' | 'PUSH' | 'SMS'
    templateId: string
    recipient: string
    variables?: Record<string, any>
    scheduleAt: string
    timezone?: string
  }): Promise<{ scheduledId: string }> {
    return apiClient.post('/notifications/schedule', notification)
  }

  async getScheduledNotifications(): Promise<Array<{
    id: string
    type: string
    recipient: string
    templateId: string
    scheduleAt: string
    status: 'SCHEDULED' | 'SENT' | 'CANCELLED'
  }>> {
    const response = await apiClient.get('/notifications/scheduled')
    return response.notifications
  }

  async cancelScheduledNotification(scheduledId: string): Promise<void> {
    return apiClient.delete(`/notifications/scheduled/${scheduledId}`)
  }

  // Real-time notifications
  async subscribeToRealTimeNotifications(callback: (notification: NotificationHistory) => void): Promise<() => void> {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/notifications`)
    
    ws.onmessage = (event) => {
      const notification: NotificationHistory = JSON.parse(event.data)
      callback(notification)
    }

    return () => ws.close()
  }

  // Notification permissions
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    return Notification.requestPermission()
  }

  async getNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    return Notification.permission
  }

  // Do Not Disturb
  async enableDoNotDisturb(settings: DoNotDisturbSettings): Promise<void> {
    return apiClient.post('/notifications/dnd/enable', settings)
  }

  async disableDoNotDisturb(): Promise<void> {
    return apiClient.post('/notifications/dnd/disable')
  }

  async getDoNotDisturbStatus(): Promise<{
    enabled: boolean
    activeUntil?: string
    settings?: DoNotDisturbSettings
  }> {
    return apiClient.get('/notifications/dnd/status')
  }

  // Import/Export preferences
  async exportPreferences(): Promise<Blob> {
    return apiClient.get('/notifications/preferences/export', {
      responseType: 'blob'
    })
  }

  async importPreferences(file: File): Promise<NotificationPreferences> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/notifications/preferences/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

const notificationService = new NotificationService()
export default notificationService
export { NotificationService }