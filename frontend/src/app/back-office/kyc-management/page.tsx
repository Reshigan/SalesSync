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
  Shield, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Settings,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Camera,
  Smartphone,
  Gamepad2,
  Banknote,
  Package,
  Clock,
  Star,
  Target,
  Users,
  Activity
} from 'lucide-react'

interface KYCField {
  id: string
  type: 'full_name' | 'phone_number' | 'email' | 'address' | 'id_number' | 'date_of_birth' | 'photo_id' | 'selfie' | 'mobile_number' | 'gamer_id' | 'bank_account'
  label: string
  required: boolean
  validation: {
    format?: string
    minLength?: number
    maxLength?: number
    pattern?: string
    fileTypes?: string[]
    maxFileSize?: number
  }
  helpText?: string
}

interface ProductKYCRequirement {
  id: string
  productId: string
  productSKU: string
  productName: string
  category: string
  subCategory?: string
  kycRequired: boolean
  kycLevel: 'basic' | 'standard' | 'enhanced'
  kycFields: KYCField[]
  regulatoryRequirement: boolean
  complianceNotes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Statistics
  totalSubmissions: number
  approvedSubmissions: number
  rejectedSubmissions: number
  pendingSubmissions: number
  approvalRate: number
  avgProcessingTime: number // in hours
}

interface KYCSubmission {
  id: string
  productKYCId: string
  productSKU: string
  productName: string
  customerName: string
  customerCode: string
  agentName: string
  agentCode: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'requires_review'
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  
  // KYC Data
  kycData: Record<string, any>
  documents: Array<{
    fieldId: string
    fieldType: string
    fileName: string
    fileUrl: string
    fileSize: number
    uploadedAt: string
  }>
  
  // Verification
  verificationScore: number
  riskScore: number
  flaggedReasons: string[]
  
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
}

export default function KYCManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [productKYCs, setProductKYCs] = useState<ProductKYCRequirement[]>([])
  const [kycSubmissions, setKYCSubmissions] = useState<KYCSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterKYCLevel, setFilterKYCLevel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState<'products' | 'submissions' | 'analytics'>('products')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { canCreateIn, canEditIn, canDeleteIn, canExportFrom, isAdmin } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockProductKYCs: ProductKYCRequirement[] = [
      {
        id: '1',
        productId: 'PROD001',
        productSKU: 'SIM-MTN-001',
        productName: 'MTN SIM Card',
        category: 'TELECOMMUNICATIONS',
        subCategory: 'SIM_CARDS',
        kycRequired: true,
        kycLevel: 'enhanced',
        kycFields: [
          {
            id: 'kyc1',
            type: 'full_name',
            label: 'Full Legal Name',
            required: true,
            validation: { minLength: 2, maxLength: 100 },
            helpText: 'Enter your full name as it appears on your ID'
          },
          {
            id: 'kyc2',
            type: 'phone_number',
            label: 'Primary Phone Number',
            required: true,
            validation: { pattern: '^\\+234[0-9]{10}$' },
            helpText: 'Enter your primary phone number in international format'
          },
          {
            id: 'kyc3',
            type: 'mobile_number',
            label: 'New Mobile Number (for SIM)',
            required: true,
            validation: { pattern: '^\\+234[0-9]{10}$' },
            helpText: 'The new number you want to register with this SIM'
          },
          {
            id: 'kyc4',
            type: 'id_number',
            label: 'National ID Number',
            required: true,
            validation: { minLength: 11, maxLength: 11 },
            helpText: 'Your 11-digit National Identification Number'
          },
          {
            id: 'kyc5',
            type: 'photo_id',
            label: 'Photo of ID Document',
            required: true,
            validation: { fileTypes: ['jpg', 'jpeg', 'png'], maxFileSize: 5 },
            helpText: 'Clear photo of your National ID card (front and back)'
          },
          {
            id: 'kyc6',
            type: 'selfie',
            label: 'Customer Selfie',
            required: true,
            validation: { fileTypes: ['jpg', 'jpeg', 'png'], maxFileSize: 3 },
            helpText: 'Take a clear selfie holding your ID document'
          }
        ],
        regulatoryRequirement: true,
        complianceNotes: 'Required by NCC regulations for SIM card registration',
        createdBy: 'Compliance Team',
        createdAt: '2024-08-01T10:00:00Z',
        updatedAt: '2024-09-15T14:30:00Z',
        totalSubmissions: 1247,
        approvedSubmissions: 1156,
        rejectedSubmissions: 67,
        pendingSubmissions: 24,
        approvalRate: 92.7,
        avgProcessingTime: 4.2
      },
      {
        id: '2',
        productId: 'PROD002',
        productSKU: 'GAME-BETWAY-001',
        productName: 'Betway Gaming Voucher',
        category: 'GAMING',
        subCategory: 'SPORTS_BETTING',
        kycRequired: true,
        kycLevel: 'enhanced',
        kycFields: [
          {
            id: 'kyc1',
            type: 'full_name',
            label: 'Full Name',
            required: true,
            validation: { minLength: 2, maxLength: 100 }
          },
          {
            id: 'kyc2',
            type: 'date_of_birth',
            label: 'Date of Birth',
            required: true,
            validation: {},
            helpText: 'Must be 18 years or older'
          },
          {
            id: 'kyc3',
            type: 'phone_number',
            label: 'Phone Number',
            required: true,
            validation: { pattern: '^\\+234[0-9]{10}$' }
          },
          {
            id: 'kyc4',
            type: 'gamer_id',
            label: 'Betway Account ID/Username',
            required: true,
            validation: { minLength: 3, maxLength: 50 },
            helpText: 'Your existing Betway account username or create new'
          },
          {
            id: 'kyc5',
            type: 'id_number',
            label: 'National ID Number',
            required: true,
            validation: { minLength: 11, maxLength: 11 }
          },
          {
            id: 'kyc6',
            type: 'selfie',
            label: 'Customer Photo',
            required: true,
            validation: { fileTypes: ['jpg', 'jpeg', 'png'], maxFileSize: 3 },
            helpText: 'Clear photo for age verification'
          }
        ],
        regulatoryRequirement: true,
        complianceNotes: 'Age verification required for gambling products',
        createdBy: 'Gaming Division',
        createdAt: '2024-07-15T09:00:00Z',
        updatedAt: '2024-09-20T11:15:00Z',
        totalSubmissions: 456,
        approvedSubmissions: 398,
        rejectedSubmissions: 42,
        pendingSubmissions: 16,
        approvalRate: 87.3,
        avgProcessingTime: 6.8
      },
      {
        id: '3',
        productId: 'PROD003',
        productSKU: 'FIN-OPAY-001',
        productName: 'OPay Wallet Activation',
        category: 'FINANCIAL_SERVICES',
        subCategory: 'MOBILE_MONEY',
        kycRequired: true,
        kycLevel: 'standard',
        kycFields: [
          {
            id: 'kyc1',
            type: 'full_name',
            label: 'Full Name',
            required: true,
            validation: { minLength: 2, maxLength: 100 }
          },
          {
            id: 'kyc2',
            type: 'phone_number',
            label: 'Phone Number',
            required: true,
            validation: { pattern: '^\\+234[0-9]{10}$' }
          },
          {
            id: 'kyc3',
            type: 'email',
            label: 'Email Address',
            required: false,
            validation: { format: 'email' }
          },
          {
            id: 'kyc4',
            type: 'id_number',
            label: 'BVN or National ID',
            required: true,
            validation: { minLength: 10, maxLength: 11 },
            helpText: 'Bank Verification Number (BVN) or National ID'
          },
          {
            id: 'kyc5',
            type: 'selfie',
            label: 'Customer Photo',
            required: true,
            validation: { fileTypes: ['jpg', 'jpeg', 'png'], maxFileSize: 3 }
          }
        ],
        regulatoryRequirement: true,
        complianceNotes: 'CBN KYC requirements for financial services',
        createdBy: 'Financial Services',
        createdAt: '2024-06-01T08:00:00Z',
        updatedAt: '2024-09-10T16:45:00Z',
        totalSubmissions: 892,
        approvedSubmissions: 834,
        rejectedSubmissions: 38,
        pendingSubmissions: 20,
        approvalRate: 93.5,
        avgProcessingTime: 2.1
      }
    ]

    const mockSubmissions: KYCSubmission[] = [
      {
        id: '1',
        productKYCId: '1',
        productSKU: 'SIM-MTN-001',
        productName: 'MTN SIM Card',
        customerName: 'Adebayo Johnson',
        customerCode: 'CUST001',
        agentName: 'John Adebayo',
        agentCode: 'AGT001',
        submittedAt: '2024-09-30T14:30:00Z',
        status: 'pending',
        kycData: {
          'kyc1': 'Adebayo Johnson Olumide',
          'kyc2': '+2348123456789',
          'kyc3': '+2347098765432',
          'kyc4': '12345678901'
        },
        documents: [
          {
            fieldId: 'kyc5',
            fieldType: 'photo_id',
            fileName: 'national_id_front.jpg',
            fileUrl: '/uploads/kyc/national_id_front_123.jpg',
            fileSize: 2.4,
            uploadedAt: '2024-09-30T14:32:00Z'
          },
          {
            fieldId: 'kyc6',
            fieldType: 'selfie',
            fileName: 'customer_selfie.jpg',
            fileUrl: '/uploads/kyc/selfie_123.jpg',
            fileSize: 1.8,
            uploadedAt: '2024-09-30T14:33:00Z'
          }
        ],
        verificationScore: 85,
        riskScore: 15,
        flaggedReasons: [],
        location: {
          latitude: 6.5244,
          longitude: 3.3792,
          address: '123 Victoria Island, Lagos'
        },
        deviceInfo: {
          deviceId: 'DEVICE-001',
          platform: 'Android',
          appVersion: '2.1.0'
        }
      },
      {
        id: '2',
        productKYCId: '2',
        productSKU: 'GAME-BETWAY-001',
        productName: 'Betway Gaming Voucher',
        customerName: 'Sarah Okafor',
        customerCode: 'CUST002',
        agentName: 'Mary Okafor',
        agentCode: 'AGT002',
        submittedAt: '2024-09-29T16:15:00Z',
        status: 'approved',
        reviewedBy: 'Compliance Officer',
        reviewedAt: '2024-09-30T09:20:00Z',
        reviewNotes: 'All documents verified successfully. Age confirmed as 25 years.',
        kycData: {
          'kyc1': 'Sarah Okafor',
          'kyc2': '1995-03-15',
          'kyc3': '+2348987654321',
          'kyc4': 'sarah_okafor_bet',
          'kyc5': '98765432109'
        },
        documents: [
          {
            fieldId: 'kyc6',
            fieldType: 'selfie',
            fileName: 'customer_photo.jpg',
            fileUrl: '/uploads/kyc/photo_456.jpg',
            fileSize: 2.1,
            uploadedAt: '2024-09-29T16:17:00Z'
          }
        ],
        verificationScore: 94,
        riskScore: 8,
        flaggedReasons: [],
        location: {
          latitude: 6.6018,
          longitude: 3.3515,
          address: '456 Ikeja, Lagos'
        },
        deviceInfo: {
          deviceId: 'DEVICE-002',
          platform: 'iOS',
          appVersion: '2.1.0'
        }
      }
    ]

    setTimeout(() => {
      setProductKYCs(mockProductKYCs)
      setKYCSubmissions(mockSubmissions)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredProductKYCs = productKYCs.filter(kyc => {
    const matchesSearch = kyc.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.productSKU.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || kyc.category === filterCategory
    const matchesKYCLevel = filterKYCLevel === 'all' || kyc.kycLevel === filterKYCLevel
    
    return matchesSearch && matchesCategory && matchesKYCLevel
  })

  const filteredSubmissions = kycSubmissions.filter(submission => {
    const matchesSearch = submission.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.productName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getKYCLevelColor = (level: string) => {
    const colors = {
      basic: 'bg-green-100 text-green-800',
      standard: 'bg-yellow-100 text-yellow-800',
      enhanced: 'bg-red-100 text-red-800'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      requires_review: 'bg-orange-100 text-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      requires_review: AlertTriangle
    }
    return icons[status as keyof typeof icons] || Clock
  }

  const getKYCFieldIcon = (fieldType: string) => {
    const icons = {
      full_name: User,
      phone_number: Phone,
      email: Mail,
      address: MapPin,
      id_number: FileText,
      date_of_birth: Calendar,
      photo_id: Camera,
      selfie: Camera,
      mobile_number: Smartphone,
      gamer_id: Gamepad2,
      bank_account: Banknote
    }
    return icons[fieldType as keyof typeof icons] || FileText
  }

  const productKYCColumns = [
    {
      header: 'Product Details',
      accessor: 'product',
      cell: ({ row }: { row: ProductKYCRequirement }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.productName}</div>
            <div className="text-sm text-gray-500">{row.productSKU}</div>
            <div className="text-xs text-gray-400">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'KYC Configuration',
      accessor: 'config',
      cell: ({ row }: { row: ProductKYCRequirement }) => (
        <div className="space-y-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getKYCLevelColor(row.kycLevel)}`}>
            {row.kycLevel.toUpperCase()} KYC
          </span>
          <div className="text-sm text-gray-900">
            {row.kycFields.length} fields required
          </div>
          {row.regulatoryRequirement && (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600">Regulatory</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'KYC Fields',
      accessor: 'fields',
      cell: ({ row }: { row: ProductKYCRequirement }) => (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {row.kycFields.slice(0, 4).map((field, index) => {
              const Icon = getKYCFieldIcon(field.type)
              return (<ErrorBoundary>

                <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                  <Icon className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-700">{field.type.replace('_', ' ')}</span>
                </div>
              
</ErrorBoundary>)
            })}
            {row.kycFields.length > 4 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{row.kycFields.length - 4}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Submission Stats',
      accessor: 'stats',
      cell: ({ row }: { row: ProductKYCRequirement }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.totalSubmissions.toLocaleString()} total
          </div>
          <div className="text-sm text-green-600">
            {row.approvalRate}% approved
          </div>
          <div className="text-xs text-gray-500">
            Avg: {row.avgProcessingTime}h processing
          </div>
          <div className="flex space-x-2 text-xs">
            <span className="text-yellow-600">{row.pendingSubmissions} pending</span>
            <span className="text-red-600">{row.rejectedSubmissions} rejected</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Compliance',
      accessor: 'compliance',
      cell: ({ row }: { row: ProductKYCRequirement }) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-900">
            {row.regulatoryRequirement ? 'Required' : 'Optional'}
          </div>
          {row.complianceNotes && (
            <div className="text-xs text-gray-500 max-w-xs truncate" title={row.complianceNotes}>
              {row.complianceNotes}
            </div>
          )}
          <div className="text-xs text-gray-400">
            Updated: {new Date(row.updatedAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: ProductKYCRequirement }) => (
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Activity className="w-4 h-4" />
          </Button>
          {canEditIn('kyc') && (
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteIn('kyc') && (
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }
  ]

  const submissionColumns = [
    {
      header: 'Submission Details',
      accessor: 'submission',
      cell: ({ row }: { row: KYCSubmission }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.customerName}</div>
            <div className="text-sm text-gray-500">{row.customerCode}</div>
            <div className="text-xs text-gray-400">
              {new Date(row.submittedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Product & Agent',
      accessor: 'context',
      cell: ({ row }: { row: KYCSubmission }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">{row.productName}</div>
          <div className="text-xs text-gray-500">{row.productSKU}</div>
          <div className="text-xs text-blue-600">Agent: {row.agentName}</div>
        </div>
      ),
    },
    {
      header: 'Status & Review',
      accessor: 'status',
      cell: ({ row }: { row: KYCSubmission }) => {
        const StatusIcon = getStatusIcon(row.status)
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <StatusIcon className="w-4 h-4" />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                {row.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {row.reviewedBy && (
              <div className="text-xs text-gray-500">
                Reviewed by: {row.reviewedBy}
              </div>
            )}
            {row.reviewedAt && (
              <div className="text-xs text-gray-400">
                {new Date(row.reviewedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )
      },
    },
    {
      header: 'Verification Scores',
      accessor: 'scores',
      cell: ({ row }: { row: KYCSubmission }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Verification:</span>
            <span className={`text-sm font-medium ${
              row.verificationScore >= 90 ? 'text-green-600' :
              row.verificationScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {row.verificationScore}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Risk:</span>
            <span className={`text-sm font-medium ${
              row.riskScore <= 20 ? 'text-green-600' :
              row.riskScore <= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {row.riskScore}%
            </span>
          </div>
          {row.flaggedReasons.length > 0 && (
            <div className="text-xs text-red-600">
              {row.flaggedReasons.length} flags
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Documents',
      accessor: 'documents',
      cell: ({ row }: { row: KYCSubmission }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.documents.length} files
          </div>
          {row.documents.slice(0, 2).map((doc, index) => (
            <div key={index} className="text-xs text-gray-500">
              {doc.fieldType.replace('_', ' ')}: {doc.fileName}
            </div>
          ))}
          {row.documents.length > 2 && (
            <div className="text-xs text-gray-400">
              +{row.documents.length - 2} more
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: KYCSubmission }) => (
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
          </div>
          <SkeletonTable rows={8} cols={6} />
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
            <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
            <p className="text-gray-600">Manage product KYC requirements and customer verification submissions</p>
          </div>
          <div className="flex space-x-3">
            {canExportFrom('kyc') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {canCreateIn('kyc') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add KYC Requirement
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Product KYC ({productKYCs.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Submissions ({kycSubmissions.length})
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
                <p className="text-sm font-medium text-gray-600">Products with KYC</p>
                <p className="text-2xl font-bold text-red-600">{productKYCs.filter(p => p.kycRequired).length}</p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {kycSubmissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(productKYCs.reduce((sum, p) => sum + p.approvalRate, 0) / productKYCs.length)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {productKYCs.reduce((sum, p) => sum + p.totalSubmissions, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder={activeTab === 'products' ? "Search products..." : "Search submissions..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab === 'products' ? (
                <>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="TELECOMMUNICATIONS">Telecommunications</option>
                    <option value="GAMING">Gaming</option>
                    <option value="FINANCIAL_SERVICES">Financial Services</option>
                    <option value="VOUCHERS">Vouchers</option>
                  </select>
                  <select
                    value={filterKYCLevel}
                    onChange={(e) => setFilterKYCLevel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All KYC Levels</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="enhanced">Enhanced</option>
                  </select>
                </>
              ) : (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="requires_review">Requires Review</option>
                </select>
              )}
            </div>
          </div>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'products' && (
          <Card>
            <DataTable
              data={filteredProductKYCs}
              columns={productKYCColumns}
            />
          </Card>
        )}

        {activeTab === 'submissions' && (
          <Card>
            <DataTable
              data={filteredSubmissions}
              columns={submissionColumns}
            />
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">KYC Analytics</h3>
            <p className="text-gray-600">Comprehensive KYC analytics and compliance reporting coming soon...</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}