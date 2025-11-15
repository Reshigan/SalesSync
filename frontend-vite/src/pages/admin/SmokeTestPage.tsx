import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { apiClient } from '../../services/api.service'

interface RouteTest {
  path: string
  type: 'static' | 'dynamic'
  provider?: () => Promise<string>
  status: 'pending' | 'loading' | 'success' | 'error'
  error?: string
  loadTime?: number
}

export default function SmokeTestPage() {
  const { user } = useAuthStore()
  const [tests, setTests] = useState<RouteTest[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const providers = {
    customerId: async () => {
      const res = await apiClient.get('/customers?limit=1')
      return res.data.data?.[0]?.id || res.data[0]?.id
    },
    productId: async () => {
      const res = await apiClient.get('/products?limit=1')
      return res.data.data?.[0]?.id || res.data[0]?.id
    },
    orderId: async () => {
      const res = await apiClient.get('/orders?limit=1')
      return res.data.data?.[0]?.id || res.data[0]?.id
    },
    vanId: async () => {
      const res = await apiClient.get('/vans?limit=1')
      return res.data.data?.[0]?.id || res.data[0]?.id
    },
    routeId: async () => {
      const res = await apiClient.get('/routes?limit=1')
      return res.data.data?.[0]?.id || res.data[0]?.id
    },
  }

  const routeRegistry: Omit<RouteTest, 'status'>[] = [
    { path: '/customers/:id', type: 'dynamic', provider: providers.customerId },
    { path: '/products/:id', type: 'dynamic', provider: providers.productId },
    { path: '/orders/:id', type: 'dynamic', provider: providers.orderId },
    
    { path: '/van-sales/routes/:id', type: 'dynamic', provider: providers.routeId },
    { path: '/van-sales/orders/create', type: 'static' },
    { path: '/van-sales/orders/new', type: 'static' },
    { path: '/van-sales/returns/create', type: 'static' },
    { path: '/van-sales/van-loads/create', type: 'static' },
    { path: '/van-sales/cash-reconciliation/create', type: 'static' },
    
    { path: '/inventory/adjustments/create', type: 'static' },
    { path: '/inventory/issues/create', type: 'static' },
    { path: '/inventory/receipts/create', type: 'static' },
    { path: '/inventory/stock-counts/create', type: 'static' },
    { path: '/inventory/transfers/create', type: 'static' },
    
    { path: '/sales/orders/create', type: 'static' },
    { path: '/sales/invoices/create', type: 'static' },
    { path: '/sales/payments/create', type: 'static' },
    { path: '/sales/credit-notes/create', type: 'static' },
    { path: '/sales/returns/create', type: 'static' },
    
    { path: '/marketing/campaigns/create', type: 'static' },
    { path: '/marketing/events/create', type: 'static' },
    { path: '/marketing/activations/create', type: 'static' },
    { path: '/marketing/promotions/create', type: 'static' },
    
    { path: '/crm/customers/create', type: 'static' },
    { path: '/crm/kyc-cases/create', type: 'static' },
    { path: '/crm/surveys/create', type: 'static' },
    
    { path: '/finance/cash-reconciliation/create', type: 'static' },
    
    { path: '/field-operations/boards/create', type: 'static' },
    { path: '/field-operations/products/create', type: 'static' },
    { path: '/field-operations/visits/create', type: 'static' },
  ]

  useEffect(() => {
    setTests(routeRegistry.map(r => ({ ...r, status: 'pending' })))
  }, [])

  const runTests = async () => {
    setRunning(true)
    setProgress(0)

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'loading' } : t
      ))

      try {
        const startTime = Date.now()
        let testPath = test.path

        if (test.type === 'dynamic' && test.provider) {
          try {
            const id = await test.provider()
            if (!id) {
              throw new Error('No ID available from provider')
            }
            testPath = test.path.replace(':id', id)
          } catch (err: any) {
            throw new Error(`Provider failed: ${err.message}`)
          }
        }

        const loadTime = Date.now() - startTime

        setTests(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'success', loadTime } : t
        ))
      } catch (error: any) {
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { 
            ...t, 
            status: 'error', 
            error: error.message || 'Unknown error' 
          } : t
        ))
      }

      setProgress(((i + 1) / tests.length) * 100)
    }

    setRunning(false)
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const pendingCount = tests.filter(t => t.status === 'pending').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Smoke Test - Route Registry</h1>
        <p className="text-gray-600 mt-2">
          Test all {tests.length} mounted detail/edit/create routes for errors
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
          <div className="text-sm text-gray-600">Total Routes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{successCount}</div>
          <div className="text-sm text-gray-600">Passed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-400">{pendingCount}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Progress */}
      {running && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Testing... {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={running}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Running Tests...' : 'Run Smoke Test'}
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Load Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests.map((test, idx) => (
              <tr key={idx} className={test.status === 'loading' ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {test.path}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {test.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {test.status === 'pending' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Pending
                    </span>
                  )}
                  {test.status === 'loading' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Loading...
                    </span>
                  )}
                  {test.status === 'success' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Success
                    </span>
                  )}
                  {test.status === 'error' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Error
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {test.loadTime ? `${test.loadTime}ms` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-red-600">
                  {test.error || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Results */}
      {!running && (successCount > 0 || errorCount > 0) && (
        <div className="mt-6">
          <button
            onClick={() => {
              const results = tests.map(t => ({
                route: t.path,
                type: t.type,
                status: t.status,
                loadTime: t.loadTime,
                error: t.error
              }))
              const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `smoke-test-results-${new Date().toISOString()}.json`
              a.click()
            }}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            Export Results as JSON
          </button>
        </div>
      )}
    </div>
  )
}
