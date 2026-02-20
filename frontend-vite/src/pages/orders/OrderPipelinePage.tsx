import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, DollarSign, Clock, Truck, FileText, CheckCircle, XCircle, RefreshCw, ChevronRight, Filter } from 'lucide-react'
import { ordersService } from '../../services/orders.service'

const fmtC = (a: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a || 0)
const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) : ''

const STAGE_META: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  submitted: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  approved: { icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  processing: { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  packed: { icon: Package, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  shipped: { icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
  delivered: { icon: Truck, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
  invoiced: { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
}

export default function OrderPipelinePage() {
  const nav = useNavigate()
  const [data, setData] = useState<any>({ pipeline: {}, stages: [] })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string[]>(['draft', 'submitted', 'approved', 'processing'])

  useEffect(() => { fetchPipeline() }, [])

  const fetchPipeline = async () => {
    setLoading(true)
    try { const d = await ordersService.getOrderPipeline(); setData(d) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggle = (s: string) => setExpanded(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const stages = data.stages?.length ? data.stages : Object.keys(data.pipeline || {})
  const pipeline = data.pipeline || {}
  const totalOrders = stages.reduce((s: number, st: string) => s + (pipeline[st]?.count || 0), 0)
  const totalValue = stages.reduce((s: number, st: string) => s + (pipeline[st]?.total_value || 0), 0)

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-gray-900">Order Pipeline</h1><p className="text-sm text-gray-500">{totalOrders} orders | {fmtC(totalValue)} total value</p></div>
        <button onClick={fetchPipeline} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stages.filter((s: string) => s !== 'cancelled').map((s: string) => {
          const d = pipeline[s] || { count: 0, total_value: 0 }
          const m = STAGE_META[s] || STAGE_META.draft
          const I = m.icon
          return <div key={s} className={"rounded-lg border p-3 cursor-pointer " + m.bg} onClick={() => toggle(s)}>
            <div className="flex items-center gap-2"><I className={"w-4 h-4 " + m.color} /><span className="text-xs font-medium text-gray-600 capitalize">{s}</span></div>
            <p className="text-xl font-bold mt-1">{d.count}</p>
            <p className="text-xs text-gray-500">{fmtC(d.total_value)}</p>
          </div>
        })}
      </div>

      <div className="space-y-3">
        {stages.map((s: string) => {
          const d = pipeline[s] || { count: 0, total_value: 0, orders: [] }
          if (d.count === 0) return null
          const m = STAGE_META[s] || STAGE_META.draft
          const I = m.icon
          const isOpen = expanded.includes(s)
          return (
            <div key={s} className="bg-white rounded-xl border border-gray-200">
              <button onClick={() => toggle(s)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3"><I className={"w-5 h-5 " + m.color} /><span className="font-semibold capitalize">{s}</span><span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{d.count}</span><span className="text-sm text-gray-500">{fmtC(d.total_value)}</span></div>
                <ChevronRight className={"w-5 h-5 text-gray-400 transition-transform " + (isOpen ? 'rotate-90' : '')} />
              </button>
              {isOpen && d.orders?.length > 0 && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {d.orders.map((o: any) => (
                    <div key={o.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => nav('/orders/' + o.id)}>
                      <div><span className="font-medium text-sm">{o.order_number}</span><p className="text-xs text-gray-500">{o.customer_name || 'Unknown'} | {fmtD(o.order_date || o.created_at)}</p></div>
                      <div className="text-right"><p className="font-semibold text-sm">{fmtC(o.total_amount)}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
