'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  BarChart3,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Target,
  Award,
  FileText,
  Smartphone,
  CreditCard,
  User,
  Shield,
  Camera,
  MapPin,
  Phone,
  Mail,
  Gamepad2,
  Banknote
} from 'lucide-react'

interface Survey {
  id: string
  title: string
  description: string
  type: 'customer_satisfaction' | 'product_feedback' | 'market_research' | 'agent_performance' | 'compliance_check'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  mandatory: boolean
  targetAudience: 'all_agents' | 'specific_routes' | 'specific_customers' | 'product_buyers' | 'all_customers'
  startDate: string
  endDate: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Survey Configuration
  questions: SurveyQuestion[]
  productSpecific: boolean
  productCategories: string[]
  triggerEvent?: 'after_purchase' | 'after_visit' | 'periodic' | 'manual'
  
  // Response Statistics
  totalResponses: number
  completionRate: number
  avgRating: number
  npsScore: number
  
  // Targeting
  regions: string[]
  areas: string[]
  routes: string[]
  agents: string[]
  customers: string[]
}

interface SurveyQuestion {
  id: string
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'number' | 'date' | 'photo' | 'location'
  question: string
  required: boolean
  options?: string[]
  minRating?: number
  maxRating?: number
  placeholder?: string
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

// KYC is handled separately at the product level, not in surveys
interface ProductKYCRequirement {
  productId: string
  productSKU: string
  productName: string
  category: string
  kycRequired: boolean
  kycFields: Array<{
    type: 'full_name' | 'phone_number' | 'email' | 'address' | 'id_number' | 'date_of_birth' | 'photo_id' | 'selfie' | 'mobile_number' | 'gamer_id' | 'bank_account'
    label: string
    required: boolean
    validation: {
      format?: string
      minLength?: number
      maxLength?: number
      pattern?: string
    }
  }>
}

interface SurveyResponse {
  id: string
  surveyId: string
  surveyTitle: string
  respondentType: 'agent' | 'customer'
  respondentName: string
  respondentCode: string
  agentName: string
  agentCode: string
  customerName?: string
  customerCode?: string
  routeName: string
  areaName: string
  regionName: string
  submittedAt: string
  completionTime: number
  
  // Response Data
  answers: Record<string, any>
  rating?: number
  npsScore?: number
  
  // Context
  location: {
    latitude: number
    longitude: number
    address: string
  }
  deviceInfo: {
    deviceId: string
    platform: string
    appVersion: string
  }
  
  // Product Context (if applicable)
  productsPurchased?: Array<{
    sku: string
    name: string
    category: string
    quantity: number
    value: number
  }>
  
  // Quality Metrics
  qualityScore: number
  flagged: boolean
  flagReasons: string[]
}

export default function SurveyManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [activeTab, setActiveTab] = useState<'surveys' | 'responses' | 'analytics'>('surveys')

  const { canCreateIn, canEditIn, canDeleteIn, canExportFrom, isAdmin } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockSurveys: Survey[] = [
      {
        id: '1',
        title: 'Customer Satisfaction Survey Q4 2024',
        description: 'Quarterly customer satisfaction assessment focusing on service quality and product satisfaction',
        type: 'customer_satisfaction',
        status: 'active',
        mandatory: true,
        targetAudience: 'all_customers',
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        createdBy: 'Admin User',
        createdAt: '2024-09-25T10:00:00Z',
        updatedAt: '2024-09-30T15:30:00Z',
        questions: [
          {
            id: 'q1',
            type: 'rating',
            question: 'How satisfied are you with our service quality?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            question: 'Which aspect of our service needs improvement?',
            required: false,
            options: ['Product Quality', 'Delivery Time', 'Agent Behavior', 'Pricing', 'Other']
          },
          {
            id: 'q3',
            type: 'text',
            question: 'Any additional comments or suggestions?',
            required: false,
            placeholder: 'Please share your thoughts...',
            validation: { maxLength: 500 }
          }
        ],
        productSpecific: false,
        productCategories: [],
        triggerEvent: 'after_visit',
        totalResponses: 1247,
        completionRate: 87.3,
        avgRating: 4.2,
        npsScore: 7.8,
        regions: ['all'],
        areas: ['all'],
        routes: ['all'],
        agents: ['all'],
        customers: ['all']
      },
      {
        id: '2',
        title: 'Telecommunications Product Feedback',
        description: 'Collect feedback on SIM cards, airtime, and data services',
        type: 'product_feedback',
        status: 'active',
        mandatory: false,
        targetAudience: 'product_buyers',
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        createdBy: 'Product Team',
        createdAt: '2024-08-28T09:00:00Z',
        updatedAt: '2024-09-30T11:20:00Z',
        questions: [
          {
            id: 'q1',
            type: 'rating',
            question: 'How would you rate the network quality?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            question: 'Which service do you use most?',
            required: true,
            options: ['Voice Calls', 'SMS', 'Data/Internet', 'Mobile Money']
          },
          {
            id: 'q3',
            type: 'text',
            question: 'Any issues with the service?',
            required: false,
            placeholder: 'Describe any problems...',
            validation: { maxLength: 300 }
          }
        ],
        productSpecific: true,
        productCategories: ['TELECOMMUNICATIONS'],
        triggerEvent: 'after_purchase',
        totalResponses: 892,
        completionRate: 94.1,
        avgRating: 4.1,
        npsScore: 7.2,
        regions: ['all'],
        areas: ['all'],
        routes: ['all'],
        agents: ['all'],
        customers: []
      },
      {
        id: '3',
        title: 'Gaming & Entertainment Feedback',
        description: 'Feedback on gaming vouchers and entertainment products',
        type: 'product_feedback',
        status: 'active',
        mandatory: false,
        targetAudience: 'product_buyers',
        startDate: '2024-09-15',
        endDate: '2025-09-14',
        createdBy: 'Gaming Division',
        createdAt: '2024-09-10T14:00:00Z',
        updatedAt: '2024-09-28T16:45:00Z',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            question: 'Which gaming platform do you primarily use?',
            required: true,
            options: ['Mobile Games', 'Console Games', 'PC Games', 'Online Casino', 'Sports Betting']
          },
          {
            id: 'q2',
            type: 'rating',
            question: 'How satisfied are you with the voucher redemption process?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q3',
            type: 'text',
            question: 'What other gaming products would you like to see?',
            required: false,
            placeholder: 'Suggest new gaming products...',
            validation: { maxLength: 200 }
          }
        ],
        productSpecific: true,
        productCategories: ['GAMING', 'ENTERTAINMENT'],
        triggerEvent: 'after_purchase',
        totalResponses: 456,
        completionRate: 91.7,
        avgRating: 4.3,
        npsScore: 8.1,
        regions: ['all'],
        areas: ['all'],
        routes: ['all'],
        agents: ['all'],
        customers: []
      },
      {
        id: '4',
        title: 'Product Quality Feedback - Beverages',
        description: 'Collect feedback on beverage product quality and customer preferences',
        type: 'product_feedback',
        status: 'active',
        mandatory: false,
        targetAudience: 'specific_customers',
        startDate: '2024-10-01',
        endDate: '2024-11-30',
        createdBy: 'Product Team',
        createdAt: '2024-09-20T11:30:00Z',
        updatedAt: '2024-09-29T09:15:00Z',
        questions: [
          {
            id: 'q1',
            type: 'rating',
            question: 'How would you rate the taste of our beverages?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            question: 'Which beverage category do you prefer?',
            required: true,
            options: ['Soft Drinks', 'Juices', 'Energy Drinks', 'Water', 'Tea/Coffee']
          },
          {
            id: 'q3',
            type: 'text',
            question: 'What new flavors would you like to see?',
            required: false,
            placeholder: 'Suggest new flavors...',
            validation: { maxLength: 200 }
          },
          {
            id: 'q4',
            type: 'photo',
            question: 'Please take a photo of the product packaging',
            required: false
          }
        ],
        productSpecific: true,
        productCategories: ['BEVERAGES'],
        triggerEvent: 'after_purchase',
        totalResponses: 234,
        completionRate: 78.9,
        avgRating: 4.1,
        npsScore: 6.8,
        regions: ['sw', 'ss'],
        areas: ['lagos-metro', 'ph-metro'],
        routes: [],
        agents: [],
        customers: ['CUST001', 'CUST002', 'CUST003']
      },
      {
        id: '5',
        title: 'Agent Performance Evaluation',
        description: 'Monthly evaluation of field agent performance by customers',
        type: 'agent_performance',
        status: 'active',
        mandatory: true,
        targetAudience: 'all_customers',
        startDate: '2024-10-01',
        endDate: '2024-10-31',
        createdBy: 'HR Department',
        createdAt: '2024-09-25T08:00:00Z',
        updatedAt: '2024-09-30T12:00:00Z',
        questions: [
          {
            id: 'q1',
            type: 'rating',
            question: 'How would you rate the agent\'s professionalism?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q2',
            type: 'rating',
            question: 'How would you rate the agent\'s product knowledge?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q3',
            type: 'rating',
            question: 'How would you rate the agent\'s punctuality?',
            required: true,
            minRating: 1,
            maxRating: 5
          },
          {
            id: 'q4',
            type: 'yes_no',
            question: 'Would you recommend this agent to other customers?',
            required: true
          },
          {
            id: 'q5',
            type: 'text',
            question: 'Any specific feedback about the agent?',
            required: false,
            placeholder: 'Share your thoughts about the agent...',
            validation: { maxLength: 300 }
          }
        ],
        productSpecific: false,
        productCategories: [],
        triggerEvent: 'after_visit',
        totalResponses: 892,
        completionRate: 85.4,
        avgRating: 4.3,
        npsScore: 7.9,
        regions: ['all'],
        areas: ['all'],
        routes: ['all'],
        agents: ['all'],
        customers: ['all']
      }
    ]

    const mockResponses: SurveyResponse[] = [
      {
        id: '1',
        surveyId: '1',
        surveyTitle: 'Customer Satisfaction Survey Q4 2024',
        respondentType: 'customer',
        respondentName: 'Shoprite Lagos',
        respondentCode: 'CUST001',
        agentName: 'John Adebayo',
        agentCode: 'AGT001',
        customerName: 'Shoprite Lagos',
        customerCode: 'CUST001',
        routeName: 'Lagos Central',
        areaName: 'Lagos Metro',
        regionName: 'South West',
        submittedAt: '2024-09-30T14:45:00Z',
        completionTime: 180,
        answers: {
          'q1': 5,
          'q2': 'Agent Behavior',
          'q3': 'Excellent service, very professional agent. Keep up the good work!'
        },
        rating: 5,
        npsScore: 9,
        location: {
          latitude: 6.5244,
          longitude: 3.3792,
          address: '123 Victoria Island, Lagos'
        },
        deviceInfo: {
          deviceId: 'DEVICE-001',
          platform: 'Android',
          appVersion: '2.1.0'
        },
        productsPurchased: [
          { sku: 'BEV001', name: 'Coca-Cola 500ml', category: 'BEVERAGES', quantity: 50, value: 12500 },
          { sku: 'SNK002', name: 'Pringles Original', category: 'SNACKS', quantity: 13, value: 3250 }
        ],
        qualityScore: 95,
        flagged: false,
        flagReasons: []
      },
      {
        id: '2',
        surveyId: '2',
        surveyTitle: 'Telecommunications Product Feedback',
        respondentType: 'customer',
        respondentName: 'Individual Customer',
        respondentCode: 'IND001',
        agentName: 'Mary Okafor',
        agentCode: 'AGT002',
        routeName: 'Lagos West',
        areaName: 'Lagos Metro',
        regionName: 'South West',
        submittedAt: '2024-09-30T16:20:00Z',
        completionTime: 180,
        answers: {
          'q1': 4,
          'q2': 'Data/Internet',
          'q3': 'Network is sometimes slow in the evenings'
        },
        rating: 4,
        npsScore: 7,
        location: {
          latitude: 6.6018,
          longitude: 3.3515,
          address: '456 Ikeja Industrial Estate'
        },
        deviceInfo: {
          deviceId: 'DEVICE-002',
          platform: 'iOS',
          appVersion: '2.1.0'
        },
        productsPurchased: [
          { sku: 'SIM001', name: 'MTN SIM Card', category: 'TELECOMMUNICATIONS', quantity: 1, value: 200 }
        ],
        qualityScore: 88,
        flagged: false,
        flagReasons: []
      }
    ]

    setTimeout(() => {
      setSurveys(mockSurveys)
      setResponses(mockResponses)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || survey.status === filterStatus
    const matchesType = filterType === 'all' || survey.type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: FileText,
      active: Play,
      paused: Pause,
      completed: CheckCircle,
      archived: XCircle
    }
    return icons[status as keyof typeof icons] || FileText
  }

  const getTypeColor = (type: string) => {
    const colors = {
      customer_satisfaction: 'bg-blue-100 text-blue-800',
      product_feedback: 'bg-green-100 text-green-800',
      market_research: 'bg-purple-100 text-purple-800',
      agent_performance: 'bg-indigo-100 text-indigo-800',
      compliance_check: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }



  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey)
    setShowEditModal(true)
  }

  const handleDelete = (surveyId: string) => {
    if (confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      setSurveys(surveys.filter(s => s.id !== surveyId))
    }
  }

  const handleStatusChange = (surveyId: string, newStatus: string) => {
    setSurveys(surveys.map(s => 
      s.id === surveyId 
        ? { ...s, status: newStatus as any, updatedAt: new Date().toISOString() }
        : s
    ))
  }

  const handleDuplicate = (survey: Survey) => {
    const duplicatedSurvey = {
      ...survey,
      id: Date.now().toString(),
      title: `${survey.title} (Copy)`,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalResponses: 0,
      completionRate: 0,
      avgRating: 0,
      npsScore: 0
    }
    setSurveys([duplicatedSurvey, ...surveys])
  }

  const surveyColumns = [
    {
      header: 'Survey Details',
      accessor: 'survey',
      cell: ({ row }: { row: Survey }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.title}</div>
            <div className="text-sm text-gray-500 max-w-xs truncate">{row.description}</div>
            <div className="text-xs text-gray-400">
              Created: {new Date(row.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type & Status',
      accessor: 'typeStatus',
      cell: ({ row }: { row: Survey }) => {
        const StatusIcon = getStatusIcon(row.status)
        return (<ErrorBoundary>

          <div className="space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(row.type)}`}>
              {row.type.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex items-center space-x-1">
              <StatusIcon className="w-4 h-4" />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                {row.status.toUpperCase()}
              </span>
            </div>
          </div>
        
</ErrorBoundary>)
      },
    },
    {
      header: 'Configuration',
      accessor: 'config',
      cell: ({ row }: { row: Survey }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Target className="w-3 h-3 text-gray-400" />
            <span className={`text-xs px-2 py-1 rounded ${row.mandatory ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {row.mandatory ? 'Mandatory' : 'Optional'}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {row.questions.length} questions
          </div>
          {row.productSpecific && (
            <div className="text-xs text-purple-600">
              Product-specific
            </div>
          )}
          {row.triggerEvent && (
            <div className="text-xs text-blue-600">
              Trigger: {row.triggerEvent.replace('_', ' ')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Schedule',
      accessor: 'schedule',
      cell: ({ row }: { row: Survey }) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-900">
            {new Date(row.startDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-600">
            to {new Date(row.endDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {Math.ceil((new Date(row.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
          </div>
        </div>
      ),
    },
    {
      header: 'Responses',
      accessor: 'responses',
      cell: ({ row }: { row: Survey }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.totalResponses.toLocaleString()}
          </div>
          <div className="text-sm text-green-600">
            {row.completionRate}% completion
          </div>
          {row.avgRating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-gray-600">{row.avgRating}/5.0</span>
            </div>
          )}
          {row.npsScore > 0 && (
            <div className="flex items-center space-x-1">
              <ThumbsUp className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">NPS: {row.npsScore}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Target Audience',
      accessor: 'audience',
      cell: ({ row }: { row: Survey }) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-900">
            {row.targetAudience.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-xs text-gray-500">
            {row.regions.includes('all') ? 'All Regions' : `${row.regions.length} regions`}
          </div>
          {row.agents.length > 0 && !row.agents.includes('all') && (
            <div className="text-xs text-blue-600">
              {row.agents.length} specific agents
            </div>
          )}
          {row.customers.length > 0 && (
            <div className="text-xs text-green-600">
              {row.customers.length} specific customers
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: Survey }) => (
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <BarChart3 className="w-4 h-4" />
          </Button>
          {canEditIn('surveys') && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleDuplicate(row)}>
            <Copy className="w-4 h-4" />
          </Button>
          {row.status === 'active' ? (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleStatusChange(row.id, 'paused')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Pause className="w-4 h-4" />
            </Button>
          ) : row.status === 'paused' ? (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleStatusChange(row.id, 'active')}
              className="text-green-600 hover:text-green-700"
            >
              <Play className="w-4 h-4" />
            </Button>
          ) : null}
          {canDeleteIn('surveys') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Survey Management</h1>
          </div>
          <SkeletonTable rows={8} cols={7} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Survey Management</h1>
            <p className="text-gray-600">Create and manage surveys, KYC verification, and customer feedback collection</p>
          </div>
          <div className="flex space-x-3">
            {canExportFrom('surveys') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {canCreateIn('surveys') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Survey
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('surveys')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'surveys'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Surveys ({surveys.length})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'responses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Responses ({responses.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold text-green-600">
                  {surveys.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-purple-600">
                  {surveys.reduce((sum, s) => sum + s.totalResponses, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(surveys.reduce((sum, s) => sum + s.completionRate, 0) / surveys.length)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        {activeTab === 'surveys' && (
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search surveys by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="customer_satisfaction">Customer Satisfaction</option>
                  <option value="product_feedback">Product Feedback</option>
                  <option value="market_research">Market Research</option>
                  <option value="agent_performance">Agent Performance</option>
                  <option value="compliance_check">Compliance Check</option>
                </select>
              </div>
            </div>

            {selectedSurveys.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedSurveys.length} survey(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Activate Selected
                  </Button>
                  <Button size="sm" variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Selected
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Content based on active tab */}
        {activeTab === 'surveys' && (
          <Card>
            <DataTable
              data={filteredSurveys}
              columns={surveyColumns}
            />
          </Card>
        )}

        {activeTab === 'responses' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Survey Responses</h3>
            <p className="text-gray-600">Survey response management and analysis coming soon...</p>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Survey Analytics</h3>
            <p className="text-gray-600">Comprehensive survey analytics and insights coming soon...</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}