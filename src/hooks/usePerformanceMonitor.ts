'use client'

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  componentName: string
  renderTime: number
  timestamp: number
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now())
  const mountTime = useRef<number>(Date.now())

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current
    const totalTime = Date.now() - mountTime.current

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Performance [${componentName}]:`, {
        renderTime: `${renderTime}ms`,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      })
    }

    // Send metrics to monitoring service in production
    if (process.env.NODE_ENV === 'production' && renderTime > 100) {
      // Only log slow renders (>100ms)
      const metrics: PerformanceMetrics = {
        componentName,
        renderTime,
        timestamp: Date.now()
      }
      
      // You can send this to your monitoring service
      // Example: analytics.track('slow_render', metrics)
      console.warn('Slow render detected:', metrics)
    }
  })

  // Reset timer on each render
  renderStartTime.current = Date.now()
}

export const useApiPerformanceMonitor = () => {
  const trackApiCall = (endpoint: string, startTime: number, success: boolean, error?: string) => {
    const duration = Date.now() - startTime
    
    const metrics = {
      endpoint,
      duration,
      success,
      error,
      timestamp: Date.now()
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Performance [${endpoint}]:`, {
        duration: `${duration}ms`,
        success,
        error: error || 'none'
      })
    }

    // Log slow API calls or errors
    if (duration > 2000 || !success) {
      console.warn('API Performance Issue:', metrics)
      // Send to monitoring service in production
      // analytics.track('api_performance', metrics)
    }
  }

  return { trackApiCall }
}

export const useMemoryMonitor = (componentName: string) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Memory [${componentName}]:`, {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        })
      }

      // Warn if memory usage is high
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      if (usagePercent > 80) {
        console.warn(`High memory usage detected in ${componentName}: ${usagePercent.toFixed(1)}%`)
      }
    }
  }, [componentName])
}

export default usePerformanceMonitor