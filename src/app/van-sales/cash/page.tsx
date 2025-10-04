'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Banknote, Plus, Search, Download, Eye, CheckCircle, Clock, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'

interface CashCollection {
  id: string
  collectionNumber: string
  driver: string
  customer: string
  amount: number
  collectionDate: string
  status: 'collected' | 'deposited' | 'verified'
  invoiceNumber: string
  paymentMethod: 'cash' | 'cheque' | 'mobile'
}

export default function VanCashPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const collections: CashCollection[] = [
    { id: '1', collectionNumber: 'CASH-001', driver: 'John Driver', customer: 'Shoprite', amount: 125000, collectionDate: '2025-10-04', status: 'deposited', invoiceNumber: 'INV-001', paymentMethod: 'cash' },
    { id: '2', collectionNumber: 'CASH-002', driver: 'Mary Agent', customer: 'Konga Store', amount: 85000, collectionDate: '2025-10-04', status: 'collected', invoiceNumber: 'INV-005', paymentMethod: 'cash' },
    { id: '3', collectionNumber: 'CASH-003', driver: 'Peter Sales', customer: 'Best Buy', amount: 56000, collectionDate: '2025-10-04', status: 'verified', invoiceNumber: 'INV-012', paymentMethod: 'cheque' }
  ]

  const stats = {
    totalCash: collections.reduce((sum, c) => sum + c.amount, 0),
    collectionsToday: collections.filter(c => c.collectionDate === '2025-10-04').length,
    pending: collections.filter(c => c.status === 'collected').reduce((sum, c) => sum + c.amount, 0),
    deposited: collections.filter(c => c.status === 'deposited' || c.status === 'verified').reduce((sum, c) => sum + c.amount, 0),
    outstanding: collections.filter(c => c.status === 'collected').reduce((sum, c) => sum + c.amount, 0)
  }

  const filteredCollections = collections.filter(c => {
    const matchesSearch = c.collectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      collected: 'bg-yellow-100 text-yellow-700',
      deposited: 'bg-blue-100 text-blue-700',
      verified: 'bg-green-100 text-green-700'
    }
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl"><Banknote className="w-8 h-8 text-white" /></div>
              Cash Collection
            </h1>
            <p className="text-gray-600 mt-1">Track cash collections from van sales</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg">
            <Plus className="w-5 h-5" />Record Collection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-green-600">Total Cash</p><p className="text-2xl font-bold">{formatCurrency(stats.totalCash)}</p></div>
              <Banknote className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-emerald-600">Today</p><p className="text-2xl font-bold">{stats.collectionsToday}</p></div>
              <TrendingUp className="w-10 h-10 text-emerald-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-yellow-600">Pending</p><p className="text-2xl font-bold">{formatCurrency(stats.pending)}</p></div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-600">Deposited</p><p className="text-2xl font-bold">{formatCurrency(stats.deposited)}</p></div>
              <CheckCircle className="w-10 h-10 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-red-600">Outstanding</p><p className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</p></div>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search collections..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="collected">Collected</option>
              <option value="deposited">Deposited</option>
              <option value="verified">Verified</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Download className="w-4 h-4" />Export</button>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Collection #', 'Driver', 'Customer', 'Invoice', 'Amount', 'Date', 'Payment', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCollections.map(cash => (
                  <tr key={cash.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-green-600">{cash.collectionNumber}</div></td>
                    <td className="px-6 py-4 text-sm">{cash.driver}</td>
                    <td className="px-6 py-4 text-sm font-medium">{cash.customer}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">{cash.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(cash.amount)}</td>
                    <td className="px-6 py-4 text-sm">{new Date(cash.collectionDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cash.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{cash.paymentMethod}</span></td>
                    <td className="px-6 py-4">{getStatusBadge(cash.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600"><Eye className="w-4 h-4" /></button>
                        {cash.status === 'collected' && <button className="text-green-600"><CheckCircle className="w-4 h-4" /></button>}
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
  )
}
