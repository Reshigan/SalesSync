'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  installApp: () => void
  updateAvailable: boolean
  updateApp: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      toast.success('SalesSync installed successfully!')
    }

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js')
          setRegistration(reg)

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                  toast('New version available! Click to update.', {
                    duration: 0,
                    icon: '🔄',
                  })
                }
              })
            }
          })

          console.log('Service Worker registered successfully')
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }

    checkInstalled()
    updateOnlineStatus()
    registerServiceWorker()

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        toast.success('Installing SalesSync...')
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  // Show offline notification
  useEffect(() => {
    if (!isOnline) {
      toast.error('You are offline. Some features may be limited.', {
        duration: 5000,
        icon: '📱',
      })
    } else {
      toast.success('Back online!', {
        duration: 2000,
        icon: '🌐',
      })
    }
  }, [isOnline])

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    updateAvailable,
    updateApp,
  }

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}