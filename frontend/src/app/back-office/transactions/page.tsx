'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner, SkeletonTable } from '@/components/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  User,
  Calendar,
  MapPin,
  FileText,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Ban,
  CheckCheck,
  AlertCircle,
  Smartphone,
  Banknote,
  Receipt,
  History,
  Shield,
  Activity,
  Settings,
  Zap,
  Target
} from 'lucide-react'

interface Transaction {
  id: string
  transactionNumber: string
  type: 'sale' | 'payment' | 'return' | 'adjustment' | 'commission'
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'disputed' | 'refunded'
  amount: number
  currency: string
  customerName: string
  customerCode: string
  agentName: string
  agentCode: string
  routeName: string
  areaName: string
  regionName: string
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'credit'
  transactionDate: string
  processedDate: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  deviceInfo: {
    deviceId: string
    appVersion: string
    platform: string
  }
  items?: Array<{
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }>
  notes: string
  errorMessage?: string
  auditTrail: Array<{
    timestamp: string
    action: string
    user: string
    details: string
  }>
  riskScore: number
  fraudFlags: string[]
  canEdit: boolean
  canCancel: boolean
  canRefund: boolean
}

interface TransactionSummary {
  totalTransactions: number
  totalValue: number
  completedTransactions: number
  failedTransactions: number
  disputedTransactions: number
  pendingTransactions: number
  avgTransactionValue: number
  successRate: number
}

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [dateRange, setDateRange] = useState('today')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selectedTransactionForAudit, setSelectedTransactionForAudit] = useState<Transaction | null>(null)

  const { canEditIn, canDeleteIn, canExportFrom, isAdmin } = usePermissions()

  // Mock data
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        transactionNumber: 'TXN-2024-001234',
        type: 'sale',
        status: 'completed',
        amount: 15750,
        currency: 'NGN',
        customerName: 'Shoprite Lagos',
        customerCode: 'CUST001',
        agentName: 'John Adebayo',
        agentCode: 'AGT001',
        routeName: 'Lagos Central',
        areaName: 'Lagos Metro',
        regionName: 'South West',
        paymentMethod: 'cash',
        transactionDate: '2024-09-30T14:30:00Z',
        processedDate: '2024-09-30T14:31:15Z',
        location: {
          latitude: 6.5244,
          longitude: 3.3792,
          address: '123 Victoria Island, Lagos'
        },
        deviceInfo: {
          deviceId: 'DEVICE-001',
          appVersion: '2.1.0',
          platform: 'Android'
        },
        items: [
          { productName: 'Coca-Cola 500ml', quantity: 50, unitPrice: 250, total: 12500 },
          { productName: 'Pringles Original', quantity: 13, unitPrice: 250, total: 3250 }
        ],
        notes: 'Regular delivery, customer satisfied',
        auditTrail: [
          { timestamp: '2024-09-30T14:30:00Z', action: 'CREATED', user: 'AGT001', details: 'Transaction initiated by agent' },
          { timestamp: '2024-09-30T14:31:15Z', action: 'COMPLETED', user: 'SYSTEM', details: 'Payment processed successfully' }
        ],
        riskScore: 15,
        fraudFlags: [],
        canEdit: true,
        canCancel: false,
        canRefund: true
      },
      {
        id: '2',
        transactionNumber: 'TXN-2024-001235',
        type: 'payment',
        status: 'failed',
        amount: 25000,
        currency: 'NGN',
        customerName: 'Konga Distribution',
        customerCode: 'CUST002',
        agentName: 'Mary Okafor',
        agentCode: 'AGT002',
        routeName: 'Lagos West',
        areaName: 'Lagos Metro',
        regionName: 'South West',
        paymentMethod: 'transfer',
        transactionDate: '2024-09-30T16:45:00Z',
        processedDate: '2024-09-30T16:46:30Z',
        location: {
          latitude: 6.6018,
          longitude: 3.3515,
          address: '456 Ikeja Industrial Estate'
        },
        deviceInfo: {
          deviceId: 'DEVICE-002',
          appVersion: '2.1.0',
          platform: 'iOS'
        },
        notes: 'Payment failed due to network timeout',
        errorMessage: 'Network timeout after 30 seconds. Bank API unreachable.',
        auditTrail: [
          { timestamp: '2024-09-30T16:45:00Z', action: 'CREATED', user: 'AGT002', details: 'Payment transaction initiated' },
          { timestamp: '2024-09-30T16:46:30Z', action: 'FAILED', user: 'SYSTEM', details: 'Network timeout - bank API unreachable' },
          { timestamp: '2024-09-30T17:15:00Z', action: 'REVIEWED', user: 'ADMIN001', details: 'Admin reviewed failed transaction' }
        ],
        riskScore: 35,
        fraudFlags: ['NETWORK_TIMEOUT'],
        canEdit: true,
        canCancel: true,
        canRefund: false
      },
      {
        id: '3',
        transactionNumber: 'TXN-2024-001236',
        type: 'return',
        status: 'disputed',
        amount: -8500,
        currency: 'NGN',
        customerName: 'Best Buy Stores',
        customerCode: 'CUST003',
        agentName: 'Ahmed Hassan',
        agentCode: 'AGT003',
        routeName: 'Abuja Central',
        areaName: 'FCT Metro',
        regionName: 'North Central',
        paymentMethod: 'cash',
        transactionDate: '2024-09-29T11:20:00Z',
        processedDate: '2024-09-29T11:25:45Z',
        location: {
          latitude: 9.0579,
          longitude: 7.4951,
          address: '789 Wuse II, Abuja'
        },
        deviceInfo: {
          deviceId: 'DEVICE-003',
          appVersion: '2.0.8',
          platform: 'Android'
        },
        items: [
          { productName: 'Expired Milk Products', quantity: 34, unitPrice: 250, total: 8500 }
        ],
        notes: 'Customer claims products were expired on delivery. Requires investigation.',
        auditTrail: [
          { timestamp: '2024-09-29T11:20:00Z', action: 'CREATED', user: 'AGT003', details: 'Return transaction initiated' },
          { timestamp: '2024-09-29T11:25:45Z', action: 'DISPUTED', user: 'CUST003', details: 'Customer disputed return - claims expired products' },
          { timestamp: '2024-09-29T14:30:00Z', action: 'ESCALATED', user: 'ADMIN002', details: 'Escalated to quality control team' },
          { timestamp: '2024-09-30T09:15:00Z', action: 'UNDER_REVIEW', user: 'QC001', details: 'Quality control investigation started' }
        ],
        riskScore: 75,
        fraudFlags: ['DISPUTED_RETURN', 'QUALITY_ISSUE'],
        canEdit: true,
        canCancel: false,
        canRefund: false
      },
      {
        id: '4',
        transactionNumber: 'TXN-2024-001237',
        type: 'sale',
        status: 'pending',
        amount: 45000,
        currency: 'NGN',
        customerName: 'Metro Mart',
        customerCode: 'CUST004',
        agentName: 'Sarah Johnson',
        agentCode: 'AGT004',
        routeName: 'Port Harcourt East',
        areaName: 'PH Metro',
        regionName: 'South South',
        paymentMethod: 'card',
        transactionDate: '2024-09-30T18:20:00Z',
        processedDate: '2024-09-30T18:20:00Z',
        location: {
          latitude: 4.8156,
          longitude: 7.0498,
          address: '321 Trans Amadi, Port Harcourt'
        },
        deviceInfo: {
          deviceId: 'DEVICE-004',
          appVersion: '2.1.0',
          platform: 'Android'
        },
        items: [
          { productName: 'Detergent Bundle', quantity: 20, unitPrice: 1500, total: 30000 },
          { productName: 'Soap Pack', quantity: 30, unitPrice: 500, total: 15000 }
        ],
        notes: 'Large order pending payment confirmation',
        auditTrail: [
          { timestamp: '2024-09-30T18:20:00Z', action: 'CREATED', user: 'AGT004', details: 'Large order transaction initiated' },
          { timestamp: '2024-09-30T18:21:00Z', action: 'PENDING', user: 'SYSTEM', details: 'Awaiting payment gateway confirmation' }
        ],
        riskScore: 25,
        fraudFlags: ['LARGE_AMOUNT'],
        canEdit: true,
        canCancel: true,
        canRefund: false
      }
    ]

    setTimeout(() => {
      setTransactions(mockTransactions)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.agentCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesPayment = filterPayment === 'all' || transaction.paymentMethod === filterPayment
    const matchesRisk = filterRisk === 'all' || 
                       (filterRisk === 'low' && transaction.riskScore < 30) ||
                       (filterRisk === 'medium' && transaction.riskScore >= 30 && transaction.riskScore < 70) ||
                       (filterRisk === 'high' && transaction.riskScore >= 70)
    
    return matchesSearch && matchesType && matchesStatus && matchesPayment && matchesRisk
  })

  const transactionSummary: TransactionSummary = {
    totalTransactions: transactions.length,
    totalValue: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    completedTransactions: transactions.filter(t => t.status === 'completed').length,
    failedTransactions: transactions.filter(t => t.status === 'failed').length,
    disputedTransactions: transactions.filter(t => t.status === 'disputed').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    avgTransactionValue: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length,
    successRate: (transactions.filter(t => t.status === 'completed').length / transactions.length) * 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(Math.abs(amount))
  }

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      disputed: 'bg-orange-100 text-orange-800',
      refunded: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      completed: CheckCircle,
      pending: Clock,
      failed: XCircle,
      cancelled: Ban,
      disputed: AlertTriangle,
      refunded: RotateCcw
    }
    return icons[status as keyof typeof icons] || AlertCircle
  }

  const getTypeColor = (type: string) => {
    const colors = {
      sale: 'bg-green-100 text-green-800',
      payment: 'bg-blue-100 text-blue-800',
      return: 'bg-red-100 text-red-800',
      adjustment: 'bg-purple-100 text-purple-800',
      commission: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: Banknote,
      card: CreditCard,
      transfer: Smartphone,
      mobile_money: Smartphone,
      credit: Receipt
    }
    return icons[method as keyof typeof icons] || CreditCard
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return 'text-green-600'
    if (riskScore < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowEditModal(true)
  }

  const handleViewAudit = (transaction: Transaction) => {
    setSelectedTransactionForAudit(transaction)
    setShowAuditModal(true)
  }

  const handleCancel = (transactionId: string) => {
    if (confirm('Are you sure you want to cancel this transaction? This action cannot be undone.')) {
      setTransactions(transactions.map(t => 
        t.id === transactionId 
          ? { 
              ...t, 
              status: 'cancelled' as const, 
              canCancel: false,
              auditTrail: [
                ...t.auditTrail,
                {
                  timestamp: new Date().toISOString(),
                  action: 'CANCELLED',
                  user: 'ADMIN',
                  details: 'Transaction cancelled by admin'
                }
              ]
            }
          : t
      ))
    }
  }

  const handleRefund = (transactionId: string) => {
    if (confirm('Are you sure you want to process a refund for this transaction?')) {
      setTransactions(transactions.map(t => 
        t.id === transactionId 
          ? { 
              ...t, 
              status: 'refunded' as const, 
              canRefund: false,
              auditTrail: [
                ...t.auditTrail,
                {
                  timestamp: new Date().toISOString(),
                  action: 'REFUNDED',
                  user: 'ADMIN',
                  details: 'Refund processed by admin'
                }
              ]
            }
          : t
      ))
    }
  }

  const handleReprocess = (transactionId: string) => {
    if (confirm('Are you sure you want to reprocess this failed transaction?')) {
      setTransactions(transactions.map(t => 
        t.id === transactionId 
          ? { 
              ...t, 
              status: 'pending' as const,
              auditTrail: [
                ...t.auditTrail,
                {
                  timestamp: new Date().toISOString(),
                  action: 'REPROCESSED',
                  user: 'ADMIN',
                  details: 'Transaction reprocessed by admin'
                }
              ]
            }
          : t
      ))
    }
  }

  const handleBulkAction = (action: string) => {
    const selectedCount = selectedTransactions.length
    if (selectedCount === 0) return

    const confirmMessage = `Are you sure you want to ${action} ${selectedCount} selected transactions?`
    if (confirm(confirmMessage)) {
      // Implement bulk action logic here
      console.log(`Bulk ${action} for transactions:`, selectedTransactions)
      setSelectedTransactions([])
    }
  }

  const columns = [
    {
      header: 'Transaction',
      accessor: 'transaction',
      cell: ({ row }: { row: Transaction }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.transactionNumber}</div>
            <div className="text-sm text-gray-500">
              {new Date(row.transactionDate).toLocaleDateString()} at{' '}
              {new Date(row.transactionDate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type & Status',
      accessor: 'typeStatus',
      cell: ({ row }: { row: Transaction }) => {
        const StatusIcon = getStatusIcon(row.status)
        return (<ErrorBoundary>

          <div className="space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(row.type)}`}>
              {row.type.toUpperCase()}
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
      header: 'Amount & Payment',
      accessor: 'amount',
      cell: ({ row }: { row: Transaction }) => {
        const PaymentIcon = getPaymentMethodIcon(row.paymentMethod)
        return (
          <div className="space-y-1">
            <div className={`text-sm font-medium ${row.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {row.amount < 0 ? '-' : ''}{formatCurrency(row.amount)}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <PaymentIcon className="w-3 h-3 mr-1" />
              {row.paymentMethod.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: ({ row }: { row: Transaction }) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">{row.customerName}</div>
          <div className="text-xs text-gray-500">{row.customerCode}</div>
        </div>
      ),
    },
    {
      header: 'Agent & Location',
      accessor: 'agent',
      cell: ({ row }: { row: Transaction }) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            {row.agentName}
          </div>
          <div className="text-xs text-gray-500">{row.agentCode}</div>
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="w-3 h-3 mr-1" />
            {row.routeName}
          </div>
          <div className="text-xs text-gray-400">
            {row.regionName} → {row.areaName}
          </div>
        </div>
      ),
    },
    {
      header: 'Risk & Fraud',
      accessor: 'risk',
      cell: ({ row }: { row: Transaction }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className={`text-sm font-medium ${getRiskColor(row.riskScore)}`}>
              {row.riskScore}%
            </span>
          </div>
          {row.fraudFlags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {row.fraudFlags.slice(0, 2).map((flag, index) => (
                <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                  {flag}
                </span>
              ))}
              {row.fraudFlags.length > 2 && (
                <span className="text-xs text-gray-500">+{row.fraudFlags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Device Info',
      accessor: 'device',
      cell: ({ row }: { row: Transaction }) => (
        <div className="space-y-1">
          <div className="text-xs text-gray-600">{row.deviceInfo.deviceId}</div>
          <div className="text-xs text-gray-500">
            {row.deviceInfo.platform} v{row.deviceInfo.appVersion}
          </div>
        </div>
      ),
    },
    {
      header: 'Notes & Errors',
      accessor: 'notes',
      cell: ({ row }: { row: Transaction }) => (
        <div className="max-w-xs space-y-1">
          {row.notes && (
            <p className="text-xs text-gray-600 truncate" title={row.notes}>
              {row.notes}
            </p>
          )}
          {row.errorMessage && (
            <p className="text-xs text-red-600 truncate" title={row.errorMessage}>
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {row.errorMessage}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: ({ row }: { row: Transaction }) => (
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="outline" onClick={() => handleViewAudit(row)}>
            <History className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
          {isAdmin() && row.canEdit && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {isAdmin() && row.status === 'failed' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleReprocess(row.id)}
              className="text-blue-600 hover:text-blue-700"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          {isAdmin() && row.canCancel && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleCancel(row.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Ban className="w-4 h-4" />
            </Button>
          )}
          {isAdmin() && row.canRefund && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleRefund(row.id)}
              className="text-orange-600 hover:text-orange-700"
            >
              <RotateCcw className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          </div>
          <SkeletonTable rows={10} cols={9} />
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
            <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
            <p className="text-gray-600">Monitor and manage all field transactions with comprehensive admin controls</p>
          </div>
          <div className="flex space-x-3">
            {canExportFrom('transactions') && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Transactions</p>
                <p className="text-lg font-bold text-gray-900">{transactionSummary.totalTransactions}</p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(transactionSummary.totalValue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-green-600">
                  {transactionSummary.completedTransactions}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Failed</p>
                <p className="text-lg font-bold text-red-600">
                  {transactionSummary.failedTransactions}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Disputed</p>
                <p className="text-lg font-bold text-orange-600">
                  {transactionSummary.disputedTransactions}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">
                  {transactionSummary.pendingTransactions}
                </p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </Card>
        </div>

        {/* Advanced Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by transaction number, customer, agent, or codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="sale">Sales</option>
                <option value="payment">Payments</option>
                <option value="return">Returns</option>
                <option value="adjustment">Adjustments</option>
                <option value="commission">Commissions</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk (&lt;30%)</option>
                <option value="medium">Medium Risk (30-70%)</option>
                <option value="high">High Risk (&gt;70%)</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>

          {selectedTransactions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedTransactions.length} transaction(s) selected
              </span>
              <div className="flex space-x-2">
                {isAdmin() && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')}>
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Bulk Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('cancel')}>
                      <Ban className="w-4 h-4 mr-2" />
                      Bulk Cancel
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card>
          <DataTable
            data={filteredTransactions}
            columns={columns}
          />
        </Card>

        {/* Audit Trail Modal */}
        {showAuditModal && selectedTransactionForAudit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Audit Trail - {selectedTransactionForAudit.transactionNumber}
                </h3>
                <Button variant="outline" onClick={() => setShowAuditModal(false)}>
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                {selectedTransactionForAudit.auditTrail.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{entry.action}</p>
                          <p className="text-sm text-gray-600">{entry.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{entry.user}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}