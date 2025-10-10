'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Truck, Plus, Search, Download, Eye, Edit, Trash2, ArrowRightLeft, Clock, CheckCircle, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

interface StockMovement {
  id: string
  movementNumber: string
  type: 'transfer' | 'adjustment' | 'damaged' | 'return'
  fromWarehouse: string
  toWarehouse?: string
  productName: string
  quantity: number
  movementDate: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  createdBy: string
}

export default function StockMovementsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const movements: StockMovement[] = [
    { id: '1', movementNumber: 'MOV-2025-001', type: 'transfer', fromWarehouse: 'Lagos Main', toWarehouse: 'Lagos West', productName: 'Coca-Cola 500ml', quantity: 500, movementDate: '2025-10-01', status: 'completed', createdBy: 'John Admin' },
    { id: '2', movementNumber: 'MOV-2025-002', type: 'adjustment', fromWarehouse: 'Abuja Warehouse', productName: 'Sprite 1.5L', quantity: -25, movementDate: '2025-10-02', status: 'completed', createdBy: 'Sarah Manager' },
    { id: '3', movementNumber: 'MOV-2025-003', type: 'transfer', fromWarehouse: 'Port Harcourt', toWarehouse: 'Kano Warehouse', productName: 'Fanta 500ml', quantity: 300, movementDate: '2025-10-03', status: 'in_transit', createdBy: 'Mike Warehouse' },
    { id: '4', movementNumber: 'MOV-2025-004', type: 'damaged', fromWarehouse: 'Lagos Main', productName: 'Pringles Original', quantity: -15, movementDate: '2025-10-04', status: 'completed', createdBy: 'Peter Staff' },
    { id: '5', movementNumber: 'MOV-2025-005', type: 'return', fromWarehouse: 'Customer Site', toWarehouse: 'Lagos Main', productName: 'Mixed Products', quantity: 45, movementDate: '2025-10-04', status: 'pending', createdBy: 'Jane Agent' }
  ]

  const stats = {
    totalMovements: movements.length,
    transfers: movements.filter(m => m.type === 'transfer').length,
    adjustments: movements.filter(m => m.type === 'adjustment').length,
    damaged: movements.filter(m => m.type === 'damaged').length,
    thisMonth: movements.filter(m => new Date(m.movementDate).getMonth() === new Date().getMonth()).length
  }

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.movementNumber.toLowerCase().includes(searchTerm.toLowerCase()) || m.productName.toLowerCase().includes(searchTerm.toLowerCase()) || m.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || m.type === typeFilter
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      transfer: { color: 'bg-blue-100 text-blue-700', label: 'Transfer' },
      adjustment: { color: 'bg-purple-100 text-purple-700', label: 'Adjustment' },
      damaged: { color: 'bg-red-100 text-red-700', label: 'Damaged' },
      return: { color: 'bg-green-100 text-green-700', label: 'Return' }
    }
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badges[type].color}`}>{badges[type].label}</span>
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      in_transit: { color: 'bg-blue-100 text-blue-700', label: 'In Transit' },
      completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    }
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badges[status].color}`}>{badges[status].label}</span>
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl"><Truck className="w-8 h-8 text-white" /></div>
              Stock Movements
            </h1>
            <p className="text-gray-600 mt-1">Track inventory movements between warehouses and locations</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md">
            <Plus className="w-5 h-5" />New Movement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-purple-600">Total Movements</p><p className="text-2xl font-bold text-purple-900">{stats.totalMovements}</p></div>
              <ArrowRightLeft className="w-10 h-10 text-purple-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-600">Transfers</p><p className="text-2xl font-bold text-blue-900">{stats.transfers}</p></div>
              <Truck className="w-10 h-10 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-indigo-600">Adjustments</p><p className="text-2xl font-bold text-indigo-900">{stats.adjustments}</p></div>
              <TrendingUp className="w-10 h-10 text-indigo-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-red-600">Damaged</p><p className="text-2xl font-bold text-red-900">{stats.damaged}</p></div>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-green-600">This Month</p><p className="text-2xl font-bold text-green-900">{stats.thisMonth}</p></div>
              <Package className="w-10 h-10 text-green-400" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search by movement #, product, warehouse..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="damaged">Damaged</option>
              <option value="return">Return</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="completed">Completed</option>
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
                  {['Movement #', 'Type', 'Product', 'From', 'To', 'Quantity', 'Date', 'Status', 'Created By', 'Actions'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-purple-600">{mov.movementNumber}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(mov.type)}</td>
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{mov.productName}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-600">{mov.fromWarehouse}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-600">{mov.toWarehouse || '-'}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`font-bold ${mov.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>{mov.quantity > 0 ? '+' : ''}{mov.quantity}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(mov.movementDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(mov.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mov.createdBy}</td>
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
