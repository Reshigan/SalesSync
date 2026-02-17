import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { Upload, Download, FileText, AlertCircle, Check, X, RefreshCw, Database, FileSpreadsheet, ChevronRight, Loader } from 'lucide-react'
import { apiClient } from '../../services/api.service'

interface ImportHistory {
  id: string
  type: 'customers' | 'products' | 'orders' | 'agents'
  fileName: string
  records: number
  status: 'success' | 'failed' | 'partial'
  errors: number
  date: string
  user: string
}

interface ExportJob {
  id: string
  type: string
  format: 'csv' | 'xlsx' | 'json'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  fileSize?: string
  downloadUrl?: string
  createdAt: string
}

const DATA_TYPES = [
  {
    id: 'customers',
    name: 'Customers',
    icon: '👤',
    description: 'Import/export customer records',
    fields: ['Name', 'Email', 'Phone', 'Address', 'Credit Limit', 'Status'],
    sampleCsv: 'name,email,phone,address,credit_limit,status\nJohn Doe,john@example.com,+1234567890,123 Main St,10000,active'
  },
  {
    id: 'products',
    name: 'Products',
    icon: '📦',
    description: 'Import/export product catalog',
    fields: ['SKU', 'Name', 'Category', 'Price', 'Stock', 'Unit'],
    sampleCsv: 'sku,name,category,price,stock,unit\nPRD001,Product Name,Category,99.99,100,EA'
  },
  {
    id: 'orders',
    name: 'Orders',
    icon: '🛒',
    description: 'Import/export order history',
    fields: ['Order ID', 'Customer', 'Date', 'Total', 'Status'],
    sampleCsv: 'order_id,customer_email,date,total,status\nORD001,customer@example.com,2024-01-15,199.99,completed'
  },
  {
    id: 'agents',
    name: 'Field Agents',
    icon: '👨‍💼',
    description: 'Import/export agent records',
    fields: ['Name', 'Email', 'Phone', 'Territory', 'Status'],
    sampleCsv: 'name,email,phone,territory,status\nJane Smith,jane@example.com,+1234567890,North Region,active'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: '📊',
    description: 'Import/export stock levels',
    fields: ['Product SKU', 'Location', 'Quantity', 'Min Level', 'Max Level'],
    sampleCsv: 'product_sku,location,quantity,min_level,max_level\nPRD001,Warehouse A,500,50,1000'
  },
  {
    id: 'prices',
    name: 'Pricing',
    icon: '💰',
    description: 'Bulk update product prices',
    fields: ['Product SKU', 'Price', 'Cost', 'Discount', 'Effective Date'],
    sampleCsv: 'product_sku,price,cost,discount,effective_date\nPRD001,99.99,59.99,10,2024-01-15'
  }
]

export default function DataImportExportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [selectedType, setSelectedType] = useState<string>('customers')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const [importHistory, setImportHistory] = useState<ImportHistory[]>([])
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const [importRes, exportRes] = await Promise.all([
        apiClient.get('/data/imports').catch(() => ({ data: { data: [] } })),
        apiClient.get('/data/exports').catch(() => ({ data: { data: [] } }))
      ])
      const imports = Array.isArray(importRes.data) ? importRes.data : (importRes.data?.data || [])
      setImportHistory(imports.map((i: any) => ({
        id: i.id || String(i.import_id),
        type: i.type || i.data_type || 'customers',
        fileName: i.file_name || i.fileName || 'unknown',
        records: Number(i.records || i.record_count || 0),
        status: i.status || 'success',
        errors: Number(i.errors || i.error_count || 0),
        date: i.created_at || i.date || '',
        user: i.user_name || i.user || 'System'
      })))
      const exports = Array.isArray(exportRes.data) ? exportRes.data : (exportRes.data?.data || [])
      setExportJobs(exports.map((e: any) => ({
        id: e.id || String(e.export_id),
        type: e.type || e.data_type || 'customers',
        format: e.format || 'csv',
        status: e.status || 'pending',
        progress: Number(e.progress || (e.status === 'completed' ? 100 : 0)),
        fileSize: e.file_size || e.fileSize,
        downloadUrl: e.download_url || e.downloadUrl,
        createdAt: e.created_at || e.createdAt || ''
      })))
    } catch (err) {
      console.error('Failed to fetch import/export history:', err)
    }
  }

  const selectedDataType = DATA_TYPES.find(t => t.id === selectedType)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls']
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!validTypes.includes(fileExt)) {
        toast.error('Please upload a valid CSV or Excel file')
        return
      }
      
      setUploadedFile(file)
    }
  }

  const handleImport = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to import')
      return
    }

    setImporting(true)
    setImportProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('type', selectedType)
      setImportProgress(30)
      await apiClient.post('/data/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImportProgress(100)
      setImporting(false)
      setUploadedFile(null)
      toast.error(`Successfully imported data from ${uploadedFile.name}`)
    } catch {
      setImporting(false)
      toast.error('Failed to import data. Please check the file format and try again.')
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    setExporting(true)
    try {
      const res = await apiClient.post('/data/export', { type: selectedType, format })
      const downloadUrl = res.data?.data?.download_url || res.data?.download_url
      if (downloadUrl) window.open(downloadUrl, '_blank')
      toast.error(`Export started! You'll be notified when the ${format.toUpperCase()} file is ready.`)
    } catch {
      toast.error('Failed to start export. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const downloadTemplate = (type: string) => {
    const dataType = DATA_TYPES.find(t => t.id === type)
    if (dataType) {
      const blob = new Blob([dataType.sampleCsv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_template.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Data Import / Export</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bulk import and export data across all modules
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Imports</p>
              <p className="text-3xl font-bold mt-1">{importHistory.length}</p>
            </div>
            <Upload className="w-12 h-12 text-[#C0E02E]" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Successful</p>
              <p className="text-3xl font-bold mt-1">
                {importHistory.filter(h => h.status === 'success').length}
              </p>
            </div>
            <Check className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Records</p>
              <p className="text-3xl font-bold mt-1">
                {importHistory.reduce((sum, h) => sum + h.records, 0).toLocaleString()}
              </p>
            </div>
            <Database className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Exports</p>
              <p className="text-3xl font-bold mt-1">{exportJobs.length}</p>
            </div>
            <Download className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-100">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </nav>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Import Guidelines</h3>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Download template first to ensure correct format</li>
                  <li>Supported formats: CSV, XLSX, XLS</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Duplicate records will be updated</li>
                  <li>Invalid records will be logged</li>
                </ul>
              </div>
            </div>

            {/* Data Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Data Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DATA_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDataType && (
              <>
                {/* Template Download */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">CSV Template</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Required fields: {selectedDataType.fields.join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadTemplate(selectedType)}
                      className="btn btn-outline flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    {uploadedFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-green-600">
                          <FileSpreadsheet className="w-12 h-12" />
                          <div className="text-left">
                            <p className="font-semibold">{uploadedFile.name}</p>
                            <p className="text-sm text-gray-600">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        
                        {importing && (
                          <div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                              <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">Importing... {importProgress}%</p>
                          </div>
                        )}

                        {!importing && (
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => setUploadedFile(null)}
                              className="btn btn-outline"
                            >
                              Remove
                            </button>
                            <button
                              onClick={handleImport}
                              className="btn btn-primary flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Import Data
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Upload {selectedDataType.name} File
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Drag and drop your file here, or click to browse
                        </p>
                        <label className="btn btn-primary inline-flex items-center gap-2 cursor-pointer">
                          <FileText className="w-4 h-4" />
                          Choose File
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Import History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import History</h3>
              <div className="space-y-3">
                {importHistory.map((item) => (
                  <div key={item.id} className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          item.status === 'success' ? 'bg-green-100' :
                          item.status === 'partial' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {item.status === 'success' && <Check className="w-6 h-6 text-green-600" />}
                          {item.status === 'partial' && <AlertCircle className="w-6 h-6 text-yellow-600" />}
                          {item.status === 'failed' && <X className="w-6 h-6 text-red-600" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{item.fileName}</h4>
                            <span className={`badge ${
                              item.status === 'success' ? 'badge-success' :
                              item.status === 'partial' ? 'badge-warning' :
                              'badge-error'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.records.toLocaleString()} records • {item.errors} errors • {item.date} • {item.user}
                          </p>
                        </div>
                      </div>

                      <button className="btn btn-outline btn-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="p-6 space-y-6">
            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Data to Export
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DATA_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Export Format
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => !exporting && handleExport('csv')}
                  disabled={exporting}
                  className="btn btn-outline flex items-center gap-3 justify-center py-4 disabled:opacity-50"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">CSV</div>
                    <div className="text-xs text-gray-600">Comma separated</div>
                  </div>
                </button>

                <button
                  onClick={() => !exporting && handleExport('xlsx')}
                  disabled={exporting}
                  className="btn btn-outline flex items-center gap-3 justify-center py-4 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Excel</div>
                    <div className="text-xs text-gray-600">XLSX format</div>
                  </div>
                </button>

                <button
                  onClick={() => !exporting && handleExport('json')}
                  disabled={exporting}
                  className="btn btn-outline flex items-center gap-3 justify-center py-4 disabled:opacity-50"
                >
                  <Database className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">JSON</div>
                    <div className="text-xs text-gray-600">JavaScript Object</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Export Jobs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Jobs</h3>
                <button className="btn btn-outline btn-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {exportJobs.map((job) => (
                  <div key={job.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          job.status === 'completed' ? 'bg-green-100' :
                          job.status === 'processing' ? 'bg-blue-100' :
                          job.status === 'failed' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          {job.status === 'completed' && <Check className="w-6 h-6 text-green-600" />}
                          {job.status === 'processing' && <Loader className="w-6 h-6 text-blue-600 animate-spin" />}
                          {job.status === 'failed' && <X className="w-6 h-6 text-red-600" />}
                          {job.status === 'pending' && <RefreshCw className="w-6 h-6 text-gray-600" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 capitalize">
                              {job.type} Export
                            </h4>
                            <span className="badge badge-secondary uppercase">
                              {job.format}
                            </span>
                            <span className={`badge ${
                              job.status === 'completed' ? 'badge-success' :
                              job.status === 'processing' ? 'badge-info' :
                              job.status === 'failed' ? 'badge-error' :
                              'badge-secondary'
                            }`}>
                              {job.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Created: {job.createdAt}</span>
                            {job.fileSize && <span>Size: {job.fileSize}</span>}
                          </div>

                          {job.status === 'processing' && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-semibold">{job.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${job.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {job.status === 'completed' && job.downloadUrl && (
                        <button className="btn btn-primary flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
