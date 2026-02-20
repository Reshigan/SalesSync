import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../services/api'

const fmtC = (a: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a || 0)

export const CreditNotesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: creditNotesData, isLoading } = useQuery({
    queryKey: ['credit-notes', statusFilter, page],
    queryFn: async () => {
      const response = await apiClient.get('/orders-enhanced/credit-notes', {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined, page, limit }
      })
      return response.data
    },
  })

  const notes = (creditNotesData?.data || creditNotesData?.credit_notes || []).map((n: any) => ({
    id: n.id, credit_note_number: n.credit_note_number || 'CN-' + (n.id?.slice(0,8) || ''),
    order_id: n.order_id, order_number: n.order_number || 'N/A',
    customer_name: n.customer_name || 'Unknown', issue_date: n.issue_date || n.created_at,
    amount: n.amount || 0, reason: n.reason || '', status: n.status || 'draft'
  }))

  const filtered = statusFilter === 'all' ? notes : notes.filter((n: any) => n.status === statusFilter)
  const getBadge = (s: string) => {
    const b: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', issued: 'bg-blue-100 text-blue-800', applied: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }
    return b[s] || 'bg-gray-100 text-gray-800'
  }

  const counts = { draft: 0, issued: 0, applied: 0, total: 0 }
  notes.forEach((n: any) => {
    if (n.status === 'draft') counts.draft++
    if (n.status === 'issued') counts.issued++
    if (n.status === 'applied') counts.applied++
    counts.total += n.amount
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Notes</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Draft</p><p className="text-2xl font-bold text-gray-600">{counts.draft}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Issued</p><p className="text-2xl font-bold text-blue-600">{counts.issued}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Applied</p><p className="text-2xl font-bold text-green-600">{counts.applied}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Value</p><p className="text-xl font-bold text-purple-600">{fmtC(counts.total)}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'draft', 'issued', 'applied', 'cancelled'].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-sm font-medium " + (statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500">No credit notes found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Credit Note #</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Order #</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Customer</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 uppercase">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Reason</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((n: any) => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium">{n.credit_note_number}</td>
                    <td className="px-3 py-3 text-sm">{n.order_number}</td>
                    <td className="px-3 py-3 text-sm">{n.customer_name}</td>
                    <td className="px-3 py-3 text-sm">{new Date(n.issue_date).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-sm text-right font-semibold">{fmtC(n.amount)}</td>
                    <td className="px-3 py-3 text-sm max-w-xs truncate">{n.reason}</td>
                    <td className="px-3 py-3"><span className={"px-2 py-0.5 text-xs font-semibold rounded-full " + getBadge(n.status)}>{n.status}</span></td>
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
