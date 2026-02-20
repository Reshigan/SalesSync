import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Truck, FileText, CreditCard, RotateCcw, DollarSign, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { ordersService } from '../../services/orders.service'

const fmtC = (a: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(a || 0)

export default function WorkflowDashboardPage() {
  const nav = useNavigate()
  const [dash, setDash] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try { const d = await ordersService.getWorkflowDashboard(); setDash(d) }
      catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  const cards = [
    { label: 'Pending Orders', value: dash.pending_orders || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/orders' },
    { label: 'Awaiting Delivery', value: dash.awaiting_delivery || 0, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/order-lifecycle/delivery-tracking' },
    { label: 'Awaiting Invoice', value: dash.awaiting_invoice || 0, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', link: '/finance/invoices' },
    { label: 'Overdue Invoices', value: dash.overdue_invoices || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', link: '/finance/invoices' },
    { label: 'Pending Returns', value: dash.pending_returns || 0, icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50', link: '/returns' },
    { label: 'Total Revenue', value: fmtC(dash.total_revenue || 0), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', link: '/finance/summary' },
    { label: 'Outstanding', value: fmtC(dash.total_outstanding || 0), icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', link: '/finance/invoices' },
    { label: 'Completed Today', value: dash.completed_today || 0, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50', link: '/orders' },
  ]

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div><h1 className="text-xl font-bold text-gray-900">Workflow Dashboard</h1><p className="text-sm text-gray-500">Order-to-cash lifecycle overview</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => {
          const I = c.icon
          return <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => nav(c.link)}>
            <div className="flex items-center gap-3"><div className={"p-2 rounded-lg " + c.bg}><I className={"w-5 h-5 " + c.color} /></div><div><p className="text-xs text-gray-500">{c.label}</p><p className="text-lg font-bold">{c.value}</p></div></div>
          </div>
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => nav('/orders/pipeline')}>
          <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-blue-600" /><h3 className="font-semibold">Order Pipeline</h3></div>
          <p className="text-sm text-gray-500">View orders grouped by status with counts and totals</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => nav('/order-lifecycle/delivery-tracking')}>
          <div className="flex items-center gap-2 mb-2"><Truck className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold">Delivery Tracking</h3></div>
          <p className="text-sm text-gray-500">Track deliveries in progress and manage dispatch</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => nav('/finance/invoices')}>
          <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-orange-600" /><h3 className="font-semibold">Invoice Management</h3></div>
          <p className="text-sm text-gray-500">Generate invoices and track payment collection</p>
        </div>
      </div>
    </div>
  )
}
