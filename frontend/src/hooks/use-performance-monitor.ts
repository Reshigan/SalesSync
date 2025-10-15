import { useEffect, useCallback } from 'react'

interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
}

export const usePerformanceMonitor = () => {
  const measurePerformance = useCallback(() => {
    if (typeof window === 'undefined') return

    // Measure page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart

    // Get Web Vitals
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              console.log('FCP:', entry.startTime)
            }
            break
          case 'largest-contentful-paint':
            console.log('LCP:', entry.startTime)
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              console.log('CLS:', (entry as any).value)
            }
            break
          case 'first-input':
            console.log('FID:', (entry as any).processingStart - entry.startTime)
            break
        }
      })
    })

    // Observe performance metrics
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] })
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      console.warn('Some performance metrics not supported:', e)
    }

    return {
      pageLoadTime,
      cleanup: () => observer.disconnect()
    }
  }, [])

  const logPerformanceMetrics = useCallback(() => {
    if (typeof window === 'undefined') return

    // Log bundle sizes
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const jsResources = resources.filter(r => r.name.includes('.js'))
    const cssResources = resources.filter(r => r.name.includes('.css'))
    
    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)

    console.group('Performance Metrics')
    console.log('Total JS Size:', (totalJSSize / 1024).toFixed(2), 'KB')
    console.log('Total CSS Size:', (totalCSSSize / 1024).toFixed(2), 'KB')
    console.log('JS Resources:', jsResources.length)
    console.log('CSS Resources:', cssResources.length)
    console.groupEnd()
  }, [])

  const reportSlowComponent = useCallback((componentName: string, renderTime: number) => {
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`Slow component detected: ${componentName} took ${renderTime.toFixed(2)}ms to render`)
    }
  }, [])

  useEffect(() => {
    const result = measurePerformance()
    
    // Log metrics after page load
    setTimeout(logPerformanceMetrics, 2000)

    return result?.cleanup
  }, [measurePerformance, logPerformanceMetrics])

  return {
    measurePerformance,
    logPerformanceMetrics,
    reportSlowComponent
  }
}

// Hook to measure component render time
export const useRenderTime = (componentName: string) => {
  const { reportSlowComponent } = usePerformanceMonitor()

  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      reportSlowComponent(componentName, renderTime)
    }
  }, [componentName, reportSlowComponent])
}

// Hook to detect slow network conditions
export const useNetworkStatus = () => {
  const getConnectionSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }, [])

  const isSlowConnection = useCallback(() => {
    const connection = getConnectionSpeed()
    if (!connection) return false
    
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.downlink < 1.5 ||
           connection.saveData
  }, [getConnectionSpeed])

  return {
    getConnectionSpeed,
    isSlowConnection
  }
}