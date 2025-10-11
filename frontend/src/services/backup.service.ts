// Comprehensive Backup and Recovery Service
import apiClient from '@/lib/api-client'

export interface BackupJob {
  id: string
  name: string
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL'
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  schedule: BackupSchedule
  targets: BackupTarget[]
  retention: RetentionPolicy
  encryption: EncryptionSettings
  compression: CompressionSettings
  notifications: NotificationSettings
  createdAt: string
  updatedAt: string
  lastRun?: string
  nextRun?: string
  statistics: BackupStatistics
}

export interface BackupSchedule {
  enabled: boolean
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  time: string // HH:mm format
  dayOfWeek?: number // 0-6 (Sunday-Saturday)
  dayOfMonth?: number // 1-31
  timezone: string
  excludeWeekends: boolean
  excludeHolidays: boolean
}

export interface BackupTarget {
  type: 'DATABASE' | 'FILES' | 'LOGS' | 'CONFIGURATION'
  name: string
  path?: string
  database?: string
  tables?: string[]
  excludePatterns?: string[]
  includePatterns?: string[]
  priority: number
}

export interface RetentionPolicy {
  keepDaily: number
  keepWeekly: number
  keepMonthly: number
  keepYearly: number
  maxAge: number // days
  maxSize: number // GB
  autoCleanup: boolean
}

export interface EncryptionSettings {
  enabled: boolean
  algorithm: 'AES256' | 'AES128' | 'ChaCha20'
  keyRotation: boolean
  keyRotationInterval: number // days
}

export interface CompressionSettings {
  enabled: boolean
  algorithm: 'GZIP' | 'BZIP2' | 'LZMA' | 'ZSTD'
  level: number // 1-9
}

export interface NotificationSettings {
  onSuccess: boolean
  onFailure: boolean
  onWarning: boolean
  email: string[]
  slack?: string
  webhook?: string
}

export interface BackupStatistics {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDuration: number
  averageSize: number
  lastSuccessfulRun?: string
  lastFailedRun?: string
  totalDataBackedUp: number
  compressionRatio: number
}

export interface BackupInstance {
  id: string
  jobId: string
  type: BackupJob['type']
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  startTime: string
  endTime?: string
  duration?: number
  size: number
  compressedSize: number
  location: string
  checksum: string
  metadata: BackupMetadata
  logs: BackupLog[]
  error?: string
}

export interface BackupMetadata {
  version: string
  hostname: string
  database: string
  tables: string[]
  fileCount: number
  totalSize: number
  compressionRatio: number
  encryptionEnabled: boolean
  createdBy: string
}

export interface BackupLog {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
  component: string
}

export interface RestoreJob {
  id: string
  backupInstanceId: string
  type: 'FULL' | 'PARTIAL' | 'POINT_IN_TIME'
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  targetLocation: string
  options: RestoreOptions
  startTime: string
  endTime?: string
  duration?: number
  progress: number
  logs: BackupLog[]
  error?: string
}

export interface RestoreOptions {
  overwriteExisting: boolean
  restorePermissions: boolean
  restoreOwnership: boolean
  validateChecksum: boolean
  skipCorruptedFiles: boolean
  targetTables?: string[]
  targetFiles?: string[]
  pointInTime?: string
}

export interface DisasterRecoveryPlan {
  id: string
  name: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  rto: number // Recovery Time Objective (minutes)
  rpo: number // Recovery Point Objective (minutes)
  steps: RecoveryStep[]
  contacts: EmergencyContact[]
  resources: RecoveryResource[]
  testSchedule: TestSchedule
  lastTested?: string
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING'
}

export interface RecoveryStep {
  id: string
  order: number
  title: string
  description: string
  type: 'MANUAL' | 'AUTOMATED' | 'VERIFICATION'
  estimatedTime: number
  dependencies: string[]
  commands?: string[]
  verificationCriteria?: string[]
  responsible: string
}

export interface EmergencyContact {
  name: string
  role: string
  phone: string
  email: string
  priority: number
  availability: string
}

export interface RecoveryResource {
  type: 'SERVER' | 'DATABASE' | 'STORAGE' | 'NETWORK' | 'APPLICATION'
  name: string
  location: string
  specifications: Record<string, any>
  backupLocation?: string
  priority: number
}

export interface TestSchedule {
  enabled: boolean
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  nextTest: string
  testType: 'PARTIAL' | 'FULL' | 'TABLETOP'
  duration: number
}

class BackupService {
  // Backup job management
  async getBackupJobs(): Promise<BackupJob[]> {
    const response = await apiClient.get('/backup/jobs')
    return response.jobs
  }

  async getBackupJob(jobId: string): Promise<BackupJob> {
    return apiClient.get(`/backup/jobs/${jobId}`)
  }

  async createBackupJob(jobData: Omit<BackupJob, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>): Promise<BackupJob> {
    return apiClient.post('/backup/jobs', jobData)
  }

  async updateBackupJob(jobId: string, updates: Partial<BackupJob>): Promise<BackupJob> {
    return apiClient.put(`/backup/jobs/${jobId}`, updates)
  }

  async deleteBackupJob(jobId: string): Promise<void> {
    return apiClient.delete(`/backup/jobs/${jobId}`)
  }

  async runBackupJob(jobId: string, type?: BackupJob['type']): Promise<BackupInstance> {
    return apiClient.post(`/backup/jobs/${jobId}/run`, { type })
  }

  async cancelBackupJob(jobId: string): Promise<void> {
    return apiClient.post(`/backup/jobs/${jobId}/cancel`)
  }

  // Backup instances
  async getBackupInstances(jobId?: string): Promise<BackupInstance[]> {
    const params = jobId ? { jobId } : {}
    const response = await apiClient.get('/backup/instances', { params })
    return response.instances
  }

  async getBackupInstance(instanceId: string): Promise<BackupInstance> {
    return apiClient.get(`/backup/instances/${instanceId}`)
  }

  async deleteBackupInstance(instanceId: string): Promise<void> {
    return apiClient.delete(`/backup/instances/${instanceId}`)
  }

  async downloadBackup(instanceId: string): Promise<Blob> {
    return apiClient.get(`/backup/instances/${instanceId}/download`, {
      responseType: 'blob'
    })
  }

  async verifyBackup(instanceId: string): Promise<{
    valid: boolean
    checksum: string
    issues: string[]
  }> {
    return apiClient.post(`/backup/instances/${instanceId}/verify`)
  }

  // Restore operations
  async getRestoreJobs(): Promise<RestoreJob[]> {
    const response = await apiClient.get('/backup/restore')
    return response.jobs
  }

  async getRestoreJob(jobId: string): Promise<RestoreJob> {
    return apiClient.get(`/backup/restore/${jobId}`)
  }

  async createRestoreJob(restoreData: {
    backupInstanceId: string
    type: RestoreJob['type']
    targetLocation: string
    options: RestoreOptions
  }): Promise<RestoreJob> {
    return apiClient.post('/backup/restore', restoreData)
  }

  async cancelRestoreJob(jobId: string): Promise<void> {
    return apiClient.post(`/backup/restore/${jobId}/cancel`)
  }

  // Disaster recovery
  async getDisasterRecoveryPlans(): Promise<DisasterRecoveryPlan[]> {
    const response = await apiClient.get('/backup/disaster-recovery')
    return response.plans
  }

  async getDisasterRecoveryPlan(planId: string): Promise<DisasterRecoveryPlan> {
    return apiClient.get(`/backup/disaster-recovery/${planId}`)
  }

  async createDisasterRecoveryPlan(planData: Omit<DisasterRecoveryPlan, 'id'>): Promise<DisasterRecoveryPlan> {
    return apiClient.post('/backup/disaster-recovery', planData)
  }

  async updateDisasterRecoveryPlan(planId: string, updates: Partial<DisasterRecoveryPlan>): Promise<DisasterRecoveryPlan> {
    return apiClient.put(`/backup/disaster-recovery/${planId}`, updates)
  }

  async deleteDisasterRecoveryPlan(planId: string): Promise<void> {
    return apiClient.delete(`/backup/disaster-recovery/${planId}`)
  }

  async testDisasterRecoveryPlan(planId: string, testType: TestSchedule['testType']): Promise<{
    testId: string
    status: 'RUNNING' | 'COMPLETED' | 'FAILED'
    results?: {
      stepsCompleted: number
      totalSteps: number
      duration: number
      issues: string[]
      recommendations: string[]
    }
  }> {
    return apiClient.post(`/backup/disaster-recovery/${planId}/test`, { testType })
  }

  // Storage management
  async getStorageUsage(): Promise<{
    total: number
    used: number
    available: number
    backupsByType: Record<string, number>
    oldestBackup: string
    newestBackup: string
    compressionSavings: number
  }> {
    return apiClient.get('/backup/storage')
  }

  async cleanupOldBackups(dryRun: boolean = true): Promise<{
    deletedCount: number
    freedSpace: number
    deletedBackups: string[]
  }> {
    return apiClient.post('/backup/cleanup', { dryRun })
  }

  // Monitoring and alerts
  async getBackupHealth(): Promise<{
    overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    issues: Array<{
      type: 'FAILED_BACKUP' | 'STORAGE_FULL' | 'SCHEDULE_MISSED' | 'VERIFICATION_FAILED'
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      message: string
      timestamp: string
      jobId?: string
      instanceId?: string
    }>
    metrics: {
      successRate: number
      averageBackupTime: number
      storageGrowthRate: number
      lastSuccessfulBackup: string
    }
  }> {
    return apiClient.get('/backup/health')
  }

  async getBackupMetrics(timeRange: string = '7d'): Promise<{
    backupCounts: Array<{ date: string; successful: number; failed: number }>
    storageTrends: Array<{ date: string; size: number }>
    performanceTrends: Array<{ date: string; duration: number; throughput: number }>
    errorTrends: Array<{ date: string; errors: number; type: string }>
  }> {
    return apiClient.get('/backup/metrics', { params: { timeRange } })
  }

  // Configuration
  async getBackupConfiguration(): Promise<{
    defaultRetention: RetentionPolicy
    defaultEncryption: EncryptionSettings
    defaultCompression: CompressionSettings
    storageLocations: Array<{
      id: string
      name: string
      type: 'LOCAL' | 'S3' | 'AZURE' | 'GCS'
      path: string
      capacity: number
      used: number
      default: boolean
    }>
    scheduleTemplates: Array<{
      id: string
      name: string
      schedule: BackupSchedule
    }>
  }> {
    return apiClient.get('/backup/configuration')
  }

  async updateBackupConfiguration(config: {
    defaultRetention?: RetentionPolicy
    defaultEncryption?: EncryptionSettings
    defaultCompression?: CompressionSettings
  }): Promise<void> {
    return apiClient.put('/backup/configuration', config)
  }

  // Backup validation
  async validateBackupIntegrity(instanceId: string): Promise<{
    valid: boolean
    checksumMatch: boolean
    fileCount: number
    corruptedFiles: string[]
    missingFiles: string[]
    recommendations: string[]
  }> {
    return apiClient.post(`/backup/instances/${instanceId}/validate`)
  }

  // Backup scheduling
  async getBackupSchedule(): Promise<Array<{
    jobId: string
    jobName: string
    nextRun: string
    frequency: string
    enabled: boolean
  }>> {
    const response = await apiClient.get('/backup/schedule')
    return response.schedule
  }

  async updateBackupSchedule(jobId: string, schedule: BackupSchedule): Promise<void> {
    return apiClient.put(`/backup/jobs/${jobId}/schedule`, schedule)
  }

  // Emergency procedures
  async initiateEmergencyRestore(planId: string, options: {
    priority: 'IMMEDIATE' | 'HIGH' | 'NORMAL'
    notifyContacts: boolean
    skipVerification: boolean
  }): Promise<{
    restoreJobId: string
    estimatedCompletion: string
    contactsNotified: string[]
  }> {
    return apiClient.post(`/backup/emergency-restore/${planId}`, options)
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const response = await apiClient.get('/backup/emergency-contacts')
    return response.contacts
  }

  async notifyEmergencyContacts(message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Promise<void> {
    return apiClient.post('/backup/emergency-contacts/notify', { message, severity })
  }

  // Reporting
  async generateBackupReport(params: {
    type: 'SUMMARY' | 'DETAILED' | 'COMPLIANCE'
    dateFrom: string
    dateTo: string
    jobIds?: string[]
    format: 'PDF' | 'EXCEL' | 'CSV'
  }): Promise<Blob> {
    return apiClient.get('/backup/reports', {
      params,
      responseType: 'blob'
    })
  }

  // Utilities
  async estimateBackupSize(targets: BackupTarget[]): Promise<{
    estimatedSize: number
    estimatedDuration: number
    recommendations: string[]
  }> {
    return apiClient.post('/backup/estimate', { targets })
  }

  async testBackupConnectivity(storageLocation: string): Promise<{
    connected: boolean
    latency: number
    throughput: number
    error?: string
  }> {
    return apiClient.post('/backup/test-connectivity', { storageLocation })
  }

  // Backup templates
  async getBackupTemplates(): Promise<Array<{
    id: string
    name: string
    description: string
    type: BackupJob['type']
    targets: BackupTarget[]
    schedule: BackupSchedule
    retention: RetentionPolicy
  }>> {
    const response = await apiClient.get('/backup/templates')
    return response.templates
  }

  async createBackupFromTemplate(templateId: string, customizations: Partial<BackupJob>): Promise<BackupJob> {
    return apiClient.post(`/backup/templates/${templateId}/create`, customizations)
  }
}

const backupService = new BackupService()
export default backupService