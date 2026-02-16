import { useState, useEffect } from 'react'
import { Target, TrendingUp, Calendar, Award, ChevronDown, ChevronUp } from 'lucide-react'
import { API_CONFIG } from '../../config/api.config'

interface TargetItem {
  id: string
  target_type: 'boards' | 'sims'
  target_scope: 'customers' | 'stores'
  period_type: 'daily' | 'monthly'
  period_start: string
  period_end: string
  target_value: number
  achieved_value: number
  status: string
  region_name?: string
  progress: { progress_date: string; daily_total: number }[]
}

export default function MyTargets() {
  const [targets, setTargets] = useState<TargetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'daily' | 'monthly'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'boards' | 'sims'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchTargets()
  }, [])

  const fetchTargets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_CONFIG.BASE_URL}/agent-targets/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      setTargets(json.data || [])
    } catch (error) {
      console.error('Error fetching targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = targets.filter(t => {
    if (filter !== 'all' && t.period_type !== filter) return false
    if (typeFilter !== 'all' && t.target_type !== typeFilter) return false
    return true
  })

  const activeTargets = filtered.filter(t => t.status === 'active')
  const completedTargets = filtered.filter(t => t.status === 'completed')

  const totalTarget = activeTargets.reduce((s, t) => s + t.target_value, 0)
  const totalAchieved = activeTargets.reduce((s, t) => s + t.achieved_value, 0)
  const overallPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-green-500'
    if (pct >= 75) return 'bg-blue-500'
    if (pct >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      missed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>{status}</span>
  }

  const getTypeLabel = (type: string, scope: string) => {
    const typeMap: Record<string, string> = { boards: 'Boards', sims: 'SIMs' }
    const scopeMap: Record<string, string> = { customers: 'Customers', stores: 'Stores' }
    return `${typeMap[type] || type} (${scopeMap[scope] || scope})`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="w-full">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              My Targets
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-7 h-7 text-blue-600" />
              <span className="text-xs font-medium text-gray-500">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeTargets.length}</p>
            <p className="text-xs text-gray-500 mt-1">targets</p>
          </div>

          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-7 h-7 text-green-600" />
              <span className="text-xs font-medium text-gray-500">Achieved</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalAchieved}/{totalTarget}</p>
            <p className="text-xs text-gray-500 mt-1">{overallPct}% overall</p>
          </div>

          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-7 h-7 text-yellow-600" />
              <span className="text-xs font-medium text-gray-500">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedTargets.length}</p>
            <p className="text-xs text-gray-500 mt-1">targets met</p>
          </div>

          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-7 h-7 text-purple-600" />
              <span className="text-xs font-medium text-gray-500">Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {targets.filter(t => t.status === 'active' && t.period_type === 'daily').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">daily targets</p>
          </div>
        </div>

        {totalTarget > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">{overallPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className={`${getProgressColor(overallPct)} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(overallPct, 100)}%` }} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(['all', 'daily', 'monthly'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f === 'all' ? 'All Periods' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1" />
          {(['all', 'boards', 'sims'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${typeFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f === 'all' ? 'All Types' : f === 'boards' ? 'Boards' : 'SIMs'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No targets found</p>
            </div>
          ) : (
            filtered.map(target => {
              const pct = target.target_value > 0 ? Math.round((target.achieved_value / target.target_value) * 100) : 0
              const isExpanded = expandedId === target.id
              return (
                <div key={target.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : target.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${target.target_type === 'boards' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                          <span className="text-sm font-semibold text-gray-900">{getTypeLabel(target.target_type, target.target_scope)}</span>
                          {getStatusBadge(target.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="capitalize">{target.period_type}</span>
                          <span>{target.period_start} — {target.period_end}</span>
                          {target.region_name && <span className="bg-gray-100 px-2 py-0.5 rounded">{target.region_name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{target.achieved_value}/{target.target_value}</p>
                          <p className="text-xs text-gray-500">{pct}%</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className={`${getProgressColor(pct)} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>

                  {isExpanded && target.progress && target.progress.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 mb-3">Daily Breakdown</p>
                      <div className="space-y-2">
                        {target.progress.slice(0, 10).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{p.progress_date}</span>
                            <span className="font-medium text-gray-900">+{p.daily_total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
