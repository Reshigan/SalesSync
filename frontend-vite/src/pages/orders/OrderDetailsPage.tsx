import toast from 'react-hot-toast'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Printer, Package, DollarSign, Calendar, User, CheckCircle, XCircle, Clock, Truck, FileText, CreditCard, RefreshCw, Send, RotateCcw, AlertTriangle, ChevronRight } from 'lucide-react'
import { ordersService } from '../../services/orders.service'

const fmtC = (a: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a || 0)
const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '\u2014'
const fmtDT = (d: string) => d ? new Date(d).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014'

const SC: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800', submitted: 'bg-blue-100 text-blue-800', pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-indigo-100 text-indigo-800', processing: 'bg-purple-100 text-purple-800', packed: 'bg-violet-100 text-violet-800',
  shipped: 'bg-cyan-100 text-cyan-800', delivered: 'bg-teal-100 text-teal-800', invoiced: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', paid: 'bg-green-100 text-green-800',
  partial: 'bg-amber-100 text-amber-800', sent: 'bg-blue-100 text-blue-800', overdue: 'bg-red-100 text-red-800',
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('items')
  const [busy, setBusy] = useState('')
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [pay, setPay] = useState({ amount: 0, payment_method: 'cash', reference_number: '', notes: '' })

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const d = await ordersService.getOrderFull(id)
      if (d) { setOrder(d) }
      else {
        const fb = await ordersService.getOrder(id)
        if (fb) setOrder({ ...fb, items: fb.items || [], deliveries: [], invoices: [], payments: [], returns: [], history: [], allowed_actions: [], lifecycle: [] })
        else setOrder(null)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const act = async (a: string) => {
    if (!id || busy) return
    setBusy(a)
    try {
      if (a === 'submit') { await ordersService.submitOrder(id); toast.success('Submitted') }
      else if (a === 'approve') { await ordersService.approveOrder(id); toast.success('Approved') }
      else if (a === 'create_delivery') { await ordersService.createDeliveryFromOrder(id); toast.success('Delivery created') }
      else if (a === 'create_invoice') { await ordersService.createInvoiceFromOrder(id); toast.success('Invoice generated') }
      else if (a === 'cancel') { setCancelModal(true); setBusy(''); return }
      else if (a === 'record_payment') {
        setPay(p => ({ ...p, amount: order?.invoices?.[0]?.amount_due || order?.total_amount || 0 }))
        setPayModal(true); setBusy(''); return
      }
      await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Action failed') }
    finally { setBusy('') }
  }

  const doCancel = async () => {
    if (!id) return; setBusy('cancel')
    try { await ordersService.cancelOrder(id, cancelReason); toast.success('Cancelled'); setCancelModal(false); setCancelReason(''); await load() }
    catch (e: any) { toast.error(e.response?.data?.message || 'Cancel failed') }
    finally { setBusy('') }
  }

  const doPay = async () => {
    if (!order) return; setBusy('pay')
    try {
      const iid = order.invoices?.[0]?.id
      if (iid) { await ordersService.recordPayment(iid, pay); toast.success('Payment recorded') }
      else toast.error('No invoice to pay')
      setPayModal(false); setPay({ amount: 0, payment_method: 'cash', reference_number: '', notes: '' }); await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Payment failed') }
    finally { setBusy('') }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (!order) return <div className="text-center py-12"><h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3><button onClick={() => nav('/orders')} className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-4">Back to Orders</button></div>

  const st = order.order_status || 'draft'
  const ps = order.payment_status || 'pending'
  const lc = order.lifecycle || []
  const aa = order.allowed_actions || []
  const items = order.items || []
  const deliveries = order.deliveries || []
  const invoices = order.invoices || []
  const payments = order.payments || []
  const returns = order.returns || []
  const hist = order.history || []

  const AC: Record<string, { icon: any; label: string; cls: string }> = {
    edit: { icon: Edit2, label: 'Edit', cls: 'bg-gray-600 hover:bg-gray-700' },
    submit: { icon: Send, label: 'Submit', cls: 'bg-blue-600 hover:bg-blue-700' },
    approve: { icon: CheckCircle, label: 'Approve', cls: 'bg-green-600 hover:bg-green-700' },
    reject: { icon: XCircle, label: 'Reject', cls: 'bg-red-600 hover:bg-red-700' },
    create_delivery: { icon: Truck, label: 'Create Delivery', cls: 'bg-indigo-600 hover:bg-indigo-700' },
    create_invoice: { icon: FileText, label: 'Generate Invoice', cls: 'bg-orange-600 hover:bg-orange-700' },
    record_payment: { icon: CreditCard, label: 'Record Payment', cls: 'bg-green-600 hover:bg-green-700' },
    create_return: { icon: RotateCcw, label: 'Create Return', cls: 'bg-amber-600 hover:bg-amber-700' },
    cancel: { icon: XCircle, label: 'Cancel', cls: 'bg-red-600 hover:bg-red-700' },
  }

  const tabs = [
    { k: 'items', l: 'Items', c: items.length }, { k: 'deliveries', l: 'Deliveries', c: deliveries.length },
    { k: 'invoices', l: 'Invoices', c: invoices.length }, { k: 'payments', l: 'Payments', c: payments.length },
    { k: 'returns', l: 'Returns', c: returns.length }, { k: 'history', l: 'History', c: hist.length },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => nav('/orders')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-xl font-bold text-gray-900">{order.order_number || 'Order'}</h1><p className="text-sm text-gray-500">{fmtD(order.order_date || order.created_at)}</p></div>
          <span className={"px-2.5 py-1 text-xs font-semibold rounded-full " + (SC[st] || 'bg-gray-100 text-gray-800')}>{st.replace(/_/g, ' ').toUpperCase()}</span>
          <span className={"px-2.5 py-1 text-xs font-semibold rounded-full " + (SC[ps] || 'bg-gray-100 text-gray-800')}>{ps.toUpperCase()}</span>
        </div>
        <div className="flex gap-2"><button onClick={() => window.print()} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"><Printer className="w-4 h-4" /> Print</button><button onClick={load} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button></div>
      </div>

      {lc.length > 0 && st !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {lc.map((s: any, i: number) => (
              <div key={s.stage} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + (s.completed ? 'bg-green-500 text-white' : s.active ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500')}>
                    {s.completed ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={"text-xs mt-1.5 font-medium " + (s.completed ? 'text-green-700' : s.active ? 'text-blue-700' : 'text-gray-400')}>{s.label}</span>
                </div>
                {i < lc.length - 1 && <div className={"w-12 sm:w-20 h-0.5 mx-1 " + (s.completed ? 'bg-green-500' : 'bg-gray-200')} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {aa.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {aa.map((a: string) => {
              const c = AC[a]; if (!c) return null
              if (a === 'edit') return <button key={a} onClick={() => nav('/orders/' + id + '/edit')} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"><Edit2 className="w-4 h-4" /> Edit</button>
              const I = c.icon
              return <button key={a} onClick={() => act(a)} disabled={!!busy} className={"px-3 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 " + c.cls + (busy === a ? ' opacity-60' : '')}>{busy === a ? <RefreshCw className="w-4 h-4 animate-spin" /> : <I className="w-4 h-4" />} {c.label}</button>
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="flex items-center gap-2"><div className="p-2 bg-blue-50 rounded-lg"><Package className="w-4 h-4 text-blue-600" /></div><div><p className="text-xs text-gray-500">Items</p><p className="text-lg font-bold">{items.length}</p></div></div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="flex items-center gap-2"><div className="p-2 bg-green-50 rounded-lg"><DollarSign className="w-4 h-4 text-green-600" /></div><div><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{fmtC(order.total_amount)}</p></div></div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="flex items-center gap-2"><div className="p-2 bg-purple-50 rounded-lg"><Calendar className="w-4 h-4 text-purple-600" /></div><div><p className="text-xs text-gray-500">Delivery</p><p className="text-sm font-bold">{fmtD(order.delivery_date)}</p></div></div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="flex items-center gap-2"><div className="p-2 bg-orange-50 rounded-lg"><User className="w-4 h-4 text-orange-600" /></div><div><p className="text-xs text-gray-500">Customer</p><p className="text-sm font-bold truncate max-w-[120px]">{order.customer_name || '\u2014'}</p></div></div></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto"><nav className="flex -mb-px">{tabs.map(t => <button key={t.k} onClick={() => setTab(t.k)} className={"px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 " + (tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>{t.l}{t.c > 0 && <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{t.c}</span>}</button>)}</nav></div>
        <div className="p-4">
          {tab === 'items' && <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-3 text-gray-500 font-medium">Product</th><th className="text-left py-2 px-3 text-gray-500 font-medium">SKU</th><th className="text-right py-2 px-3 text-gray-500 font-medium">Qty</th><th className="text-right py-2 px-3 text-gray-500 font-medium">Price</th><th className="text-right py-2 px-3 text-gray-500 font-medium">Tax</th><th className="text-right py-2 px-3 text-gray-500 font-medium">Total</th></tr></thead>
              <tbody>{items.map((it: any, i: number) => <tr key={it.id || i} className="border-b border-gray-100"><td className="py-2 px-3 font-medium">{it.product_name || it.productName || '\u2014'}</td><td className="py-2 px-3 text-gray-500">{it.product_sku || it.sku || '\u2014'}</td><td className="py-2 px-3 text-right">{it.quantity}</td><td className="py-2 px-3 text-right">{fmtC(it.unit_price || it.unitPrice)}</td><td className="py-2 px-3 text-right">{fmtC(it.tax_amount || it.taxAmount || 0)}</td><td className="py-2 px-3 text-right font-medium">{fmtC(it.line_total || it.subtotal || it.total_amount || (it.quantity * (it.unit_price || it.unitPrice || 0)))}</td></tr>)}</tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300"><td colSpan={4} /><td className="py-2 px-3 text-right text-gray-500">Subtotal</td><td className="py-2 px-3 text-right font-medium">{fmtC(order.subtotal)}</td></tr>
                <tr><td colSpan={4} /><td className="py-1 px-3 text-right text-gray-500">Tax</td><td className="py-1 px-3 text-right">{fmtC(order.tax_amount)}</td></tr>
                {(order.discount_amount || 0) > 0 && <tr><td colSpan={4} /><td className="py-1 px-3 text-right text-gray-500">Discount</td><td className="py-1 px-3 text-right text-red-600">-{fmtC(order.discount_amount)}</td></tr>}
                <tr className="font-bold text-lg"><td colSpan={4} /><td className="py-2 px-3 text-right">Total</td><td className="py-2 px-3 text-right">{fmtC(order.total_amount)}</td></tr>
              </tfoot>
            </table>
            {items.length === 0 && <p className="text-center text-gray-500 py-8">No items</p>}
          </div>}

          {tab === 'deliveries' && <div>
            {deliveries.length === 0 ? <div className="text-center py-8"><Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No deliveries yet</p>{aa.includes('create_delivery') && <button onClick={() => act('create_delivery')} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Create Delivery</button>}</div>
            : <div className="space-y-3">{deliveries.map((d: any) => <div key={d.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onClick={() => nav('/order-lifecycle/delivery-tracking')}><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="font-semibold">{d.delivery_number || d.id?.slice(0,8)}</span><span className={"px-2 py-0.5 text-xs font-semibold rounded-full " + (SC[d.status] || 'bg-gray-100 text-gray-800')}>{(d.status||'pending').toUpperCase()}</span></div><p className="text-sm text-gray-500 mt-1">{d.driver_name ? 'Driver: '+d.driver_name : ''} {d.delivery_date ? fmtD(d.delivery_date) : ''}</p></div><ChevronRight className="w-5 h-5 text-gray-400" /></div></div>)}</div>}
          </div>}

          {tab === 'invoices' && <div>
            {invoices.length === 0 ? <div className="text-center py-8"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No invoices yet</p>{aa.includes('create_invoice') && <button onClick={() => act('create_invoice')} className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium">Generate Invoice</button>}</div>
            : <div className="space-y-3">{invoices.map((inv: any) => <div key={inv.id} className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="font-semibold">{inv.invoice_number || inv.id?.slice(0,8)}</span><span className={"px-2 py-0.5 text-xs font-semibold rounded-full " + (SC[inv.status] || 'bg-gray-100 text-gray-800')}>{(inv.status||'draft').toUpperCase()}</span></div><p className="text-sm text-gray-500 mt-1">Due: {fmtD(inv.due_date)} | Paid: {fmtC(inv.amount_paid||0)} / {fmtC(inv.total_amount)}</p></div><div className="text-right"><p className="font-bold">{fmtC(inv.amount_due||0)}</p><p className="text-xs text-gray-500">Outstanding</p></div></div></div>)}</div>}
          </div>}

          {tab === 'payments' && <div>
            {payments.length === 0 ? <div className="text-center py-8"><CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No payments</p>{aa.includes('record_payment') && <button onClick={() => act('record_payment')} className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Record Payment</button>}</div>
            : <div className="space-y-3">{payments.map((p: any) => <div key={p.id} className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between"><div><span className="font-semibold">{p.payment_number || p.id?.slice(0,8)}</span><p className="text-sm text-gray-500 mt-1">{p.payment_method} | {fmtDT(p.payment_date || p.created_at)}</p>{p.reference_number && <p className="text-xs text-gray-400">Ref: {p.reference_number}</p>}</div><p className="font-bold text-green-600">{fmtC(p.amount)}</p></div></div>)}</div>}
          </div>}

          {tab === 'returns' && <div>
            {returns.length === 0 ? <div className="text-center py-8"><RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No returns</p></div>
            : <div className="space-y-3">{returns.map((r: any) => <div key={r.id} className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="font-semibold">{r.return_number || r.id?.slice(0,8)}</span><span className={"px-2 py-0.5 text-xs font-semibold rounded-full " + (SC[r.status] || 'bg-gray-100 text-gray-800')}>{(r.status||'pending').toUpperCase()}</span></div><p className="text-sm text-gray-500 mt-1">{r.reason || 'No reason'}</p></div><p className="font-bold">{fmtC(r.total_amount)}</p></div></div>)}</div>}
          </div>}

          {tab === 'history' && <div>
            {hist.length === 0 ? <div className="text-center py-8"><Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No history</p></div>
            : <div className="space-y-0">{hist.map((h: any, i: number) => <div key={h.id||i} className="flex gap-3 py-3"><div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />{i < hist.length-1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}</div><div className="flex-1 pb-2"><p className="text-sm font-medium">{h.old_status && h.new_status ? <>{h.old_status} <ChevronRight className="w-3 h-3 inline" /> <span className="text-blue-600">{h.new_status}</span></> : h.status || 'Change'}</p>{h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}<p className="text-xs text-gray-400 mt-0.5">{fmtDT(h.created_at)} {h.changed_by ? 'by '+h.changed_by : ''}</p></div></div>)}</div>}
          </div>}
        </div>
      </div>

      {cancelModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCancelModal(false)}><div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e: any) => e.stopPropagation()}><div className="flex items-center gap-3 mb-4"><div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="w-5 h-5 text-red-600" /></div><h3 className="text-lg font-semibold">Cancel Order</h3></div><p className="text-sm text-gray-600 mb-4">This cannot be undone.</p><textarea value={cancelReason} onChange={(e: any) => setCancelReason(e.target.value)} placeholder="Reason..." className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4" rows={3} /><div className="flex justify-end gap-3"><button onClick={() => setCancelModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Keep</button><button onClick={doCancel} disabled={!!busy} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">{busy === 'cancel' ? 'Cancelling...' : 'Cancel Order'}</button></div></div></div>}

      {payModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(false)}><div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e: any) => e.stopPropagation()}><h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Record Payment</h3><div className="space-y-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">Amount</label><input type="number" value={pay.amount} onChange={(e: any) => setPay((p: any) => ({...p, amount: parseFloat(e.target.value)||0}))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Method</label><select value={pay.payment_method} onChange={(e: any) => setPay((p: any) => ({...p, payment_method: e.target.value}))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"><option value="cash">Cash</option><option value="eft">EFT</option><option value="card">Card</option><option value="cheque">Cheque</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Reference</label><input type="text" value={pay.reference_number} onChange={(e: any) => setPay((p: any) => ({...p, reference_number: e.target.value}))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Optional" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={pay.notes} onChange={(e: any) => setPay((p: any) => ({...p, notes: e.target.value}))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" rows={2} placeholder="Optional" /></div></div><div className="flex justify-end gap-3 mt-4"><button onClick={() => setPayModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={doPay} disabled={!!busy || !pay.amount} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">{busy === 'pay' ? 'Recording...' : 'Record ' + fmtC(pay.amount)}</button></div></div></div>}
    </div>
  )
}
