// Comprehensive Audit Trail and Compliance Service
import apiClient from '@/lib/api-client'

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  userEmail: string
  action: string
  resource: string
  resourceId: string
  resourceType: 'USER' | 'CUSTOMER' | 'VISIT' | 'BOARD' | 'PRODUCT' | 'COMMISSION' | 'SYSTEM'
  method: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT'
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
  ipAddress: string
  userAgent: string
  location?: GeoLocation
  sessionId: string
  changes?: FieldChange[]
  metadata: Record<string, any>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  complianceFlags: string[]
  retention: RetentionInfo
}

export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
  dataType: string
  sensitive: boolean
}

export interface GeoLocation {
  country: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
}

export interface RetentionInfo {
  category: 'OPERATIONAL' | 'FINANCIAL' | 'SECURITY' | 'COMPLIANCE'
  retentionPeriod: number // days
  archiveDate: string
  purgeDate: string
  legalHold: boolean
}

export interface AuditFilter {
  userId?: string
  action?: string
  resource?: string
  resourceType?: AuditLog['resourceType']
  method?: AuditLog['method']
  status?: AuditLog['status']
  riskLevel?: AuditLog['riskLevel']
  dateFrom?: string
  dateTo?: string
  ipAddress?: string
  location?: string
  sessionId?: string
  complianceFlag?: string
  search?: string
}

export interface AuditReport {
  id: string
  name: string
  description: string
  type: 'COMPLIANCE' | 'SECURITY' | 'OPERATIONAL' | 'FINANCIAL' | 'CUSTOM'
  filters: AuditFilter
  schedule?: ReportSchedule
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
  recipients: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  lastGenerated?: string
  nextGeneration?: string
  createdAt: string
  updatedAt: string
}

export interface ReportSchedule {
  enabled: boolean
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
  timezone: string
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  category: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'ISO27001' | 'CUSTOM'
  enabled: boolean
  conditions: RuleCondition[]
  actions: RuleAction[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  notifications: NotificationConfig
  createdAt: string
  updatedAt: string
}

export interface RuleCondition {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN'
  value: any
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ARRAY'
}

export interface RuleAction {
  type: 'LOG' | 'ALERT' | 'BLOCK' | 'QUARANTINE' | 'NOTIFY' | 'ESCALATE'
  parameters: Record<string, any>
  delay?: number // seconds
}

export interface NotificationConfig {
  email: boolean
  slack: boolean
  webhook: boolean
  sms: boolean
  recipients: string[]
  template?: string
}

export interface SecurityEvent {
  id: string
  timestamp: string
  type: 'SUSPICIOUS_LOGIN' | 'MULTIPLE_FAILURES' | 'PRIVILEGE_ESCALATION' | 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'ANOMALOUS_BEHAVIOR'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  ipAddress: string
  userAgent: string
  location?: GeoLocation
  description: string
  evidence: SecurityEvidence[]
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
  assignedTo?: string
  resolution?: string
  resolvedAt?: string
  relatedEvents: string[]
}

export interface SecurityEvidence {
  type: 'LOG' | 'SCREENSHOT' | 'NETWORK_TRACE' | 'FILE' | 'DATABASE_QUERY'
  description: string
  data: any
  timestamp: string
  hash: string
}

export interface DataAccess {
  id: string
  timestamp: string
  userId: string
  userName: string
  dataType: 'PII' | 'FINANCIAL' | 'HEALTH' | 'CONFIDENTIAL' | 'PUBLIC'
  dataCategory: string
  recordId: string
  action: 'VIEW' | 'DOWNLOAD' | 'EXPORT' | 'PRINT' | 'COPY'
  purpose: string
  justification?: string
  approvedBy?: string
  ipAddress: string
  location?: GeoLocation
  duration?: number
  complianceFlags: string[]
}

export interface PrivacyRequest {
  id: string
  type: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'RESTRICTION' | 'OBJECTION'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  requesterId: string
  requesterEmail: string
  dataSubject: string
  description: string
  legalBasis: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string
  assignedTo?: string
  processedBy?: string
  processedAt?: string
  response?: string
  evidence?: string[]
  createdAt: string
  updatedAt: string
}

class AuditService {
  // Audit log management
  async getAuditLogs(params: {
    page?: number
    limit?: number
    filters?: AuditFilter
  } = {}): Promise<{
    logs: AuditLog[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { page = 1, limit = 50, filters = {} } = params
    
    const queryParams = {
      page,
      limit,
      ...filters
    }

    return apiClient.get('/audit/logs', { params: queryParams })
  }

  async getAuditLog(logId: string): Promise<AuditLog> {
    return apiClient.get(`/audit/logs/${logId}`)
  }

  async createAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return apiClient.post('/audit/logs', logData)
  }

  async searchAuditLogs(query: string, filters?: AuditFilter): Promise<AuditLog[]> {
    const params = { query, ...filters }
    const response = await apiClient.get('/audit/logs/search', { params })
    return response.logs
  }

  // User activity tracking
  async getUserActivity(userId: string, params: {
    page?: number
    limit?: number
    dateFrom?: string
    dateTo?: string
    action?: string
  } = {}): Promise<{
    activities: AuditLog[]
    total: number
    summary: {
      totalActions: number
      uniqueResources: number
      riskEvents: number
      lastActivity: string
    }
  }> {
    return apiClient.get(`/audit/users/${userId}/activity`, { params })
  }

  async getResourceHistory(resourceType: string, resourceId: string): Promise<{
    history: AuditLog[]
    timeline: Array<{
      timestamp: string
      action: string
      user: string
      changes: FieldChange[]
    }>
  }> {
    return apiClient.get(`/audit/resources/${resourceType}/${resourceId}/history`)
  }

  // Compliance reporting
  async getComplianceReports(): Promise<AuditReport[]> {
    const response = await apiClient.get('/audit/reports')
    return response.reports
  }

  async getComplianceReport(reportId: string): Promise<AuditReport> {
    return apiClient.get(`/audit/reports/${reportId}`)
  }

  async createComplianceReport(reportData: Omit<AuditReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuditReport> {
    return apiClient.post('/audit/reports', reportData)
  }

  async updateComplianceReport(reportId: string, updates: Partial<AuditReport>): Promise<AuditReport> {
    return apiClient.put(`/audit/reports/${reportId}`, updates)
  }

  async deleteComplianceReport(reportId: string): Promise<void> {
    return apiClient.delete(`/audit/reports/${reportId}`)
  }

  async generateComplianceReport(reportId: string): Promise<Blob> {
    return apiClient.get(`/audit/reports/${reportId}/generate`, {
      responseType: 'blob'
    })
  }

  // Compliance rules
  async getComplianceRules(): Promise<ComplianceRule[]> {
    const response = await apiClient.get('/audit/compliance/rules')
    return response.rules
  }

  async getComplianceRule(ruleId: string): Promise<ComplianceRule> {
    return apiClient.get(`/audit/compliance/rules/${ruleId}`)
  }

  async createComplianceRule(ruleData: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceRule> {
    return apiClient.post('/audit/compliance/rules', ruleData)
  }

  async updateComplianceRule(ruleId: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule> {
    return apiClient.put(`/audit/compliance/rules/${ruleId}`, updates)
  }

  async deleteComplianceRule(ruleId: string): Promise<void> {
    return apiClient.delete(`/audit/compliance/rules/${ruleId}`)
  }

  async testComplianceRule(ruleId: string, testData: any): Promise<{
    triggered: boolean
    actions: string[]
    details: string
  }> {
    return apiClient.post(`/audit/compliance/rules/${ruleId}/test`, testData)
  }

  // Security events
  async getSecurityEvents(params: {
    page?: number
    limit?: number
    type?: SecurityEvent['type']
    severity?: SecurityEvent['severity']
    status?: SecurityEvent['status']
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<{
    events: SecurityEvent[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get('/audit/security/events', { params })
  }

  async getSecurityEvent(eventId: string): Promise<SecurityEvent> {
    return apiClient.get(`/audit/security/events/${eventId}`)
  }

  async updateSecurityEvent(eventId: string, updates: {
    status?: SecurityEvent['status']
    assignedTo?: string
    resolution?: string
  }): Promise<SecurityEvent> {
    return apiClient.patch(`/audit/security/events/${eventId}`, updates)
  }

  async getSecurityDashboard(): Promise<{
    openEvents: number
    criticalEvents: number
    eventsToday: number
    topThreats: Array<{
      type: string
      count: number
      trend: 'UP' | 'DOWN' | 'STABLE'
    }>
    riskScore: number
    recommendations: string[]
  }> {
    return apiClient.get('/audit/security/dashboard')
  }

  // Data access tracking
  async getDataAccess(params: {
    page?: number
    limit?: number
    userId?: string
    dataType?: DataAccess['dataType']
    action?: DataAccess['action']
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<{
    accesses: DataAccess[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get('/audit/data-access', { params })
  }

  async logDataAccess(accessData: Omit<DataAccess, 'id' | 'timestamp'>): Promise<DataAccess> {
    return apiClient.post('/audit/data-access', accessData)
  }

  async getDataAccessSummary(userId?: string, timeRange?: string): Promise<{
    totalAccesses: number
    sensitiveDataAccesses: number
    dataTypes: Record<string, number>
    actions: Record<string, number>
    complianceFlags: string[]
    riskScore: number
  }> {
    const params = { userId, timeRange }
    return apiClient.get('/audit/data-access/summary', { params })
  }

  // Privacy requests (GDPR, CCPA, etc.)
  async getPrivacyRequests(params: {
    page?: number
    limit?: number
    type?: PrivacyRequest['type']
    status?: PrivacyRequest['status']
    priority?: PrivacyRequest['priority']
    assignedTo?: string
  } = {}): Promise<{
    requests: PrivacyRequest[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return apiClient.get('/audit/privacy/requests', { params })
  }

  async getPrivacyRequest(requestId: string): Promise<PrivacyRequest> {
    return apiClient.get(`/audit/privacy/requests/${requestId}`)
  }

  async createPrivacyRequest(requestData: Omit<PrivacyRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrivacyRequest> {
    return apiClient.post('/audit/privacy/requests', requestData)
  }

  async updatePrivacyRequest(requestId: string, updates: Partial<PrivacyRequest>): Promise<PrivacyRequest> {
    return apiClient.put(`/audit/privacy/requests/${requestId}`, updates)
  }

  async processPrivacyRequest(requestId: string, response: string, evidence?: string[]): Promise<PrivacyRequest> {
    return apiClient.post(`/audit/privacy/requests/${requestId}/process`, {
      response,
      evidence
    })
  }

  // Analytics and insights
  async getAuditAnalytics(timeRange: string = '30d'): Promise<{
    totalLogs: number
    userActivity: Array<{ date: string; count: number }>
    topActions: Array<{ action: string; count: number }>
    riskDistribution: Record<string, number>
    complianceScore: number
    trends: {
      logins: Array<{ date: string; count: number }>
      dataAccess: Array<{ date: string; count: number }>
      securityEvents: Array<{ date: string; count: number }>
    }
  }> {
    return apiClient.get('/audit/analytics', { params: { timeRange } })
  }

  async getComplianceScore(): Promise<{
    overallScore: number
    categories: Record<string, {
      score: number
      issues: number
      recommendations: string[]
    }>
    trends: Array<{ date: string; score: number }>
    benchmarks: Record<string, number>
  }> {
    return apiClient.get('/audit/compliance/score')
  }

  // Data retention and archival
  async getRetentionPolicies(): Promise<Array<{
    id: string
    name: string
    category: RetentionInfo['category']
    retentionPeriod: number
    autoArchive: boolean
    autoPurge: boolean
    legalHoldSupport: boolean
    appliedTo: string[]
  }>> {
    const response = await apiClient.get('/audit/retention/policies')
    return response.policies
  }

  async archiveOldLogs(dryRun: boolean = true): Promise<{
    archivedCount: number
    archivedSize: number
    archivedLogs: string[]
  }> {
    return apiClient.post('/audit/retention/archive', { dryRun })
  }

  async purgeExpiredLogs(dryRun: boolean = true): Promise<{
    purgedCount: number
    purgedSize: number
    purgedLogs: string[]
  }> {
    return apiClient.post('/audit/retention/purge', { dryRun })
  }

  // Export and backup
  async exportAuditLogs(filters: AuditFilter, format: 'CSV' | 'JSON' | 'XML' = 'CSV'): Promise<Blob> {
    return apiClient.get('/audit/export', {
      params: { ...filters, format },
      responseType: 'blob'
    })
  }

  async backupAuditLogs(dateFrom: string, dateTo: string): Promise<{
    backupId: string
    size: number
    location: string
    checksum: string
  }> {
    return apiClient.post('/audit/backup', { dateFrom, dateTo })
  }

  // Real-time monitoring
  async subscribeToAuditEvents(callback: (event: AuditLog) => void): Promise<() => void> {
    // WebSocket connection for real-time audit events
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/audit/events`)
    
    ws.onmessage = (event) => {
      const auditLog: AuditLog = JSON.parse(event.data)
      callback(auditLog)
    }

    return () => ws.close()
  }

  async subscribeToSecurityEvents(callback: (event: SecurityEvent) => void): Promise<() => void> {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/audit/security`)
    
    ws.onmessage = (event) => {
      const securityEvent: SecurityEvent = JSON.parse(event.data)
      callback(securityEvent)
    }

    return () => ws.close()
  }

  // Forensic analysis
  async performForensicAnalysis(params: {
    userId?: string
    timeRange: string
    includeRelated: boolean
    analysisType: 'TIMELINE' | 'PATTERN' | 'ANOMALY' | 'CORRELATION'
  }): Promise<{
    analysisId: string
    findings: Array<{
      type: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      description: string
      evidence: string[]
      recommendations: string[]
    }>
    timeline: Array<{
      timestamp: string
      event: string
      significance: number
    }>
    patterns: Array<{
      pattern: string
      frequency: number
      risk: number
    }>
  }> {
    return apiClient.post('/audit/forensics/analyze', params)
  }
}

const auditService = new AuditService()
export default auditService