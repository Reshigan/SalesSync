'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { ShoppingCart, Plus, Search, Download, Eye, Edit, Trash2, Check, X, Clock, CheckCircle, Package, DollarSign } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrder {
  id: string
  poNumber: string
  supplier: string
  orderDate: string
  expectedDate: string
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'
  items: number
  totalAmount: number
  paymentStatus: 'unpaid' | 'partial' | 'paid'
}

export default function PurchaseOrdersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const purchases: PurchaseOrder[] = [
    { id: '1', poNumber: 'PO-2025-001', supplier: 'Coca-Cola Nigeria', orderDate: '2025-09-25', expectedDate: '2025-10-05', status: 'received', items: 5, totalAmount: 474000, paymentStatus: 'paid' },
    { id: '2', poNumber: 'PO-2025-002', supplier: 'Nestle Foods', orderDate: '2025-09-28', expectedDate: '2025-10-08', status: 'approved', items: 8, totalAmount: 399600, paymentStatus: 'unpaid' },
    { id: '3', poNumber: 'PO-2025-003', supplier: 'Unilever Nigeria', orderDate: '2025-10-01', expectedDate: '2025-10-10', status: 'pending', items: 6, totalAmount: 295600, paymentStatus: 'unpaid' },
    { id: '4', poNumber: 'PO-2025-004', supplier: 'PZ Cussons', orderDate: '2025-09-20', expectedDate: '2025-10-01', status: 'received', items: 4, totalAmount: 548400, paymentStatus: 'partial' }
  ]

  const stats = {
    totalOrders: purchases.length,
    totalValue: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
    pending: purchases.filter(p => p.status === 'pending' || p.status === 'approved').length,
    received: purchases.filter(p => p.status === 'received').length,
    cancelled: purchases.filter(p => p.status === 'cancelled').length
  }

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) || p.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-700', label: 'Approved' },
      received: { color: 'bg-green-100 text-green-700', label: 'Received' },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    }
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badges[status].color}`}>{badges[status].label}</span>
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl"><ShoppingCart className="w-8 h-8 text-white" /></div>
              Purchase Orders
            </h1>
            <p className="text-gray-600 mt-1">Manage supplier purchase orders and inventory restocking</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
            <Plus className="w-5 h-5" />Create PO
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-600">Total Orders</p><p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p></div>
              <ShoppingCart className="w-10 h-10 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-green-600">Total Value</p><p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalValue)}</p></div>
              <DollarSign className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-yellow-600">Pending</p><p className="text-2xl font-bold text-yellow-900">{stats.pending}</p></div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-emerald-600">Received</p><p className="text-2xl font-bold text-emerald-900">{stats.received}</p></div>
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-red-600">Cancelled</p><p className="text-2xl font-bold text-red-900">{stats.cancelled}</p></div>
              <X className="w-10 h-10 text-red-400" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search by PO number, supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />Export
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['PO Number', 'Supplier', 'Order Date', 'Expected', 'Status', 'Items', 'Total Amount', 'Payment', 'Actions'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-blue-600">{po.poNumber}</div></td>
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{po.supplier}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(po.orderDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(po.expectedDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(po.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{po.items} items</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(po.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${po.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : po.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{po.paymentStatus}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                        <button className="text-gray-600 hover:text-gray-800"><Edit className="w-4 h-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}
