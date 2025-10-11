// UX Optimization System - Team X2 User Experience
import { debounce, throttle } from 'lodash-es'

export interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'hover' | 'focus' | 'navigation'
  element: string
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
}

export interface UXMetrics {
  timeToInteractive: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  userEngagement: number
  taskCompletionRate: number
  errorRate: number
}

export class UXOptimizer {
  private interactions: UserInteraction[] = []
  private metrics: Partial<UXMetrics> = {}
  private observers: Map<string, any> = new Map()
  private startTime: number = Date.now()

  constructor() {
    this.setupObservers()
    this.trackUserEngagement()
  }

  private setupObservers() {
    if (typeof window === 'undefined') return

    // Performance observers for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)

      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.metrics.cumulativeLayoutShift = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    }

    // Intersection Observer for visibility tracking
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.trackInteraction({
            type: 'scroll',
            element: entry.target.tagName.toLowerCase(),
            timestamp: Date.now(),
            metadata: {
              intersectionRatio: entry.intersectionRatio,
              boundingRect: entry.boundingClientRect
            }
          })
        }
      })
    }, { threshold: [0.1, 0.5, 0.9] })
    this.observers.set('visibility', visibilityObserver)

    // Mutation Observer for DOM changes
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.trackInteraction({
            type: 'navigation',
            element: 'dom',
            timestamp: Date.now(),
            metadata: {
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes.length
            }
          })
        }
      })
    })
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
    this.observers.set('mutation', mutationObserver)
  }

  private trackUserEngagement() {
    if (typeof window === 'undefined') return

    let engagementScore = 0
    let lastActivity = Date.now()

    // Track mouse movement
    const trackMouseMovement = throttle(() => {
      engagementScore += 1
      lastActivity = Date.now()
    }, 1000)

    // Track keyboard activity
    const trackKeyboard = () => {
      engagementScore += 2
      lastActivity = Date.now()
    }

    // Track scroll activity
    const trackScroll = throttle(() => {
      engagementScore += 1
      lastActivity = Date.now()
    }, 500)

    // Track clicks
    const trackClick = (event: MouseEvent) => {
      engagementScore += 3
      lastActivity = Date.now()
      
      this.trackInteraction({
        type: 'click',
        element: (event.target as Element)?.tagName?.toLowerCase() || 'unknown',
        timestamp: Date.now(),
        metadata: {
          x: event.clientX,
          y: event.clientY,
          button: event.button
        }
      })
    }

    // Add event listeners
    document.addEventListener('mousemove', trackMouseMovement)
    document.addEventListener('keydown', trackKeyboard)
    document.addEventListener('scroll', trackScroll)
    document.addEventListener('click', trackClick)

    // Calculate engagement score periodically
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity
      const totalTime = Date.now() - this.startTime
      
      // Reduce score if user is inactive
      if (timeSinceLastActivity > 30000) { // 30 seconds
        engagementScore = Math.max(0, engagementScore - 1)
      }

      // Calculate engagement rate (0-100)
      this.metrics.userEngagement = Math.min(100, (engagementScore / (totalTime / 60000)) * 10)
    }, 5000)
  }

  trackInteraction(interaction: UserInteraction) {
    this.interactions.push(interaction)
    
    // Keep only last 1000 interactions
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000)
    }
  }

  // Analyze user behavior patterns
  analyzeUserBehavior(): {
    mostClickedElements: Array<{ element: string; count: number }>
    averageSessionTime: number
    bounceRate: number
    conversionFunnel: Array<{ step: string; completionRate: number }>
    usabilityIssues: string[]
  } {
    const clicks = this.interactions.filter(i => i.type === 'click')
    const elementCounts = clicks.reduce((acc, click) => {
      acc[click.element] = (acc[click.element] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostClickedElements = Object.entries(elementCounts)
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const sessionTime = Date.now() - this.startTime
    const averageSessionTime = sessionTime / 60000 // minutes

    // Simple bounce rate calculation
    const navigationEvents = this.interactions.filter(i => i.type === 'navigation')
    const bounceRate = navigationEvents.length < 2 ? 100 : 0

    // Analyze conversion funnel (simplified)
    const conversionFunnel = [
      { step: 'Landing', completionRate: 100 },
      { step: 'Engagement', completionRate: this.metrics.userEngagement || 0 },
      { step: 'Action', completionRate: clicks.length > 5 ? 80 : 20 },
      { step: 'Completion', completionRate: clicks.length > 10 ? 60 : 10 }
    ]

    // Identify usability issues
    const usabilityIssues: string[] = []
    
    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      usabilityIssues.push('High input delay detected')
    }
    
    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.1) {
      usabilityIssues.push('Layout shift issues detected')
    }
    
    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 2500) {
      usabilityIssues.push('Slow content loading detected')
    }
    
    if (clicks.length < 3 && sessionTime > 30000) {
      usabilityIssues.push('Low user engagement detected')
    }

    return {
      mostClickedElements,
      averageSessionTime,
      bounceRate,
      conversionFunnel,
      usabilityIssues
    }
  }

  // A/B testing framework
  runABTest(testName: string, variants: string[], userSegment?: string): string {
    const userId = this.getUserId()
    const hash = this.hashString(`${testName}-${userId}`)
    const variantIndex = hash % variants.length
    const selectedVariant = variants[variantIndex]

    // Track test participation
    this.trackInteraction({
      type: 'navigation',
      element: 'ab-test',
      timestamp: Date.now(),
      metadata: {
        testName,
        variant: selectedVariant,
        userSegment
      }
    })

    return selectedVariant
  }

  // Personalization engine
  getPersonalizedContent(contentType: string): any {
    const behavior = this.analyzeUserBehavior()
    const preferences = this.getUserPreferences()

    // Simple personalization logic
    if (contentType === 'dashboard') {
      if (behavior.mostClickedElements[0]?.element === 'customer') {
        return { layout: 'customer-focused', widgets: ['customers', 'visits', 'revenue'] }
      } else if (behavior.mostClickedElements[0]?.element === 'visit') {
        return { layout: 'visit-focused', widgets: ['visits', 'schedule', 'maps'] }
      }
    }

    return { layout: 'default', widgets: ['overview', 'recent', 'stats'] }
  }

  // Accessibility optimizer
  optimizeAccessibility(): {
    issues: Array<{ type: string; element: string; severity: 'low' | 'medium' | 'high' }>
    recommendations: string[]
  } {
    const issues: Array<{ type: string; element: string; severity: 'low' | 'medium' | 'high' }> = []
    const recommendations: string[] = []

    if (typeof document === 'undefined') {
      return { issues, recommendations }
    }

    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])')
    images.forEach(img => {
      issues.push({
        type: 'missing-alt-text',
        element: img.tagName.toLowerCase(),
        severity: 'high'
      })
    })

    // Check for low contrast (simplified)
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button)
      const bgColor = styles.backgroundColor
      const textColor = styles.color
      
      // Simplified contrast check
      if (bgColor === textColor) {
        issues.push({
          type: 'low-contrast',
          element: 'button',
          severity: 'medium'
        })
      }
    })

    // Check for keyboard navigation
    const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]')
    let hasTabIndex = false
    focusableElements.forEach(el => {
      if (el.getAttribute('tabindex')) {
        hasTabIndex = true
      }
    })

    if (!hasTabIndex && focusableElements.length > 5) {
      recommendations.push('Consider adding tabindex for better keyboard navigation')
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push('Fix accessibility issues to improve user experience')
    }

    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      recommendations.push('Optimize JavaScript to reduce input delay')
    }

    return { issues, recommendations }
  }

  // Performance recommendations
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 2500) {
      recommendations.push('Optimize images and critical resources to improve LCP')
    }

    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      recommendations.push('Reduce JavaScript execution time to improve FID')
    }

    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Add size attributes to images and reserve space for dynamic content')
    }

    const behavior = this.analyzeUserBehavior()
    if (behavior.usabilityIssues.length > 0) {
      recommendations.push(...behavior.usabilityIssues.map(issue => `Address: ${issue}`))
    }

    return recommendations
  }

  // Helper methods
  private getUserId(): string {
    if (typeof localStorage !== 'undefined') {
      let userId = localStorage.getItem('ux-user-id')
      if (!userId) {
        userId = Math.random().toString(36).substr(2, 9)
        localStorage.setItem('ux-user-id', userId)
      }
      return userId
    }
    return 'anonymous'
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private getUserPreferences(): Record<string, any> {
    if (typeof localStorage !== 'undefined') {
      const prefs = localStorage.getItem('user-preferences')
      return prefs ? JSON.parse(prefs) : {}
    }
    return {}
  }

  // Get current metrics
  getMetrics(): UXMetrics {
    const behavior = this.analyzeUserBehavior()
    
    return {
      timeToInteractive: this.metrics.timeToInteractive || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      userEngagement: this.metrics.userEngagement || 0,
      taskCompletionRate: behavior.conversionFunnel[3]?.completionRate || 0,
      errorRate: 0 // Would be calculated from error tracking
    }
  }

  // Export data for analysis
  exportData(): {
    interactions: UserInteraction[]
    metrics: UXMetrics
    behavior: ReturnType<typeof this.analyzeUserBehavior>
    accessibility: ReturnType<typeof this.optimizeAccessibility>
  } {
    return {
      interactions: this.interactions,
      metrics: this.getMetrics(),
      behavior: this.analyzeUserBehavior(),
      accessibility: this.optimizeAccessibility()
    }
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => {
      if (observer.disconnect) {
        observer.disconnect()
      }
    })
    this.observers.clear()
  }
}

// Smart loading system
export class SmartLoader {
  private loadingStates: Map<string, boolean> = new Map()
  private priorities: Map<string, number> = new Map()
  private queue: Array<{ id: string; loader: () => Promise<any>; priority: number }> = []
  private maxConcurrent: number = 3
  private currentLoading: number = 0

  // Add item to loading queue
  add(id: string, loader: () => Promise<any>, priority: number = 1): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        loader: async () => {
          try {
            const result = await loader()
            resolve(result)
            return result
          } catch (error) {
            reject(error)
            throw error
          }
        },
        priority
      })

      // Sort by priority
      this.queue.sort((a, b) => b.priority - a.priority)
      
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.currentLoading >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const item = this.queue.shift()!
    this.currentLoading++
    this.loadingStates.set(item.id, true)

    try {
      await item.loader()
    } finally {
      this.currentLoading--
      this.loadingStates.set(item.id, false)
      
      // Process next item
      setTimeout(() => this.processQueue(), 0)
    }
  }

  isLoading(id: string): boolean {
    return this.loadingStates.get(id) || false
  }

  getQueueLength(): number {
    return this.queue.length
  }

  clear() {
    this.queue = []
    this.loadingStates.clear()
  }
}

// Create singleton instances
export const uxOptimizer = new UXOptimizer()
export const smartLoader = new SmartLoader()

// React hooks for UX optimization
export function useUXOptimization() {
  const [metrics, setMetrics] = React.useState<UXMetrics>()
  const [recommendations, setRecommendations] = React.useState<string[]>([])

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(uxOptimizer.getMetrics())
      setRecommendations(uxOptimizer.getPerformanceRecommendations())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return { metrics, recommendations }
}

export function useABTest(testName: string, variants: string[], userSegment?: string) {
  const [variant, setVariant] = React.useState<string>()

  React.useEffect(() => {
    const selectedVariant = uxOptimizer.runABTest(testName, variants, userSegment)
    setVariant(selectedVariant)
  }, [testName, variants.join(','), userSegment])

  return variant
}

export function usePersonalization(contentType: string) {
  const [content, setContent] = React.useState<any>()

  React.useEffect(() => {
    const personalizedContent = uxOptimizer.getPersonalizedContent(contentType)
    setContent(personalizedContent)
  }, [contentType])

  return content
}