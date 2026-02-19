import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { returnsService } from '../../services/returns.service'
import { ordersService } from '../../services/orders.service'
import toast from 'react-hot-toast'

const fmtC = (a: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a || 0)

export const ReturnManagementPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState('')
  const limit = 20
  const qc = useQueryClient()

  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['returns', statusFilter, page],
    queryFn: () => returnsService.getReturns({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page, limit
    }),
  })

  const returns = (returnsData?.data?.returns || returnsData?.returns || []).map((r: any) => ({
    id: r.id, order_id: r.order_id, order_number: r.order_number || r.return_number || 'N/A',
    customer_name: r.customer_name || 'Unknown', return_date: r.return_date || r.created_at,
    reason: r.reason || '', status: r.status || 'pending', refund_amount: r.total_amount || r.refund_amount || 0,
    items_count: r.items?.length || 0
  }))

  const filtered = statusFilter === 'all' ? returns : returns.filter((r: any) => r.status === statusFilter)

  const handleApprove = async (id: string) => {
    setBusy(id + '-approve')
    try {
      await ordersService.approveReturn(id)
      toast.success('Return approved')
      qc.invalidateQueries({ queryKey: ['returns'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Approve failed') }
    finally { setBusy('') }
  }

  const handleCreditNote = async (id: string) => {
    setBusy(id + '-credit')
    try {
      await ordersService.createCreditNote(id)
      toast.success('Credit note created')
      qc.invalidateQueries({ queryKey: ['returns'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Credit note failed') }
    finally { setBusy('') }
  }

  const getBadge = (s: string) => {
    const b: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', completed: 'bg-blue-100 text-blue-800' }
    return b[s] || 'bg-gray-100 text-gray-800'
  }

  const counts = { pending: 0, approved: 0, completed: 0, totalRefund: 0 }
  returns.forEach((r: any) => {
    if (r.status === 'pending') counts.pending++
    if (r.status === 'approved') counts.approved++
    if (r.status === 'completed') counts.completed++
    counts.totalRefund += r.refund_amount
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Return Management</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{counts.pending}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600">{counts.approved}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-blue-600">{counts.completed}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Refunds</p><p className="text-xl font-bold text-purple-600">{fmtC(counts.totalRefund)}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected', 'completed'].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-sm font-medium " + (statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500">No returns found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Order #</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Customer</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Reason</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium">{r.order_number}</td>
                    <td className="px-3 py-3 text-sm">{r.customer_name}</td>
                    <td className="px-3 py-3 text-sm">{new Date(r.return_date).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-sm text-right font-semibold">{fmtC(r.refund_amount)}</td>
                    <td className="px-3 py-3 text-sm max-w-xs truncate">{r.reason}</td>
                    <td className="px-3 py-3"><span className={"px-2 py-0.5 text-xs font-semibold rounded-full " + getBadge(r.status)}>{r.status}</span></td>
                    <td className="px-3 py-3 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        {r.status === 'pending' && <button onClick={() => handleApprove(r.id)} disabled={!!busy} className="px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{busy === r.id+'-approve' ? '...' : 'Approve'}</button>}
                        {r.status === 'approved' && <button onClick={() => handleCreditNote(r.id)} disabled={!!busy} className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{busy === r.id+'-credit' ? '...' : 'Credit Note'}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
