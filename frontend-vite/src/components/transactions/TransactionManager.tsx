import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Package,
  CreditCard
} from 'lucide-react'
import { Transaction, TransactionFilter, TransactionSummary } from '../../types/transaction.types'
import { transactionService } from '../../services/transaction.service'
import DataTable from '../ui/tables/DataTable'
import AIInsightsPanel from '../ai/AIInsightsPanel'

interface TransactionManagerProps {
  module?: string
  entityId?: string
  showCreateButton?: boolean
  showFilters?: boolean
  showSummary?: boolean
}

export default function TransactionManager({
  module,
  entityId,
  showCreateButton = true,
  showFilters = true,
  showSummary = true
}: TransactionManagerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TransactionFilter>({ module })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showReverseForm, setShowReverseForm] = useState<Transaction | null>(null)

  useEffect(() => {
    loadTransactions()
    if (showSummary) {
      loadSummary()
    }
  }, [filter, module, entityId])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await transactionService.getTransactions(filter)
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const data = await transactionService.getTransactionSummary(filter)
      setSummary(data)
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  const handleFilterChange = (newFilter: Partial<TransactionFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const blob = await transactionService.exportTransactions(filter, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export transactions:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'reversed':
        return <ArrowDownLeft className="h-4 w-4 text-purple-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'forward' 
      ? <ArrowUpRight className="h-4 w-4 text-green-500" />
      : <ArrowDownLeft className="h-4 w-4 text-red-500" />
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'field_agents':
        return <User className="h-4 w-4" />
      case 'customers':
        return <User className="h-4 w-4" />
      case 'orders':
        return <Package className="h-4 w-4" />
      case 'products':
        return <Package className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP'
    }).format(amount)
  }

  const transactionColumns = [
    {
      key: 'id',
      title: 'Transaction ID',
      sortable: true,
      filterable: true,
      render: (value: string, row: Transaction) => (
        <div className="flex items-center space-x-2">
          {getTypeIcon(row.type)}
          <span className="font-mono text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'module',
      title: 'Module',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getModuleIcon(value)}
          <span className="capitalize">{value.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      render: (value: number, row: Transaction) => (
        <span className={`font-medium ${
          row.type === 'forward' ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(value, row.currency)}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <span className="capitalize">{value}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">
          <div>{new Date(value).toLocaleDateString()}</div>
          <div className="text-gray-500">{new Date(value).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, row: Transaction) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTransaction(row)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'pending' && (
            <button
              className="text-green-600 hover:text-green-800"
              title="Edit Transaction"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {(row.status === 'completed' && row.type === 'forward') && (
            <button
              onClick={() => setShowReverseForm(row)}
              className="text-purple-600 hover:text-purple-800"
              title="Reverse Transaction"
            >
              <ArrowDownLeft className="h-4 w-4" />
            </button>
          )}
          {row.status === 'pending' && (
            <button
              className="text-red-600 hover:text-red-800"
              title="Cancel Transaction"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transaction Management</h2>
          <p className="text-sm text-gray-600">
            Manage forward and reverse transactions across all modules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('csv')}
            className="btn-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={loadTransactions}
            className="btn-outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          {showCreateButton && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {showSummary && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-blue-100">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.total_transactions}</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(summary.total_amount, 'GBP')}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-green-100">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Forward Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.forward_transactions.count}</p>
                <p className="text-sm text-green-600">
                  {formatCurrency(summary.forward_transactions.amount, 'GBP')}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-red-100">
                  <ArrowDownLeft className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Reverse Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.reverse_transactions.count}</p>
                <p className="text-sm text-red-600">
                  {formatCurrency(Math.abs(summary.reverse_transactions.amount), 'GBP')}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-purple-100">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Net Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(
                    summary.forward_transactions.amount + summary.reverse_transactions.amount,
                    'GBP'
                  )}
                </p>
                <p className="text-sm text-gray-600">After reversals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={filter.type || ''}
                onChange={(e) => handleFilterChange({ type: e.target.value as any })}
                className="form-select w-full"
              >
                <option value="">All Types</option>
                <option value="forward">Forward</option>
                <option value="reverse">Reverse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filter.status || ''}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
                className="form-select w-full"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filter.date_from || ''}
                onChange={(e) => handleFilterChange({ date_from: e.target.value })}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filter.date_to || ''}
                onChange={(e) => handleFilterChange({ date_to: e.target.value })}
                className="form-input w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <DataTable
        data={transactions}
        columns={transactionColumns}
        title="Transactions"
        searchable={true}
        exportable={true}
        pagination={true}
        pageSize={20}
      />

      {/* AI Insights */}
      <AIInsightsPanel 
        module={module || 'transactions'}
        entityId={entityId}
        className="mt-6"
      />
    </div>
  )
}