'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import {
  Ticket,
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface VoucherDistribution {
  id: string
  voucherCode: string
  denomination: number
  customerName: string
  customerPhone: string
  distributionDate: string
  distributionTime: string
  location: string
  agentId: string
  agentName: string
  status: 'distributed' | 'redeemed' | 'expired' | 'cancelled'
  redemptionDate?: string
  commission: number
  campaign?: string
}

export default function VoucherSalesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [denominationFilter, setDenominationFilter] = useState<string>('all')

  const vouchers: VoucherDistribution[] = [
    {
      id: 'V001',
      voucherCode: 'VOUCH-2025-001234',
      denomination: 50,
      customerName: 'John Doe',
      customerPhone: '+27-82-123-4567',
      distributionDate: '2025-10-01',
      distributionTime: '09:30',
      location: 'Sandton Mall',
      agentId: 'AGT001',
      agentName: 'Agent Mike',
      status: 'redeemed',
      redemptionDate: '2025-10-02',
      commission: 5,
      campaign: 'Summer Promotion'
    },
    {
      id: 'V002',
      voucherCode: 'VOUCH-2025-001235',
      denomination: 100,
      customerName: 'Sarah Smith',
      customerPhone: '+27-83-234-5678',
      distributionDate: '2025-10-02',
      distributionTime: '10:15',
      location: 'Cape Town CBD',
      agentId: 'AGT002',
      agentName: 'Agent Jane',
      status: 'distributed',
      commission: 10,
      campaign: 'Summer Promotion'
    },
    {
      id: 'V003',
      voucherCode: 'VOUCH-2025-001236',
      denomination: 200,
      customerName: 'David Brown',
      customerPhone: '+27-84-345-6789',
      distributionDate: '2025-10-03',
      distributionTime: '14:20',
      location: 'Durban Beachfront',
      agentId: 'AGT001',
      agentName: 'Agent Mike',
      status: 'redeemed',
      redemptionDate: '2025-10-03',
      commission: 20,
      campaign: 'Loyalty Rewards'
    },
    {
      id: 'V004',
      voucherCode: 'VOUCH-2025-001237',
      denomination: 50,
      customerName: 'Emma Wilson',
      customerPhone: '+27-85-456-7890',
      distributionDate: '2025-09-15',
      distributionTime: '11:00',
      location: 'Pretoria Mall',
      agentId: 'AGT003',
      agentName: 'Agent Tom',
      status: 'expired',
      commission: 0
    },
    {
      id: 'V005',
      voucherCode: 'VOUCH-2025-001238',
      denomination: 100,
      customerName: 'Michael Johnson',
      customerPhone: '+27-86-567-8901',
      distributionDate: '2025-10-04',
      distributionTime: '15:45',
      location: 'Johannesburg Central',
      agentId: 'AGT002',
      agentName: 'Agent Jane',
      status: 'distributed',
      commission: 10,
      campaign: 'Weekend Special'
    }
  ]

  const stats = {
    totalDistributed: vouchers.length,
    totalRedeemed: vouchers.filter(v => v.status === 'redeemed').length,
    totalValue: vouchers.reduce((sum, v) => sum + v.denomination, 0),
    redeemedValue: vouchers.filter(v => v.status === 'redeemed').reduce((sum, v) => sum + v.denomination, 0),
    totalCommission: vouchers.reduce((sum, v) => sum + v.commission, 0),
    redemptionRate: (vouchers.filter(v => v.status === 'redeemed').length / vouchers.length) * 100,
    pending: vouchers.filter(v => v.status === 'distributed').length,
    expired: vouchers.filter(v => v.status === 'expired').length
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.customerPhone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter
    const matchesDenomination = denominationFilter === 'all' || voucher.denomination.toString() === denominationFilter
    return matchesSearch && matchesStatus && matchesDenomination
  })

  const getStatusBadge = (status: VoucherDistribution['status']) => {
    const badges = {
      distributed: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Distributed' },
      redeemed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Redeemed' },
      expired: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Expired' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' }
    }
    const badge = badges[status]
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              Voucher Management
            </h1>
            <p className="text-gray-600 mt-1">Track voucher distribution and redemption</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg">
            <Plus className="w-5 h-5" />
            Distribute Voucher
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distributed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDistributed}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.pending} pending</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Redemption Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.redemptionRate.toFixed(0)}%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stats.totalRedeemed} redeemed
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Redeemed: {formatCurrency(stats.redeemedValue)}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalCommission)}</p>
                <p className="text-xs text-gray-500 mt-1">Agent earnings</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="distributed">Distributed</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={denominationFilter}
              onChange={(e) => setDenominationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Denominations</option>
              <option value="50">R50</option>
              <option value="100">R100</option>
              <option value="200">R200</option>
              <option value="500">R500</option>
            </select>
          </div>
        </Card>

        {/* Vouchers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denomination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Ticket className="w-5 h-5 text-pink-500 mr-2" />
                        <div>
                          <p className="text-sm font-mono font-medium text-gray-900">{voucher.voucherCode}</p>
                          {voucher.campaign && (
                            <p className="text-xs text-gray-500">{voucher.campaign}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{voucher.customerName}</p>
                        <p className="text-xs text-gray-500">{voucher.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                        {formatCurrency(voucher.denomination)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {voucher.distributionDate}
                        </p>
                        <p className="text-gray-500 flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {voucher.location}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{voucher.agentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(voucher.status)}
                      {voucher.redemptionDate && (
                        <p className="text-xs text-gray-500 mt-1">Redeemed: {voucher.redemptionDate}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(voucher.commission)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredVouchers.length === 0 && (
          <Card className="p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vouchers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
