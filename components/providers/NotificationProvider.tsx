'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface NotificationContextType {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  showNotification: (title: string, options?: NotificationOptions) => void
  subscribeToNotifications: () => Promise<void>
  unsubscribeFromNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications')
      return 'denied'
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    
    if (result === 'granted') {
      toast.success('Notifications enabled!')
    } else {
      toast.error('Notifications denied')
    }
    
    return result
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options,
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } else {
      // Fallback to toast notification
      toast(title, {
        icon: options?.icon || '🔔',
      })
    }
  }

  const subscribeToNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        // Send subscription to server
        // await apiClient.post('/notifications/subscribe', subscription)
        
        toast.success('Push notifications enabled!')
      } catch (error) {
        console.error('Failed to subscribe to notifications:', error)
        toast.error('Failed to enable push notifications')
      }
    }
  }

  const unsubscribeFromNotifications = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          await subscription.unsubscribe()
          // await apiClient.post('/notifications/unsubscribe', { endpoint: subscription.endpoint })
          toast.success('Push notifications disabled')
        }
      } catch (error) {
        console.error('Failed to unsubscribe from notifications:', error)
        toast.error('Failed to disable push notifications')
      }
    }
  }

  const value: NotificationContextType = {
    permission,
    requestPermission,
    showNotification,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}