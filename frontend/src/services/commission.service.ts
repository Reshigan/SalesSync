import { apiClient } from '../lib/api-client'

export interface Commission {
  id: string
  agentId: string
  type: 'BOARD_PLACEMENT' | 'PRODUCT_DISTRIBUTION' | 'VISIT_COMPLETION' | 'PERFORMANCE_BONUS' | 'MANUAL_ADJUSTMENT'
  referenceId: string // ID of the related record (board placement, product distribution, etc.)
  amount: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'DISPUTED'
  calculationDate: string
  approvalDate?: string
  paymentDate?: string
  description: string
  calculationDetails: CommissionCalculationDetails
  notes?: string
  approvedBy?: string
  paidBy?: string
  paymentReference?: string
  disputeReason?: string
  disputeDate?: string
  createdAt: string
  updatedAt: string
  
  // Relationships
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  boardPlacement?: {
    id: string
    customerId: string
    customerName: string
    boardName: string
    brandName: string
    placementDate: string
  }
  productDistribution?: {
    id: string
    customerId: string
    customerName: string
    productName: string
    quantity: number
    distributionDate: string
  }
}

export interface CommissionCalculationDetails {
  baseAmount: number
  baseRate: number
  rateType: 'FIXED' | 'PERCENTAGE'
  bonuses: CommissionBonus[]
  deductions: CommissionDeduction[]
  multipliers: CommissionMultiplier[]
  totalBonuses: number
  totalDeductions: number
  finalMultiplier: number
  grossAmount: number
  netAmount: number
  calculationMethod: string
  calculationRules: string[]
}

export interface CommissionBonus {
  type: 'QUALITY_BONUS' | 'COVERAGE_BONUS' | 'QUANTITY_BONUS' | 'PERFORMANCE_BONUS' | 'STREAK_BONUS'
  amount: number
  description: string
  criteria: Record<string, any>
}

export interface CommissionDeduction {
  type: 'TAX' | 'FEE' | 'PENALTY' | 'ADJUSTMENT'
  amount: number
  description: string
  reason: string
}

export interface CommissionMultiplier {
  type: 'PERFORMANCE' | 'TIER' | 'SEASONAL' | 'PROMOTIONAL'
  factor: number
  description: string
  criteria: Record<string, any>
}

export interface CommissionRule {
  id: string
  name: string
  type: 'BOARD_PLACEMENT' | 'PRODUCT_DISTRIBUTION' | 'VISIT_COMPLETION' | 'PERFORMANCE_BONUS'
  isActive: boolean
  priority: number
  conditions: CommissionCondition[]
  actions: CommissionAction[]
  validFrom: string
  validTo?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CommissionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'contains' | 'in' | 'between'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface CommissionAction {
  type: 'SET_RATE' | 'ADD_BONUS' | 'APPLY_MULTIPLIER' | 'ADD_DEDUCTION'
  value: number
  valueType: 'FIXED' | 'PERCENTAGE'
  description: string
  conditions?: CommissionCondition[]
}

export interface CommissionPayout {
  id: string
  agentId: string
  payoutDate: string
  totalAmount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  paymentMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH' | 'CHECK'
  paymentReference?: string
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode: string
    branchCode?: string
  }
  mobileMoneyDetails?: {
    phoneNumber: string
    provider: string
  }
  commissionIds: string[]
  commissionCount: number
  processingFee?: number
  netAmount: number
  notes?: string
  processedBy?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  
  // Relationships
  agent?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  commissions?: Commission[]
}

export interface CommissionSearchParams {
  agentId?: string
  type?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  referenceId?: string
  approvedBy?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CommissionCreateRequest {
  agentId: string
  type: 'BOARD_PLACEMENT' | 'PRODUCT_DISTRIBUTION' | 'VISIT_COMPLETION' | 'PERFORMANCE_BONUS' | 'MANUAL_ADJUSTMENT'
  referenceId?: string
  amount: number
  description: string
  calculationDetails?: Partial<CommissionCalculationDetails>
  notes?: string
}

export interface CommissionUpdateRequest extends Partial<CommissionCreateRequest> {
  status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'DISPUTED'
  approvalDate?: string
  paymentDate?: string
  paymentReference?: string
  disputeReason?: string
  notes?: string
}

class CommissionService {
  private baseUrl = '/commissions'

  // Commission CRUD operations
  async getCommissions(params?: CommissionSearchParams): Promise<{ commissions: Commission[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.minAmount) queryParams.append('minAmount', params.minAmount.toString())
    if (params?.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString())
    if (params?.referenceId) queryParams.append('referenceId', params.referenceId)
    if (params?.approvedBy) queryParams.append('approvedBy', params.approvedBy)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl
    return await apiClient.get<{ commissions: Commission[]; total: number; page: number; limit: number }>(url)
  }

  async getCommission(id: string): Promise<Commission> {
    return await apiClient.get<Commission>(`${this.baseUrl}/${id}`)
  }

  async createCommission(data: CommissionCreateRequest): Promise<Commission> {
    return await apiClient.post<Commission>(this.baseUrl, data)
  }

  async updateCommission(id: string, data: CommissionUpdateRequest): Promise<Commission> {
    return await apiClient.put<Commission>(`${this.baseUrl}/${id}`, data)
  }

  async deleteCommission(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Commission approval workflow
  async approveCommission(id: string, notes?: string): Promise<Commission> {
    return await apiClient.post<Commission>(`${this.baseUrl}/${id}/approve`, { notes })
  }

  async rejectCommission(id: string, reason: string): Promise<Commission> {
    return await apiClient.post<Commission>(`${this.baseUrl}/${id}/reject`, { reason })
  }

  async disputeCommission(id: string, reason: string): Promise<Commission> {
    return await apiClient.post<Commission>(`${this.baseUrl}/${id}/dispute`, { reason })
  }

  async resolveDispute(id: string, resolution: string, adjustedAmount?: number): Promise<Commission> {
    return await apiClient.post<Commission>(`${this.baseUrl}/${id}/resolve-dispute`, {
      resolution,
      adjustedAmount
    })
  }

  // Commission calculation
  async calculateCommission(data: {
    agentId: string
    type: 'BOARD_PLACEMENT' | 'PRODUCT_DISTRIBUTION' | 'VISIT_COMPLETION'
    referenceId: string
    contextData?: Record<string, any>
  }): Promise<{
    estimatedAmount: number
    calculationDetails: CommissionCalculationDetails
    applicableRules: CommissionRule[]
  }> {
    return await apiClient.post<{
      estimatedAmount: number
      calculationDetails: CommissionCalculationDetails
      applicableRules: CommissionRule[]
    }>(`${this.baseUrl}/calculate`, data)
  }

  async recalculateCommission(id: string): Promise<Commission> {
    return await apiClient.post<Commission>(`${this.baseUrl}/${id}/recalculate`)
  }

  // Bulk commission operations
  async bulkApproveCommissions(commissionIds: string[], notes?: string): Promise<{ approved: number; errors: any[] }> {
    return await apiClient.post<{ approved: number; errors: any[] }>(`${this.baseUrl}/bulk-approve`, {
      commissionIds,
      notes
    })
  }

  async bulkRejectCommissions(commissionIds: string[], reason: string): Promise<{ rejected: number; errors: any[] }> {
    return await apiClient.post<{ rejected: number; errors: any[] }>(`${this.baseUrl}/bulk-reject`, {
      commissionIds,
      reason
    })
  }

  async bulkUpdateCommissions(commissionIds: string[], updates: Partial<CommissionUpdateRequest>): Promise<{ updated: number; errors: any[] }> {
    return await apiClient.post<{ updated: number; errors: any[] }>(`${this.baseUrl}/bulk-update`, {
      commissionIds,
      updates
    })
  }

  // Commission rules management
  async getCommissionRules(params?: {
    type?: string
    isActive?: boolean
    page?: number
    limit?: number
  }): Promise<{ rules: CommissionRule[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.type) queryParams.append('type', params.type)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString() ? `${this.baseUrl}/rules?${queryParams.toString()}` : `${this.baseUrl}/rules`
    return await apiClient.get<{ rules: CommissionRule[]; total: number; page: number; limit: number }>(url)
  }

  async getCommissionRule(id: string): Promise<CommissionRule> {
    return await apiClient.get<CommissionRule>(`${this.baseUrl}/rules/${id}`)
  }

  async createCommissionRule(data: {
    name: string
    type: 'BOARD_PLACEMENT' | 'PRODUCT_DISTRIBUTION' | 'VISIT_COMPLETION' | 'PERFORMANCE_BONUS'
    priority: number
    conditions: Omit<CommissionCondition, 'id'>[]
    actions: Omit<CommissionAction, 'id'>[]
    validFrom: string
    validTo?: string
    description?: string
  }): Promise<CommissionRule> {
    return await apiClient.post<CommissionRule>(`${this.baseUrl}/rules`, data)
  }

  async updateCommissionRule(id: string, data: Partial<{
    name: string
    isActive: boolean
    priority: number
    conditions: Omit<CommissionCondition, 'id'>[]
    actions: Omit<CommissionAction, 'id'>[]
    validFrom: string
    validTo: string
    description: string
  }>): Promise<CommissionRule> {
    return await apiClient.put<CommissionRule>(`${this.baseUrl}/rules/${id}`, data)
  }

  async deleteCommissionRule(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/rules/${id}`)
  }

  // Commission payouts
  async getCommissionPayouts(params?: {
    agentId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    paymentMethod?: string
    page?: number
    limit?: number
  }): Promise<{ payouts: CommissionPayout[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams()
    
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString() ? `${this.baseUrl}/payouts?${queryParams.toString()}` : `${this.baseUrl}/payouts`
    return await apiClient.get<{ payouts: CommissionPayout[]; total: number; page: number; limit: number }>(url)
  }

  async getCommissionPayout(id: string): Promise<CommissionPayout> {
    return await apiClient.get<CommissionPayout>(`${this.baseUrl}/payouts/${id}`)
  }

  async createCommissionPayout(data: {
    agentId: string
    commissionIds: string[]
    paymentMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH' | 'CHECK'
    bankDetails?: {
      accountName: string
      accountNumber: string
      bankName: string
      bankCode: string
      branchCode?: string
    }
    mobileMoneyDetails?: {
      phoneNumber: string
      provider: string
    }
    notes?: string
  }): Promise<CommissionPayout> {
    return await apiClient.post<CommissionPayout>(`${this.baseUrl}/payouts`, data)
  }

  async processCommissionPayout(id: string, paymentReference?: string): Promise<CommissionPayout> {
    return await apiClient.post<CommissionPayout>(`${this.baseUrl}/payouts/${id}/process`, {
      paymentReference
    })
  }

  async completeCommissionPayout(id: string, paymentReference: string): Promise<CommissionPayout> {
    return await apiClient.post<CommissionPayout>(`${this.baseUrl}/payouts/${id}/complete`, {
      paymentReference
    })
  }

  async failCommissionPayout(id: string, failureReason: string): Promise<CommissionPayout> {
    return await apiClient.post<CommissionPayout>(`${this.baseUrl}/payouts/${id}/fail`, {
      failureReason
    })
  }

  async cancelCommissionPayout(id: string, reason: string): Promise<CommissionPayout> {
    return await apiClient.post<CommissionPayout>(`${this.baseUrl}/payouts/${id}/cancel`, {
      reason
    })
  }

  // Agent commission summary
  async getAgentCommissionSummary(agentId: string, params?: {
    dateFrom?: string
    dateTo?: string
    type?: string
    status?: string
  }): Promise<{
    totalCommissions: number
    pendingCommissions: number
    approvedCommissions: number
    paidCommissions: number
    disputedCommissions: number
    totalEarnings: number
    pendingEarnings: number
    paidEarnings: number
    averageCommission: number
    commissionsByType: Record<string, { count: number; amount: number }>
    commissionsByMonth: Array<{ month: string; count: number; amount: number }>
    topPerformingActivities: Array<{
      type: string
      referenceId: string
      description: string
      amount: number
      date: string
    }>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/agent/${agentId}/summary?${queryParams.toString()}`
      : `${this.baseUrl}/agent/${agentId}/summary`
    
    return await apiClient.get(url)
  }

  // Commission analytics
  async getCommissionStats(params?: {
    agentId?: string
    dateFrom?: string
    dateTo?: string
    type?: string
  }): Promise<{
    totalCommissions: number
    totalAmount: number
    averageCommission: number
    commissionsByStatus: Record<string, { count: number; amount: number }>
    commissionsByType: Record<string, { count: number; amount: number }>
    commissionsByAgent: Array<{
      agentId: string
      agentName: string
      count: number
      amount: number
    }>
    commissionTrends: Array<{
      period: string
      count: number
      amount: number
    }>
    topEarners: Array<{
      agentId: string
      agentName: string
      totalEarnings: number
      commissionCount: number
    }>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.type) queryParams.append('type', params.type)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/stats?${queryParams.toString()}`
      : `${this.baseUrl}/stats`
    
    return await apiClient.get(url)
  }

  // Real-time commission tracking
  async getRealtimeCommissions(agentId: string): Promise<{
    todayCommissions: number
    todayEarnings: number
    weekCommissions: number
    weekEarnings: number
    monthCommissions: number
    monthEarnings: number
    pendingApprovals: number
    pendingPayments: number
    recentCommissions: Commission[]
  }> {
    return await apiClient.get<{
      todayCommissions: number
      todayEarnings: number
      weekCommissions: number
      weekEarnings: number
      monthCommissions: number
      monthEarnings: number
      pendingApprovals: number
      pendingPayments: number
      recentCommissions: Commission[]
    }>(`${this.baseUrl}/agent/${agentId}/realtime`)
  }

  // Commission projections
  async getCommissionProjections(agentId: string, params?: {
    period?: 'week' | 'month' | 'quarter'
    includeBonus?: boolean
  }): Promise<{
    projectedEarnings: number
    projectedCommissions: number
    projectionBasis: string
    projectionFactors: Array<{
      factor: string
      impact: number
      description: string
    }>
    recommendations: Array<{
      action: string
      potentialIncrease: number
      description: string
    }>
  }> {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.append('period', params.period)
    if (params?.includeBonus) queryParams.append('includeBonus', params.includeBonus.toString())

    const url = queryParams.toString() 
      ? `${this.baseUrl}/agent/${agentId}/projections?${queryParams.toString()}`
      : `${this.baseUrl}/agent/${agentId}/projections`
    
    return await apiClient.get(url)
  }

  // Export and reporting
  async exportCommissions(params?: CommissionSearchParams): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/export?${queryParams.toString()}`
      : `${this.baseUrl}/export`
    
    return await apiClient.download(url)
  }

  async exportCommissionPayouts(params?: {
    agentId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.agentId) queryParams.append('agentId', params.agentId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

    const url = queryParams.toString() 
      ? `${this.baseUrl}/payouts/export?${queryParams.toString()}`
      : `${this.baseUrl}/payouts/export`
    
    return await apiClient.download(url)
  }

  // Commission statement generation
  async generateCommissionStatement(agentId: string, params: {
    dateFrom: string
    dateTo: string
    format: 'PDF' | 'EXCEL'
    includeDetails?: boolean
  }): Promise<Blob> {
    const queryParams = new URLSearchParams({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      format: params.format
    })
    
    if (params.includeDetails) queryParams.append('includeDetails', 'true')

    return await apiClient.download(`${this.baseUrl}/agent/${agentId}/statement?${queryParams.toString()}`)
  }
}

const commissionService = new CommissionService()
export default commissionService