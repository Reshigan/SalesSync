// Advanced Security Scanner & Vulnerability Assessment
export interface SecurityVulnerability {
  id: string
  type: 'xss' | 'csrf' | 'injection' | 'auth' | 'data_exposure' | 'insecure_transport' | 'weak_crypto'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: string
  evidence?: string
  recommendation: string
  cwe?: string
  cvss?: number
  detected_at: string
}

export interface SecurityScanResult {
  scan_id: string
  timestamp: string
  duration: number
  vulnerabilities: SecurityVulnerability[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  compliance: {
    owasp_top10: boolean
    gdpr: boolean
    hipaa: boolean
    pci_dss: boolean
  }
  recommendations: string[]
}

export interface SecurityPolicy {
  id: string
  name: string
  description: string
  rules: SecurityRule[]
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityRule {
  id: string
  type: 'input_validation' | 'output_encoding' | 'authentication' | 'authorization' | 'session' | 'crypto'
  pattern: string | RegExp
  action: 'block' | 'warn' | 'log'
  message: string
}

class SecurityScanner {
  private vulnerabilities: SecurityVulnerability[] = []
  private policies: SecurityPolicy[] = []
  private scanHistory: SecurityScanResult[] = []

  constructor() {
    this.initializeDefaultPolicies()
    this.setupSecurityHeaders()
    this.startContinuousMonitoring()
  }

  // Initialize default security policies
  private initializeDefaultPolicies() {
    this.policies = [
      {
        id: 'xss-protection',
        name: 'XSS Protection',
        description: 'Detect and prevent Cross-Site Scripting attacks',
        enabled: true,
        severity: 'high',
        rules: [
          {
            id: 'script-injection',
            type: 'input_validation',
            pattern: /<script[^>]*>.*?<\/script>/gi,
            action: 'block',
            message: 'Script injection attempt detected'
          },
          {
            id: 'event-handler-injection',
            type: 'input_validation',
            pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
            action: 'block',
            message: 'Event handler injection attempt detected'
          },
          {
            id: 'javascript-protocol',
            type: 'input_validation',
            pattern: /javascript:/gi,
            action: 'block',
            message: 'JavaScript protocol usage detected'
          }
        ]
      },
      {
        id: 'sql-injection-protection',
        name: 'SQL Injection Protection',
        description: 'Detect SQL injection attempts',
        enabled: true,
        severity: 'critical',
        rules: [
          {
            id: 'sql-keywords',
            type: 'input_validation',
            pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            action: 'warn',
            message: 'SQL keywords detected in input'
          },
          {
            id: 'sql-comments',
            type: 'input_validation',
            pattern: /(--|\/\*|\*\/|#)/g,
            action: 'warn',
            message: 'SQL comment syntax detected'
          }
        ]
      },
      {
        id: 'csrf-protection',
        name: 'CSRF Protection',
        description: 'Cross-Site Request Forgery protection',
        enabled: true,
        severity: 'high',
        rules: [
          {
            id: 'missing-csrf-token',
            type: 'authentication',
            pattern: '',
            action: 'block',
            message: 'CSRF token missing or invalid'
          }
        ]
      },
      {
        id: 'weak-authentication',
        name: 'Weak Authentication Detection',
        description: 'Detect weak authentication patterns',
        enabled: true,
        severity: 'medium',
        rules: [
          {
            id: 'weak-password',
            type: 'authentication',
            pattern: /^.{1,7}$/,
            action: 'warn',
            message: 'Password too short (minimum 8 characters required)'
          },
          {
            id: 'common-passwords',
            type: 'authentication',
            pattern: /^(password|123456|admin|root|guest)$/i,
            action: 'block',
            message: 'Common password detected'
          }
        ]
      },
      {
        id: 'data-exposure',
        name: 'Data Exposure Detection',
        description: 'Detect potential data exposure vulnerabilities',
        enabled: true,
        severity: 'high',
        rules: [
          {
            id: 'sensitive-data-in-url',
            type: 'data_exposure',
            pattern: /(password|token|key|secret|ssn|credit)/i,
            action: 'warn',
            message: 'Sensitive data detected in URL'
          },
          {
            id: 'email-exposure',
            type: 'data_exposure',
            pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            action: 'log',
            message: 'Email address detected in output'
          }
        ]
      }
    ]
  }

  // Setup security headers
  private setupSecurityHeaders() {
    if (typeof document === 'undefined') return

    // Content Security Policy
    const cspMeta = document.createElement('meta')
    cspMeta.httpEquiv = 'Content-Security-Policy'
    cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: ws:; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';"
    document.head.appendChild(cspMeta)

    // X-Frame-Options
    const frameMeta = document.createElement('meta')
    frameMeta.httpEquiv = 'X-Frame-Options'
    frameMeta.content = 'DENY'
    document.head.appendChild(frameMeta)

    // X-Content-Type-Options
    const contentTypeMeta = document.createElement('meta')
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options'
    contentTypeMeta.content = 'nosniff'
    document.head.appendChild(contentTypeMeta)
  }

  // Start continuous security monitoring
  private startContinuousMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor DOM mutations for potential XSS
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node as Element)
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover']
    })

    // Monitor network requests
    this.interceptNetworkRequests()

    // Monitor localStorage/sessionStorage access
    this.monitorStorageAccess()

    // Periodic security scans
    setInterval(() => {
      this.performAutomaticScan()
    }, 300000) // Every 5 minutes
  }

  // Scan individual DOM element
  private scanElement(element: Element) {
    const vulnerabilities: SecurityVulnerability[] = []

    // Check for dangerous attributes
    const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
    dangerousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          type: 'xss',
          severity: 'high',
          title: 'Inline Event Handler Detected',
          description: `Element contains inline event handler: ${attr}`,
          location: element.tagName.toLowerCase(),
          evidence: element.getAttribute(attr) || '',
          recommendation: 'Use addEventListener instead of inline event handlers',
          cwe: 'CWE-79',
          detected_at: new Date().toISOString()
        })
      }
    })

    // Check for script tags
    if (element.tagName.toLowerCase() === 'script') {
      const src = element.getAttribute('src')
      const content = element.textContent || ''

      if (!src && content) {
        vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          type: 'xss',
          severity: 'critical',
          title: 'Inline Script Detected',
          description: 'Inline script tag found in DOM',
          location: 'script',
          evidence: content.substring(0, 100),
          recommendation: 'Move scripts to external files and use CSP',
          cwe: 'CWE-79',
          detected_at: new Date().toISOString()
        })
      }

      if (src && !this.isAllowedScriptSource(src)) {
        vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          type: 'xss',
          severity: 'high',
          title: 'Untrusted Script Source',
          description: `Script loaded from untrusted source: ${src}`,
          location: 'script',
          evidence: src,
          recommendation: 'Only load scripts from trusted domains',
          cwe: 'CWE-79',
          detected_at: new Date().toISOString()
        })
      }
    }

    this.vulnerabilities.push(...vulnerabilities)
  }

  // Check if script source is allowed
  private isAllowedScriptSource(src: string): boolean {
    const allowedDomains = [
      'localhost',
      'salessync.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdnjs.cloudflare.com'
    ]

    try {
      const url = new URL(src, window.location.origin)
      return allowedDomains.some(domain => url.hostname.endsWith(domain))
    } catch {
      return false
    }
  }

  // Intercept network requests for security analysis
  private interceptNetworkRequests() {
    if (typeof window === 'undefined') return

    // Intercept fetch requests
    const originalFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      
      // Check for insecure HTTP requests
      if (url.startsWith('http://') && !url.includes('localhost')) {
        this.vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          type: 'insecure_transport',
          severity: 'medium',
          title: 'Insecure HTTP Request',
          description: `HTTP request to: ${url}`,
          location: 'network',
          evidence: url,
          recommendation: 'Use HTTPS for all external requests',
          cwe: 'CWE-319',
          detected_at: new Date().toISOString()
        })
      }

      // Check for sensitive data in URL
      if (this.containsSensitiveData(url)) {
        this.vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          type: 'data_exposure',
          severity: 'high',
          title: 'Sensitive Data in URL',
          description: 'URL contains potentially sensitive information',
          location: 'network',
          evidence: url,
          recommendation: 'Use POST requests for sensitive data',
          cwe: 'CWE-200',
          detected_at: new Date().toISOString()
        })
      }

      return originalFetch(input, init)
    }

    // Intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest
    window.XMLHttpRequest = class extends originalXHR {
      open(method: string, url: string | URL, ...args: any[]) {
        const urlString = url.toString()
        
        if (urlString.startsWith('http://') && !urlString.includes('localhost')) {
          this.vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'insecure_transport',
            severity: 'medium',
            title: 'Insecure XHR Request',
            description: `HTTP XHR request to: ${urlString}`,
            location: 'network',
            evidence: urlString,
            recommendation: 'Use HTTPS for all external requests',
            cwe: 'CWE-319',
            detected_at: new Date().toISOString()
          })
        }

        return super.open(method, url, ...args)
      }
    } as any
  }

  // Monitor localStorage and sessionStorage access
  private monitorStorageAccess() {
    if (typeof window === 'undefined') return

    const monitorStorage = (storage: Storage, name: string) => {
      const originalSetItem = storage.setItem
      storage.setItem = (key: string, value: string) => {
        if (this.containsSensitiveData(value)) {
          this.vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'data_exposure',
            severity: 'medium',
            title: `Sensitive Data in ${name}`,
            description: `Potentially sensitive data stored in ${name}`,
            location: 'storage',
            evidence: `Key: ${key}`,
            recommendation: `Encrypt sensitive data before storing in ${name}`,
            cwe: 'CWE-312',
            detected_at: new Date().toISOString()
          })
        }
        return originalSetItem.call(storage, key, value)
      }
    }

    monitorStorage(localStorage, 'localStorage')
    monitorStorage(sessionStorage, 'sessionStorage')
  }

  // Check if data contains sensitive information
  private containsSensitiveData(data: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /ssn/i,
      /credit.*card/i,
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card pattern
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ // Email pattern
    ]

    return sensitivePatterns.some(pattern => pattern.test(data))
  }

  // Perform comprehensive security scan
  async performSecurityScan(): Promise<SecurityScanResult> {
    const startTime = Date.now()
    const scanId = this.generateScanId()
    
    this.vulnerabilities = [] // Reset vulnerabilities

    // Scan DOM
    this.scanDOM()

    // Scan JavaScript
    await this.scanJavaScript()

    // Scan network security
    this.scanNetworkSecurity()

    // Scan storage security
    this.scanStorageSecurity()

    // Check compliance
    const compliance = this.checkCompliance()

    const duration = Date.now() - startTime
    const summary = this.generateSummary()

    const result: SecurityScanResult = {
      scan_id: scanId,
      timestamp: new Date().toISOString(),
      duration,
      vulnerabilities: [...this.vulnerabilities],
      summary,
      compliance,
      recommendations: this.generateRecommendations()
    }

    this.scanHistory.push(result)
    return result
  }

  // Scan DOM for security issues
  private scanDOM() {
    if (typeof document === 'undefined') return

    // Scan all elements
    const allElements = document.querySelectorAll('*')
    allElements.forEach(element => {
      this.scanElement(element)
    })

    // Check for forms without CSRF protection
    const forms = document.querySelectorAll('form')
    forms.forEach(form => {
      const csrfToken = form.querySelector('input[name="csrf_token"], input[name="_token"]')
      if (!csrfToken) {
        this.vulnerabilities.push({
          id: this.generateVulnerabilityId(),
          type: 'csrf',
          severity: 'high',
          title: 'Missing CSRF Protection',
          description: 'Form lacks CSRF token protection',
          location: 'form',
          evidence: form.action || 'No action specified',
          recommendation: 'Add CSRF token to all forms',
          cwe: 'CWE-352',
          detected_at: new Date().toISOString()
        })
      }
    })
  }

  // Scan JavaScript for security issues
  private async scanJavaScript() {
    if (typeof window === 'undefined') return

    // Check for eval usage
    const originalEval = window.eval
    let evalUsed = false
    window.eval = (...args) => {
      evalUsed = true
      return originalEval.apply(window, args)
    }

    // Check for dangerous functions
    const dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval']
    dangerousFunctions.forEach(funcName => {
      if (typeof (window as any)[funcName] === 'function') {
        // This is a simplified check - in practice, you'd need more sophisticated analysis
        console.warn(`Potentially dangerous function available: ${funcName}`)
      }
    })

    if (evalUsed) {
      this.vulnerabilities.push({
        id: this.generateVulnerabilityId(),
        type: 'xss',
        severity: 'high',
        title: 'Eval Usage Detected',
        description: 'Use of eval() function detected',
        location: 'javascript',
        evidence: 'eval() called',
        recommendation: 'Avoid using eval() - use safer alternatives',
        cwe: 'CWE-95',
        detected_at: new Date().toISOString()
      })
    }
  }

  // Scan network security
  private scanNetworkSecurity() {
    if (typeof window === 'undefined') return

    // Check if running over HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      this.vulnerabilities.push({
        id: this.generateVulnerabilityId(),
        type: 'insecure_transport',
        severity: 'high',
        title: 'Insecure Transport',
        description: 'Application not served over HTTPS',
        location: 'transport',
        evidence: window.location.protocol,
        recommendation: 'Use HTTPS for all production deployments',
        cwe: 'CWE-319',
        detected_at: new Date().toISOString()
      })
    }

    // Check for mixed content
    const images = document.querySelectorAll('img[src^="http:"]')
    if (images.length > 0) {
      this.vulnerabilities.push({
        id: this.generateVulnerabilityId(),
        type: 'insecure_transport',
        severity: 'medium',
        title: 'Mixed Content',
        description: `${images.length} images loaded over HTTP`,
        location: 'content',
        evidence: `${images.length} HTTP images`,
        recommendation: 'Load all resources over HTTPS',
        cwe: 'CWE-319',
        detected_at: new Date().toISOString()
      })
    }
  }

  // Scan storage security
  private scanStorageSecurity() {
    if (typeof window === 'undefined') return

    // Check localStorage for sensitive data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        if (this.containsSensitiveData(key) || this.containsSensitiveData(value)) {
          this.vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'data_exposure',
            severity: 'medium',
            title: 'Sensitive Data in localStorage',
            description: 'Potentially sensitive data found in localStorage',
            location: 'storage',
            evidence: `Key: ${key}`,
            recommendation: 'Encrypt sensitive data or use secure storage',
            cwe: 'CWE-312',
            detected_at: new Date().toISOString()
          })
        }
      }
    }

    // Check sessionStorage for sensitive data
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        const value = sessionStorage.getItem(key) || ''
        if (this.containsSensitiveData(key) || this.containsSensitiveData(value)) {
          this.vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'data_exposure',
            severity: 'medium',
            title: 'Sensitive Data in sessionStorage',
            description: 'Potentially sensitive data found in sessionStorage',
            location: 'storage',
            evidence: `Key: ${key}`,
            recommendation: 'Encrypt sensitive data or use secure storage',
            cwe: 'CWE-312',
            detected_at: new Date().toISOString()
          })
        }
      }
    }
  }

  // Check compliance with security standards
  private checkCompliance() {
    const owaspTop10 = this.checkOWASPTop10Compliance()
    const gdpr = this.checkGDPRCompliance()
    const hipaa = this.checkHIPAACompliance()
    const pciDss = this.checkPCIDSSCompliance()

    return {
      owasp_top10: owaspTop10,
      gdpr,
      hipaa,
      pci_dss: pciDss
    }
  }

  // Check OWASP Top 10 compliance
  private checkOWASPTop10Compliance(): boolean {
    const owaspVulnerabilities = this.vulnerabilities.filter(v => 
      ['xss', 'injection', 'auth', 'data_exposure', 'insecure_transport'].includes(v.type)
    )
    return owaspVulnerabilities.length === 0
  }

  // Check GDPR compliance
  private checkGDPRCompliance(): boolean {
    // Simplified GDPR check
    const dataExposureVulns = this.vulnerabilities.filter(v => v.type === 'data_exposure')
    return dataExposureVulns.length === 0
  }

  // Check HIPAA compliance
  private checkHIPAACompliance(): boolean {
    // Simplified HIPAA check
    const transportVulns = this.vulnerabilities.filter(v => v.type === 'insecure_transport')
    const dataVulns = this.vulnerabilities.filter(v => v.type === 'data_exposure')
    return transportVulns.length === 0 && dataVulns.length === 0
  }

  // Check PCI DSS compliance
  private checkPCIDSSCompliance(): boolean {
    // Simplified PCI DSS check
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'critical')
    const highVulns = this.vulnerabilities.filter(v => v.severity === 'high')
    return criticalVulns.length === 0 && highVulns.length === 0
  }

  // Generate vulnerability summary
  private generateSummary() {
    const total = this.vulnerabilities.length
    const critical = this.vulnerabilities.filter(v => v.severity === 'critical').length
    const high = this.vulnerabilities.filter(v => v.severity === 'high').length
    const medium = this.vulnerabilities.filter(v => v.severity === 'medium').length
    const low = this.vulnerabilities.filter(v => v.severity === 'low').length

    return { total, critical, high, medium, low }
  }

  // Generate security recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.vulnerabilities.some(v => v.type === 'xss')) {
      recommendations.push('Implement Content Security Policy (CSP)')
      recommendations.push('Sanitize all user inputs')
      recommendations.push('Use output encoding for dynamic content')
    }

    if (this.vulnerabilities.some(v => v.type === 'csrf')) {
      recommendations.push('Implement CSRF tokens for all forms')
      recommendations.push('Use SameSite cookie attributes')
    }

    if (this.vulnerabilities.some(v => v.type === 'insecure_transport')) {
      recommendations.push('Use HTTPS for all communications')
      recommendations.push('Implement HTTP Strict Transport Security (HSTS)')
    }

    if (this.vulnerabilities.some(v => v.type === 'data_exposure')) {
      recommendations.push('Encrypt sensitive data at rest')
      recommendations.push('Implement proper access controls')
      recommendations.push('Use secure storage mechanisms')
    }

    if (this.vulnerabilities.some(v => v.type === 'auth')) {
      recommendations.push('Implement strong password policies')
      recommendations.push('Use multi-factor authentication')
      recommendations.push('Implement account lockout mechanisms')
    }

    return recommendations
  }

  // Perform automatic security scan
  private async performAutomaticScan() {
    try {
      const result = await this.performSecurityScan()
      
      // Log critical vulnerabilities
      const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical')
      if (criticalVulns.length > 0) {
        console.error('Critical security vulnerabilities detected:', criticalVulns)
      }

      // Send to monitoring service
      this.sendToMonitoring(result)
    } catch (error) {
      console.error('Security scan failed:', error)
    }
  }

  // Send scan results to monitoring service
  private sendToMonitoring(result: SecurityScanResult) {
    // In a real implementation, this would send to your monitoring service
    if (result.summary.critical > 0 || result.summary.high > 0) {
      console.warn('Security vulnerabilities detected:', result.summary)
    }
  }

  // Validate input against security policies
  validateInput(input: string, context: string = 'general'): {
    isValid: boolean
    violations: Array<{ rule: string; message: string; severity: string }>
  } {
    const violations: Array<{ rule: string; message: string; severity: string }> = []

    this.policies.forEach(policy => {
      if (!policy.enabled) return

      policy.rules.forEach(rule => {
        if (rule.type === 'input_validation') {
          const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'gi') : rule.pattern
          if (pattern.test(input)) {
            violations.push({
              rule: rule.id,
              message: rule.message,
              severity: policy.severity
            })
          }
        }
      })
    })

    return {
      isValid: violations.length === 0,
      violations
    }
  }

  // Get scan history
  getScanHistory(): SecurityScanResult[] {
    return [...this.scanHistory]
  }

  // Get current vulnerabilities
  getCurrentVulnerabilities(): SecurityVulnerability[] {
    return [...this.vulnerabilities]
  }

  // Generate unique IDs
  private generateVulnerabilityId(): string {
    return `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Create singleton instance
const securityScanner = new SecurityScanner()
export default securityScanner