// Comprehensive monitoring and logging service
interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: string
  level: keyof LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  stack?: string
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: string
  tags?: Record<string, string>
}

interface ErrorReport {
  message: string
  stack?: string
  url: string
  lineNumber?: number
  columnNumber?: number
  timestamp: string
  userId?: string
  sessionId?: string
  userAgent?: string
  context?: Record<string, any>
}

interface UserAction {
  action: string
  timestamp: string
  userId?: string
  sessionId?: string
  context?: Record<string, any>
  duration?: number
}

class MonitoringService {
  private apiUrl: string
  private sessionId: string
  private userId?: string
  private logBuffer: LogEntry[] = []
  private metricsBuffer: PerformanceMetric[] = []
  private errorBuffer: ErrorReport[] = []
  private actionBuffer: UserAction[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private performanceObserver?: PerformanceObserver

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    this.sessionId = this.generateSessionId()
    
    // Initialize monitoring
    this.initializeErrorHandling()
    this.initializePerformanceMonitoring()
    this.startPeriodicFlush()
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // Track beforeunload for final flush
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
  }

  // Initialize global error handling
  private initializeErrorHandling() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: new Date().toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        context: {
          type: 'javascript_error',
          source: event.filename
        }
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        context: {
          type: 'promise_rejection',
          reason: event.reason
        }
      })
    })

    // Handle React error boundaries (if using React)
    if (typeof window !== 'undefined' && (window as any).React) {
      const originalConsoleError = console.error
      console.error = (...args) => {
        // Check if this is a React error
        const errorMessage = args[0]
        if (typeof errorMessage === 'string' && errorMessage.includes('React')) {
          this.reportError({
            message: errorMessage,
            timestamp: new Date().toISOString(),
            userId: this.userId,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            context: {
              type: 'react_error',
              args: args.slice(1)
            }
          })
        }
        originalConsoleError.apply(console, args)
      }
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals()
    
    // Monitor resource loading
    this.observeResourceTiming()
    
    // Monitor navigation timing
    this.observeNavigationTiming()
    
    // Monitor long tasks
    this.observeLongTasks()
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric({
        name: 'web_vitals_lcp',
        value: lastEntry.startTime,
        timestamp: new Date().toISOString(),
        tags: {
          type: 'core_web_vital',
          metric: 'lcp'
        }
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.recordMetric({
          name: 'web_vitals_fid',
          value: entry.processingStart - entry.startTime,
          timestamp: new Date().toISOString(),
          tags: {
            type: 'core_web_vital',
            metric: 'fid'
          }
        })
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      this.recordMetric({
        name: 'web_vitals_cls',
        value: clsValue,
        timestamp: new Date().toISOString(),
        tags: {
          type: 'core_web_vital',
          metric: 'cls'
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }

  private observeResourceTiming() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.recordMetric({
          name: 'resource_timing',
          value: entry.duration,
          timestamp: new Date().toISOString(),
          tags: {
            type: 'resource',
            name: entry.name,
            initiatorType: entry.initiatorType,
            transferSize: entry.transferSize?.toString()
          }
        })
      })
    }).observe({ entryTypes: ['resource'] })
  }

  private observeNavigationTiming() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        // Record various navigation metrics
        const metrics = [
          { name: 'navigation_dns_lookup', value: entry.domainLookupEnd - entry.domainLookupStart },
          { name: 'navigation_tcp_connect', value: entry.connectEnd - entry.connectStart },
          { name: 'navigation_request', value: entry.responseStart - entry.requestStart },
          { name: 'navigation_response', value: entry.responseEnd - entry.responseStart },
          { name: 'navigation_dom_processing', value: entry.domComplete - entry.domLoading },
          { name: 'navigation_load_complete', value: entry.loadEventEnd - entry.loadEventStart }
        ]

        metrics.forEach(metric => {
          if (metric.value > 0) {
            this.recordMetric({
              name: metric.name,
              value: metric.value,
              timestamp: new Date().toISOString(),
              tags: {
                type: 'navigation',
                url: entry.name
              }
            })
          }
        })
      })
    }).observe({ entryTypes: ['navigation'] })
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.recordMetric({
              name: 'long_task',
              value: entry.duration,
              timestamp: new Date().toISOString(),
              tags: {
                type: 'performance',
                startTime: entry.startTime.toString()
              }
            })
          })
        }).observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long task observer not supported
        console.debug('Long task observer not supported')
      }
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Set user ID for tracking
  public setUserId(userId: string) {
    this.userId = userId
  }

  // Log messages with different levels
  public log(level: keyof LogLevel, message: string, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Add to buffer
    this.logBuffer.push(logEntry)

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level](message, context)
    }

    // Immediate flush for errors
    if (level === 'error') {
      this.flushLogs()
    }
  }

  public error(message: string, context?: Record<string, any>) {
    this.log('error', message, context)
  }

  public warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  public info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  public debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  // Record performance metrics
  public recordMetric(metric: PerformanceMetric) {
    this.metricsBuffer.push(metric)
  }

  // Report errors
  public reportError(error: ErrorReport) {
    this.errorBuffer.push(error)
    
    // Immediate flush for critical errors
    this.flushErrors()
  }

  // Track user actions
  public trackAction(action: string, context?: Record<string, any>, duration?: number) {
    const userAction: UserAction = {
      action,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      context,
      duration
    }

    this.actionBuffer.push(userAction)
  }

  // Track API calls
  public trackApiCall(method: string, url: string, duration: number, status: number, error?: string) {
    this.trackAction('api_call', {
      method,
      url,
      status,
      error,
      duration
    }, duration)

    this.recordMetric({
      name: 'api_call_duration',
      value: duration,
      timestamp: new Date().toISOString(),
      tags: {
        method,
        url,
        status: status.toString(),
        success: (status >= 200 && status < 300).toString()
      }
    })
  }

  // Track page views
  public trackPageView(path: string, title?: string) {
    this.trackAction('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer
    })
  }

  // Track feature usage
  public trackFeatureUsage(feature: string, context?: Record<string, any>) {
    this.trackAction('feature_usage', {
      feature,
      ...context
    })
  }

  // Start periodic flush
  private startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flushAll()
    }, 30000) // Flush every 30 seconds
  }

  // Handle visibility change
  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.flushAll()
    }
  }

  // Handle before unload
  private handleBeforeUnload() {
    this.flushAll()
  }

  // Flush all buffers
  private flushAll() {
    this.flushLogs()
    this.flushMetrics()
    this.flushErrors()
    this.flushActions()
  }

  // Flush logs
  private async flushLogs() {
    if (this.logBuffer.length === 0) return

    const logs = [...this.logBuffer]
    this.logBuffer = []

    try {
      await fetch(`${this.apiUrl}/api/monitoring/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      })
    } catch (error) {
      // Re-add logs to buffer if failed
      this.logBuffer.unshift(...logs)
      console.error('Failed to flush logs:', error)
    }
  }

  // Flush metrics
  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      await fetch(`${this.apiUrl}/api/monitoring/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metrics })
      })
    } catch (error) {
      // Re-add metrics to buffer if failed
      this.metricsBuffer.unshift(...metrics)
      console.error('Failed to flush metrics:', error)
    }
  }

  // Flush errors
  private async flushErrors() {
    if (this.errorBuffer.length === 0) return

    const errors = [...this.errorBuffer]
    this.errorBuffer = []

    try {
      await fetch(`${this.apiUrl}/api/monitoring/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors })
      })
    } catch (error) {
      // Re-add errors to buffer if failed
      this.errorBuffer.unshift(...errors)
      console.error('Failed to flush errors:', error)
    }
  }

  // Flush actions
  private async flushActions() {
    if (this.actionBuffer.length === 0) return

    const actions = [...this.actionBuffer]
    this.actionBuffer = []

    try {
      await fetch(`${this.apiUrl}/api/monitoring/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actions })
      })
    } catch (error) {
      // Re-add actions to buffer if failed
      this.actionBuffer.unshift(...actions)
      console.error('Failed to flush actions:', error)
    }
  }

  // Get current session info
  public getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
  }

  // Cleanup
  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    // Final flush
    this.flushAll()

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }
}

// Create singleton instance
const monitoringService = new MonitoringService()

export default monitoringService
export { MonitoringService, LogEntry, PerformanceMetric, ErrorReport, UserAction }