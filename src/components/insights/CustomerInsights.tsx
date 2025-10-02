'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Award,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  MapPin,
  User,
  Package,
  Route,
  Clock,
  Zap
} from 'lucide-react'

interface SurveyInsight {
  surveyId: string
  surveyTitle: string
  surveyType: string
  responseCount: number
  avgRating: number
  npsScore: number
  completionRate: number
  lastResponseDate: string
  keyInsights: string[]
  sentimentScore: number
  topConcerns: Array<{
    concern: string
    frequency: number
    severity: 'low' | 'medium' | 'high'
  }>
  topCompliments: Array<{
    compliment: string
    frequency: number
  }>
}

interface CustomerInsight {
  customerId: string
  customerName: string
  customerCode: string
  customerType: string
  
  // Survey Data
  totalSurveys: number
  completedSurveys: number
  avgSatisfaction: number
  npsScore: number
  lastSurveyDate: string
  
  // Behavioral Insights
  preferredContactTime: string
  responsePattern: 'prompt' | 'delayed' | 'inconsistent'
  engagementLevel: 'high' | 'medium' | 'low'
  feedbackQuality: 'detailed' | 'basic' | 'minimal'
  
  // Sentiment Analysis
  overallSentiment: 'positive' | 'neutral' | 'negative'
  sentimentTrend: 'improving' | 'stable' | 'declining'
  emotionalDrivers: string[]
  
  // Product Preferences
  favoriteProducts: Array<{
    productName: string
    rating: number
    purchaseFrequency: number
  }>
  productConcerns: Array<{
    productName: string
    concerns: string[]
    severity: number
  }>
  
  // Agent Feedback
  agentRatings: Array<{
    agentName: string
    avgRating: number
    interactions: number
    lastInteraction: string
  }>
  
  // Risk Indicators
  riskScore: number
  riskFactors: string[]
  churnProbability: number
  
  // Recommendations
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    expectedImpact: string
  }>
}

interface CustomerInsightsProps {
  customerId?: string
  customerCode?: string
  showHeader?: boolean
  compact?: boolean
  context?: 'customer' | 'product' | 'route' | 'agent' | 'executive'
}

export default function CustomerInsights({ 
  customerId, 
  customerCode, 
  showHeader = true, 
  compact = false,
  context = 'customer'
}: CustomerInsightsProps) {
  const [insights, setInsights] = useState<CustomerInsight | null>(null)
  const [surveyInsights, setSurveyInsights] = useState<SurveyInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months')

  useEffect(() => {
    // Mock data - in real app, this would fetch from API
    setTimeout(() => {
      const mockInsight: CustomerInsight = {
        customerId: customerId || '1',
        customerName: 'Shoprite Lagos',
        customerCode: customerCode || 'CUST001',
        customerType: 'RETAIL',
        totalSurveys: 12,
        completedSurveys: 11,
        avgSatisfaction: 4.6,
        npsScore: 8.5,
        lastSurveyDate: '2024-09-30T14:30:00Z',
        preferredContactTime: '09:00-11:00',
        responsePattern: 'prompt',
        engagementLevel: 'high',
        feedbackQuality: 'detailed',
        overallSentiment: 'positive',
        sentimentTrend: 'improving',
        emotionalDrivers: ['Product Quality', 'Agent Professionalism', 'Delivery Reliability'],
        favoriteProducts: [
          { productName: 'Coca-Cola 500ml', rating: 4.8, purchaseFrequency: 85 },
          { productName: 'Pringles Original', rating: 4.5, purchaseFrequency: 62 },
          { productName: 'Peak Milk', rating: 4.7, purchaseFrequency: 78 }
        ],
        productConcerns: [
          { productName: 'Indomie Noodles', concerns: ['Packaging issues', 'Expiry dates'], severity: 6 }
        ],
        agentRatings: [
          { agentName: 'John Adebayo', avgRating: 4.8, interactions: 8, lastInteraction: '2024-09-30' },
          { agentName: 'Mary Okafor', avgRating: 4.2, interactions: 3, lastInteraction: '2024-09-15' }
        ],
        riskScore: 15,
        riskFactors: [],
        churnProbability: 8,
        actionItems: [
          { priority: 'medium', action: 'Address packaging concerns for Indomie products', expectedImpact: 'Improve product satisfaction by 0.3 points' },
          { priority: 'low', action: 'Maintain current service level with John Adebayo', expectedImpact: 'Sustain high satisfaction scores' }
        ]
      }

      const mockSurveyInsights: SurveyInsight[] = [
        {
          surveyId: '1',
          surveyTitle: 'Customer Satisfaction Survey Q4 2024',
          surveyType: 'customer_satisfaction',
          responseCount: 8,
          avgRating: 4.6,
          npsScore: 8.5,
          completionRate: 100,
          lastResponseDate: '2024-09-30T14:30:00Z',
          keyInsights: [
            'Consistently high satisfaction with service quality',
            'Appreciates agent professionalism and punctuality',
            'Values product variety and competitive pricing'
          ],
          sentimentScore: 85,
          topConcerns: [
            { concern: 'Occasional delivery delays', frequency: 2, severity: 'low' }
          ],
          topCompliments: [
            { compliment: 'Excellent customer service', frequency: 6 },
            { compliment: 'Professional agents', frequency: 5 },
            { compliment: 'Quality products', frequency: 7 }
          ]
        },
        {
          surveyId: '4',
          surveyTitle: 'Product Quality Feedback - Beverages',
          surveyType: 'product_feedback',
          responseCount: 3,
          avgRating: 4.3,
          npsScore: 7.8,
          completionRate: 100,
          lastResponseDate: '2024-09-25T11:20:00Z',
          keyInsights: [
            'High satisfaction with beverage quality',
            'Requests for more variety in flavors',
            'Positive feedback on packaging'
          ],
          sentimentScore: 78,
          topConcerns: [],
          topCompliments: [
            { compliment: 'Great taste and quality', frequency: 3 },
            { compliment: 'Good packaging', frequency: 2 }
          ]
        }
      ]

      setInsights(mockInsight)
      setSurveyInsights(mockSurveyInsights)
      setLoading(false)
    }, 800)
  }, [customerId, customerCode, selectedTimeframe])

  const getSentimentColor = (sentiment: string) => {
    const colors = {
      positive: 'text-green-600 bg-green-100',
      neutral: 'text-yellow-600 bg-yellow-100',
      negative: 'text-red-600 bg-red-100'
    }
    return colors[sentiment as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getTrendIcon = (trend: string) => {
    const icons = {
      improving: TrendingUp,
      stable: Activity,
      declining: TrendingDown
    }
    return icons[trend as keyof typeof icons] || Activity
  }

  const getTrendColor = (trend: string) => {
    const colors = {
      improving: 'text-green-600',
      stable: 'text-blue-600',
      declining: 'text-red-600'
    }
    return colors[trend as keyof typeof colors] || 'text-gray-600'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRiskColor = (score: number) => {
    if (score <= 20) return 'text-green-600'
    if (score <= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEngagementIcon = (level: string) => {
    const icons = {
      high: Zap,
      medium: Activity,
      low: Clock
    }
    return icons[level as keyof typeof icons] || Activity
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Insights Available</h3>
        <p className="text-gray-600">No survey data or customer feedback found for analysis.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Customer Insights</h3>
            <p className="text-gray-600">Survey feedback and behavioral analysis for {insights.customerName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{insights.avgSatisfaction}</p>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-500">/5.0</span>
                </div>
              </div>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">NPS Score</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-2xl font-bold text-blue-600">{insights.npsScore}</p>
                <ThumbsUp className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Survey Completion</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((insights.completedSurveys / insights.totalSurveys) * 100)}%
                </p>
                <span className="text-sm text-gray-500">
                  ({insights.completedSurveys}/{insights.totalSurveys})
                </span>
              </div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Score</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className={`text-2xl font-bold ${getRiskColor(insights.riskScore)}`}>
                  {insights.riskScore}%
                </p>
                <span className="text-sm text-gray-500">Low Risk</span>
              </div>
            </div>
            <AlertTriangle className={`h-8 w-8 ${getRiskColor(insights.riskScore)}`} />
          </div>
        </Card>
      </div>

      {/* Sentiment & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Sentiment Analysis</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Overall Sentiment</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(insights.overallSentiment)}`}>
                {insights.overallSentiment.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Trend</span>
              <div className="flex items-center space-x-2">
                {(() => {
                  const TrendIcon = getTrendIcon(insights.sentimentTrend)
                  return <TrendIcon className={`w-4 h-4 ${getTrendColor(insights.sentimentTrend)}`} />
                })()}
                <span className={`text-sm font-medium ${getTrendColor(insights.sentimentTrend)}`}>
                  {insights.sentimentTrend.toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 block mb-2">Emotional Drivers</span>
              <div className="flex flex-wrap gap-2">
                {insights.emotionalDrivers.map((driver, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {driver}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Engagement Profile</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Engagement Level</span>
              <div className="flex items-center space-x-2">
                {(() => {
                  const EngagementIcon = getEngagementIcon(insights.engagementLevel)
                  return <EngagementIcon className="w-4 h-4 text-blue-600" />
                })()}
                <span className="text-sm font-medium text-blue-600">
                  {insights.engagementLevel.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Response Pattern</span>
              <span className="text-sm text-gray-900">{insights.responsePattern.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Feedback Quality</span>
              <span className="text-sm text-gray-900">{insights.feedbackQuality}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Preferred Contact</span>
              <span className="text-sm text-gray-900">{insights.preferredContactTime}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Survey Insights */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Survey Insights</h4>
        <div className="space-y-4">
          {surveyInsights.map(survey => (
            <div key={survey.surveyId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">{survey.surveyTitle}</h5>
                  <p className="text-sm text-gray-500">{survey.responseCount} responses • {survey.completionRate}% completion</p>
                </div>
                <div className="flex items-center space-x-4">
                  {survey.avgRating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">{survey.avgRating}/5.0</span>
                    </div>
                  )}
                  {survey.npsScore > 0 && (
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">NPS: {survey.npsScore}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {survey.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Top Compliments</h6>
                  <div className="space-y-1">
                    {survey.topCompliments.slice(0, 3).map((compliment, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{compliment.compliment}</span>
                        <span className="text-green-600 font-medium">×{compliment.frequency}</span>
                      </div>
                    ))}
                  </div>
                  
                  {survey.topConcerns.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Concerns</h6>
                      <div className="space-y-1">
                        {survey.topConcerns.map((concern, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{concern.concern}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                concern.severity === 'high' ? 'bg-red-100 text-red-700' :
                                concern.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {concern.severity}
                              </span>
                              <span className="text-orange-600 font-medium">×{concern.frequency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Items */}
      {insights.actionItems.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Recommended Actions</h4>
          <div className="space-y-3">
            {insights.actionItems.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.expectedImpact}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Product & Agent Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Product Preferences</h4>
          <div className="space-y-3">
            {insights.favoriteProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                  <p className="text-xs text-gray-600">Purchase frequency: {product.purchaseFrequency}%</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{product.rating}</span>
                </div>
              </div>
            ))}
            
            {insights.productConcerns.map((concern, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{concern.productName}</p>
                  <p className="text-xs text-red-600">{concern.concerns.join(', ')}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">{concern.severity}/10</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Agent Feedback</h4>
          <div className="space-y-3">
            {insights.agentRatings.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.agentName}</p>
                  <p className="text-xs text-gray-600">
                    {agent.interactions} interactions • Last: {new Date(agent.lastInteraction).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{agent.avgRating}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}