import { useState, useEffect } from 'react'
import { Target, Plus, Edit, Trash2, Users, Filter, Search, X } from 'lucide-react'
import { apiClient } from '../../services/api.service'

interface Agent {
  id: string
  user_id: string
  user_name: string
  email: string
  role_level: string
  region_name?: string
}

interface Region {
  id: string
  name: string
  level: string
}

interface TargetItem {
  id: string
  agent_id: string
  agent_name: string
  agent_email?: string
  target_type: 'boards' | 'sims'
  target_scope: 'customers' | 'stores'
  period_type: 'daily' | 'monthly'
  period_start: string
  period_end: string
  target_value: number
  achieved_value: number
  status: string
  region_name?: string
  region_id?: string
}

interface FormData {
  agent_id: string
  target_type: 'boards' | 'sims'
  target_scope: 'customers' | 'stores'
  period_type: 'daily' | 'monthly'
  period_start: string
  period_end: string
  target_value: number
  region_id: string
  notes: string
}

const defaultForm: FormData = {
  agent_id: '',
  target_type: 'boards',
  target_scope: 'customers',
  period_type: 'daily',
  period_start: new Date().toISOString().split('T')[0],
  period_end: new Date().toISOString().split('T')[0],
  target_value: 10,
  region_id: '',
  notes: ''
}

export default function TargetManagementPage() {
  const [targets, setTargets] = useState<TargetItem[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [targetsRes, agentsRes, regionsRes] = await Promise.allSettled([
        apiClient.get('/agent-targets'),
        apiClient.get('/org-hierarchy'),
        apiClient.get('/regions')
      ])
      if (targetsRes.status === 'fulfilled') setTargets(targetsRes.value.data?.data || [])
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.data?.data || [])
      if (regionsRes.status === 'fulfilled') setRegions(regionsRes.value.data?.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.agent_id || !form.target_value) return
    try {
      setSaving(true)
      if (editId) {
        await apiClient.put(`/agent-targets/${editId}`, { target_value: form.target_value, region_id: form.region_id || null, notes: form.notes })
      } else {
        await apiClient.post('/agent-targets', form)
      }
      setShowForm(false)
      setEditId(null)
      setForm(defaultForm)
      await fetchAll()
    } catch (error) {
      console.error('Error saving target:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (t: TargetItem) => {
    setEditId(t.id)
    setForm({
      agent_id: t.agent_id,
      target_type: t.target_type,
      target_scope: t.target_scope,
      period_type: t.period_type,
      period_start: t.period_start,
      period_end: t.period_end,
      target_value: t.target_value,
      region_id: t.region_id || '',
      notes: ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this target? Progress data will also be removed.')) return
    try {
      await apiClient.delete(`/agent-targets/${id}`)
      await fetchAll()
    } catch (error) {
      console.error('Error deleting target:', error)
    }
  }

  const filtered = targets.filter(t => {
    if (search && !t.agent_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'all' && t.target_type !== filterType) return false
    if (filterPeriod !== 'all' && t.period_type !== filterPeriod) return false
    return true
  })

  const getTypeLabel = (type: string, scope: string) => {
    const tMap: Record<string, string> = { boards: 'Boards', sims: 'SIMs' }
    const sMap: Record<string, string> = { customers: 'Customers', stores: 'Stores' }
    return `${tMap[type] || type} / ${sMap[scope] || scope}`
  }

  const getPctColor = (pct: number) => {
    if (pct >= 100) return 'text-green-600'
    if (pct >= 75) return 'text-blue-600'
    if (pct >= 50) return 'text-yellow-600'
    return 'text-red-600'
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
              Target Management
            </h1>
            <button onClick={() => { setEditId(null); setForm(defaultForm); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> New Target
            </button>
          </div>
        </div>
      </div>

      <div className="w-full py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Targets</p>
            <p className="text-2xl font-bold">{targets.length}</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <p className="text-xs font-medium text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-blue-600">{targets.filter(t => t.status === 'active').length}</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <p className="text-xs font-medium text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{targets.filter(t => t.status === 'completed').length}</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <p className="text-xs font-medium text-gray-500 mb-1">Agents</p>
            <p className="text-2xl font-bold">{new Set(targets.map(t => t.agent_id)).size}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="all">All Types</option>
              <option value="boards">Boards</option>
              <option value="sims">SIMs</option>
            </select>
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="all">All Periods</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      No targets found
                    </td>
                  </tr>
                ) : (
                  filtered.map(t => {
                    const pct = t.target_value > 0 ? Math.round((t.achieved_value / t.target_value) * 100) : 0
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{t.agent_name}</p>
                          {t.region_name && <p className="text-xs text-gray-500">{t.region_name}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{getTypeLabel(t.target_type, t.target_scope)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.period_type === 'daily' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{t.period_type}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{t.period_start}<br />{t.period_end}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-medium ${getPctColor(pct)}`}>{t.achieved_value}/{t.target_value}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-blue-100 text-blue-700' : t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? 'Edit Target' : 'Create Target'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                <select value={form.agent_id} onChange={e => setForm({ ...form, agent_id: e.target.value })} disabled={!!editId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">Select agent...</option>
                  {agents.map(a => <option key={a.user_id} value={a.user_id}>{a.user_name} ({a.role_level})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                  <select value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value as 'boards' | 'sims' })} disabled={!!editId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="boards">Boards</option>
                    <option value="sims">SIMs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select value={form.target_scope} onChange={e => setForm({ ...form, target_scope: e.target.value as 'customers' | 'stores' })} disabled={!!editId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="customers">Customers</option>
                    <option value="stores">Stores</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select value={form.period_type} onChange={e => setForm({ ...form, period_type: e.target.value as 'daily' | 'monthly' })} disabled={!!editId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input type="number" min={1} value={form.target_value} onChange={e => setForm({ ...form, target_value: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} disabled={!!editId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} disabled={!!editId} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select value={form.region_id} onChange={e => setForm({ ...form, region_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">No region</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.level})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.agent_id} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
