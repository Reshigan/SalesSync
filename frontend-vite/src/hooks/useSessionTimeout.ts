import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/auth.store'

const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000 // Show warning 5 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const

export function useSessionTimeout(onWarning?: () => void) {
  const { isAuthenticated, logout } = useAuthStore()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
  }, [])

  const resetTimers = useCallback(() => {
    clearTimers()
    lastActivityRef.current = Date.now()

    warningRef.current = setTimeout(() => {
      onWarning?.()
    }, IDLE_TIMEOUT - WARNING_BEFORE)

    timeoutRef.current = setTimeout(() => {
      logout()
    }, IDLE_TIMEOUT)
  }, [clearTimers, logout, onWarning])

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers()
      return
    }

    resetTimers()

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current > 1000) {
        resetTimers()
      }
    }

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, resetTimers, clearTimers])

  return {
    resetTimers,
    getIdleTime: () => Date.now() - lastActivityRef.current,
  }
}
