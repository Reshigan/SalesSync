import { apiClient } from './api.service'
import { API_CONFIG } from '../config/api.config'
import { AIInsight, FraudDetection, AIAnalysis, LocalAIConfig } from '../types/ai.types'

class AIService {
  private readonly baseUrl = API_CONFIG.ENDPOINTS.AI.CHAT

  async chat(prompt: string, maxTokens?: number): Promise<string> {
    const response = await apiClient.post('/ai/chat', { prompt, max_tokens: maxTokens || 1024 })
    return response.data?.response || ''
  }

  async analyze(type: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await apiClient.post('/ai/analyze', { type, data })
    return response.data || {}
  }

  async analyzeFieldAgentPerformance(agentId: string, timeRange: string): Promise<AIInsight[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/field-agents/${agentId}/insights`, {
        params: { time_range: timeRange }
      })
      return response.data?.data || response.data || []
    } catch {
      return []
    }
  }

  async detectFieldAgentFraud(transactions: unknown[]): Promise<FraudDetection[]> {
    try {
      const analysis = await this.analyze('fraud_detection', { transactions })
      return transactions
        .filter(() => (analysis.risk_score as number) > 50)
        .map((transaction: Record<string, unknown>, index: number) => ({
          id: `fraud_${index}`,
          transaction_id: String(transaction.id || ''),
          module: 'field_agents',
          type: 'location_anomaly' as const,
          risk_score: (analysis.risk_score as number) || 0,
          description: ((analysis.fraud_indicators as string[]) || [])[0] || 'Suspicious activity detected',
          evidence: {
            location: transaction.location,
            time: transaction.timestamp,
            expected_location: transaction.expected_location
          },
          status: 'pending' as const,
          created_at: new Date().toISOString()
        }))
    } catch {
      return []
    }
  }

  async analyzeCustomerBehavior(customerId: string): Promise<AIInsight[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/customers/${customerId}/insights`)
      return response.data?.data || response.data || []
    } catch {
      return []
    }
  }

  async detectCustomerFraud(customerId: string): Promise<FraudDetection[]> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customers/${customerId}/fraud-check`)
      return response.data?.data || response.data || []
    } catch {
      return []
    }
  }

  async analyzeOrderPatterns(timeRange: string): Promise<AIInsight[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/insights`, {
        params: { time_range: timeRange }
      })
      return response.data?.data || response.data || []
    } catch {
      return []
    }
  }

  async detectOrderFraud(orderId: string): Promise<FraudDetection[]> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/orders/${orderId}/fraud-check`)
      return response.data?.data || response.data || []
    } catch {
      return []
    }
  }

  async analyzeProductPerformance(productId: string): Promise<AIInsight[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/products/${productId}/insights`)
      return response.data?.data || response.data || []
    } catch {
      return []
    }
  }

  async getComprehensiveAnalysis(): Promise<AIAnalysis> {
    const defaultAnalysis: AIAnalysis = {
      field_agents: { performance_insights: [], fraud_alerts: [], location_anomalies: [], commission_predictions: [] },
      customers: { behavior_insights: [], churn_predictions: [], value_predictions: [] },
      orders: { pattern_insights: [], fraud_detection: [], demand_predictions: [] },
      products: { performance_insights: [], inventory_predictions: [], pricing_recommendations: [] }
    }
    try {
      const response = await apiClient.get(`${this.baseUrl}/comprehensive-analysis`)
      return { ...defaultAnalysis, ...(response.data?.data || response.data || {}) }
    } catch {
      return defaultAnalysis
    }
  }

  async startRealTimeMonitoring(_modules: string[]): Promise<void> {}

  async stopRealTimeMonitoring(): Promise<void> {}

  async getAIConfig(): Promise<LocalAIConfig> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/config`)
      return response.data?.data || response.data
    } catch {
      return {
        enabled: true,
        model_path: '@cf/meta/llama-3.1-8b-instruct',
        confidence_threshold: 0.7,
        fraud_threshold: 0.8,
        update_interval: 300,
        modules: { field_agents: true, customers: true, orders: true, products: true }
      }
    }
  }

  async updateAIConfig(config: Partial<LocalAIConfig>): Promise<LocalAIConfig> {
    const response = await apiClient.put(`${this.baseUrl}/config`, config)
    return response.data?.data || response.data
  }
}

export const aiService = new AIService()
