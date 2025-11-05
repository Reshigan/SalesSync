import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Download, RefreshCw } from 'lucide-react'
import DataTable from '../ui/tables/DataTable'
import { Button } from '../ui/Button'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface TransactionListProps {
  title: string
  columns: Column[]
  data: any[]
  loading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  createPath?: string
  createLabel?: string
  filters?: React.ReactNode
  actions?: (row: any) => React.ReactNode
}

export default function TransactionList({
  title,
  columns,
  data,
  loading = false,
  onRefresh,
  onExport,
  createPath,
  createLabel = 'Create New',
  filters,
  actions
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredData = data.filter(row => {
    if (!searchTerm) return true
    return Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {createPath && (
            <Link to={createPath}>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {createLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {filters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          {filters}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns.map(col => ({
            ...col,
            header: col.label
          }))}
          data={filteredData}
          loading={loading}
        />
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredData.length} of {data.length} records
      </div>
    </div>
  )
}
