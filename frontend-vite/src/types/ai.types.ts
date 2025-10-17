export interface AIInsight {
  id: string
  module: string
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'fraud_alert'
  title: string
  description: string
  confidence: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  data: any
  created_at: string
  expires_at?: string
}

export interface FraudDetection {
  id: string
  transaction_id: string
  module: string
  type: 'location_anomaly' | 'time_anomaly' | 'pattern_anomaly' | 'duplicate_transaction' | 'suspicious_behavior'
  risk_score: number
  description: string
  evidence: {
    [key: string]: any
  }
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive'
  created_at: string
  resolved_at?: string
  resolved_by?: string
}

export interface DataInsight {
  id: string
  module: string
  metric: string
  current_value: number
  previous_value: number
  change_percentage: number
  trend: 'up' | 'down' | 'stable'
  prediction: {
    next_period: number
    confidence: number
  }
  recommendations: string[]
  created_at: string
}

export interface AIAnalysis {
  field_agents: {
    performance_insights: AIInsight[]
    fraud_alerts: FraudDetection[]
    location_anomalies: any[]
    commission_predictions: any[]
  }
  customers: {
    behavior_insights: AIInsight[]
    churn_predictions: any[]
    value_predictions: any[]
  }
  orders: {
    pattern_insights: AIInsight[]
    fraud_detection: FraudDetection[]
    demand_predictions: any[]
  }
  products: {
    performance_insights: AIInsight[]
    inventory_predictions: any[]
    pricing_recommendations: any[]
  }
}

export interface LocalAIConfig {
  enabled: boolean
  model_path: string
  confidence_threshold: number
  fraud_threshold: number
  update_interval: number
  modules: {
    field_agents: boolean
    customers: boolean
    orders: boolean
    products: boolean
  }
}