import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '../../services/orders.service'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const fmtC = (a: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a || 0)

export const DeliveryTrackingPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState('')
  const limit = 20
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['deliveries', statusFilter, page],
    queryFn: () => ordersService.getOrders({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit
    })
  })

  const orders = data?.orders || []
  const total = data?.total || 0

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      shipped: 'bg-indigo-100 text-indigo-800', in_transit: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800',
      approved: 'bg-indigo-100 text-indigo-800', processing: 'bg-purple-100 text-purple-800',
      packed: 'bg-violet-100 text-violet-800', pending: 'bg-yellow-100 text-yellow-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getProgress = (status: string) => {
    const p: Record<string, number> = { pending: 0, approved: 20, processing: 40, packed: 60, shipped: 70, in_transit: 80, out_for_delivery: 90, delivered: 100 }
    return p[status] || 0
  }

  const handleDispatch = async (orderId: string) => {
    setBusy(orderId + '-dispatch')
    try {
      await ordersService.createDeliveryFromOrder(orderId)
      toast.success('Delivery dispatched')
      qc.invalidateQueries({ queryKey: ['deliveries'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Dispatch failed') }
    finally { setBusy('') }
  }

  const handleComplete = async (orderId: string) => {
    setBusy(orderId + '-complete')
    try {
      await ordersService.transitionOrderStatus(orderId, 'delivered')
      toast.success('Delivery completed')
      qc.invalidateQueries({ queryKey: ['deliveries'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Complete failed') }
    finally { setBusy('') }
  }

  const handleCreateInvoice = async (orderId: string) => {
    setBusy(orderId + '-invoice')
    try {
      await ordersService.createInvoiceFromOrder(orderId)
      toast.success('Invoice generated')
      qc.invalidateQueries({ queryKey: ['deliveries'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Invoice creation failed') }
    finally { setBusy('') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">Failed to load deliveries.</p></div>

  const statuses = ['all', 'approved', 'processing', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']
  const counts = { shipped: 0, in_transit: 0, out_for_delivery: 0, delivered_today: 0 }
  orders.forEach((o: any) => {
    if (o.order_status === 'shipped') counts.shipped++
    if (o.order_status === 'in_transit') counts.in_transit++
    if (o.order_status === 'out_for_delivery') counts.out_for_delivery++
    if (o.order_status === 'delivered') counts.delivered_today++
  })

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Tracking</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Shipped</p><p className="text-2xl font-bold text-indigo-600">{counts.shipped}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">In Transit</p><p className="text-2xl font-bold text-blue-600">{counts.in_transit}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Out for Delivery</p><p className="text-2xl font-bold text-purple-600">{counts.out_for_delivery}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Delivered</p><p className="text-2xl font-bold text-green-600">{counts.delivered_today}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-sm font-medium " + (statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</button>)}
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl text-center py-12"><p className="text-gray-500">No deliveries found</p></div>
        ) : orders.map((d: any) => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Order #{d.order_number}</h3>
                <p className="text-sm text-gray-500">{d.customer?.name || 'N/A'}</p>
              </div>
              <span className={"px-3 py-1 text-sm font-semibold rounded-full " + getStatusBadge(d.order_status)}>{d.order_status?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Ordered</span><span>Shipped</span><span>In Transit</span><span>Delivered</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: getProgress(d.order_status) + '%' }} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
              <div><p className="text-gray-500">Order Date</p><p className="font-medium">{d.order_date ? new Date(d.order_date).toLocaleDateString() : '\u2014'}</p></div>
              <div><p className="text-gray-500">Expected</p><p className="font-medium">{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : 'Not set'}</p></div>
              <div><p className="text-gray-500">Amount</p><p className="font-medium">{fmtC(d.total_amount)}</p></div>
              <div><p className="text-gray-500">Payment</p><p className="font-medium capitalize">{d.payment_status}</p></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Link to={"/orders/" + d.id} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium">View Details</Link>
              {['approved', 'processing', 'packed'].includes(d.order_status) && (
                <button onClick={() => handleDispatch(d.id)} disabled={!!busy} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{busy === d.id+'-dispatch' ? 'Dispatching...' : 'Dispatch'}</button>
              )}
              {['shipped', 'in_transit', 'out_for_delivery'].includes(d.order_status) && (
                <button onClick={() => handleComplete(d.id)} disabled={!!busy} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{busy === d.id+'-complete' ? 'Completing...' : 'Mark Delivered'}</button>
              )}
              {d.order_status === 'delivered' && d.payment_status !== 'paid' && (
                <button onClick={() => handleCreateInvoice(d.id)} disabled={!!busy} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50">{busy === d.id+'-invoice' ? 'Creating...' : 'Generate Invoice'}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700">Showing {(page-1)*limit+1} to {Math.min(page*limit, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p+1)} disabled={page*limit >= total} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
