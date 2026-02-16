import { useState, useEffect } from 'react'
import { BarChart3, Target, MapPin, Users, Trophy, TrendingUp, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { apiClient } from '../../services/api.service'

interface AgentReport {
  agent_id: string
  agent_name: string
  role_level: string
  region_name?: string
  target_type: string
  target_scope: string
  period_type: string
  target_count: number
  total_target: number
  total_achieved: number
  achievement_pct: number
}

interface RegionReport {
  region_id: string
  region_name: string
  region_level: string
  target_type: string
  period_type: string
  agent_count: number
  total_target: number
  total_achieved: number
  achievement_pct: number
}

interface LeaderboardEntry {
  agent_id: string
  agent_name: string
  role_level: string
  region_name?: string
  total_achieved: number
  total_target: number
  achievement_pct: number
}

interface RegionNode {
  id: string
  name: string
  level: string
  manager_name?: string
  children: RegionNode[]
}

type TabType = 'agents' | 'regions' | 'leaderboard' | 'hierarchy'

export default function TargetReportingPage() {
  const [tab, setTab] = useState<TabType>('agents')
  const [agentReport, setAgentReport] = useState<AgentReport[]>([])
  const [regionReport, setRegionReport] = useState<RegionReport[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [regionTree, setRegionTree] = useState<RegionNode[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')

  useEffect(() => { fetchData() }, [filterType, filterPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('target_type', filterType)
      if (filterPeriod !== 'all') params.set('period_type', filterPeriod)
      const qs = params.toString() ? `?${params.toString()}` : ''

      const [agentRes, regionRes, lbRes, treeRes] = await Promise.all([
        apiClient.get(`/agent-targets/report/by-agent${qs}`),
        apiClient.get(`/agent-targets/report/by-region${qs}`),
        apiClient.get(`/agent-targets/report/leaderboard${qs}`),
        apiClient.get(`/regions/tree`)
      ])
      setAgentReport(agentRes.data?.data || [])
      setRegionReport(regionRes.data?.data || [])
      setLeaderboard(lbRes.data?.data || [])
      setRegionTree(treeRes.data?.data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPctBar = (pct: number) => {
    const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <span className={`text-xs font-medium ${pct >= 100 ? 'text-green-600' : pct >= 75 ? 'text-blue-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      agent: 'bg-gray-100 text-gray-700',
      team_leader: 'bg-blue-100 text-blue-700',
      junior_sales_manager: 'bg-purple-100 text-purple-700',
      sales_manager: 'bg-indigo-100 text-indigo-700',
      regional_manager: 'bg-orange-100 text-orange-700',
      director: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      agent: 'Agent',
      team_leader: 'Team Leader',
      junior_sales_manager: 'Jr. Sales Mgr',
      sales_manager: 'Sales Manager',
      regional_manager: 'Regional Mgr',
      director: 'Director'
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role] || colors.agent}`}>{labels[role] || role}</span>
  }

  const totalAgentTarget = agentReport.reduce((s, r) => s + r.total_target, 0)
  const totalAgentAchieved = agentReport.reduce((s, r) => s + r.total_achieved, 0)
  const overallPct = totalAgentTarget > 0 ? Math.round((totalAgentAchieved / totalAgentTarget) * 100) : 0

  const tabs: { key: TabType; label: string; icon: typeof BarChart3 }[] = [
    { key: 'agents', label: 'By Agent', icon: Users },
    { key: 'regions', label: 'By Region', icon: MapPin },
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'hierarchy', label: 'Region Tree', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="w-full">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
              Target Reporting
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-7 h-7 text-blue-600" />
              <span className="text-xs font-medium text-gray-500">Overall</span>
            </div>
            <p className="text-2xl font-bold">{overallPct}%</p>
            <p className="text-xs text-gray-500 mt-1">achievement rate</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-7 h-7 text-green-600" />
              <span className="text-xs font-medium text-gray-500">Achieved</span>
            </div>
            <p className="text-2xl font-bold">{totalAgentAchieved}</p>
            <p className="text-xs text-gray-500 mt-1">of {totalAgentTarget} total</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-7 h-7 text-purple-600" />
              <span className="text-xs font-medium text-gray-500">Agents</span>
            </div>
            <p className="text-2xl font-bold">{new Set(agentReport.map(r => r.agent_id)).size}</p>
            <p className="text-xs text-gray-500 mt-1">with targets</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-7 h-7 text-orange-600" />
              <span className="text-xs font-medium text-gray-500">Regions</span>
            </div>
            <p className="text-2xl font-bold">{new Set(regionReport.map(r => r.region_id)).size}</p>
            <p className="text-xs text-gray-500 mt-1">active regions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
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

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b border-gray-100">
            <div className="flex overflow-x-auto">
              {tabs.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Icon className="w-4 h-4" /> {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <div className="p-4">
              {tab === 'agents' && <AgentTab data={agentReport} getPctBar={getPctBar} getRoleBadge={getRoleBadge} />}
              {tab === 'regions' && <RegionTab data={regionReport} getPctBar={getPctBar} />}
              {tab === 'leaderboard' && <LeaderboardTab data={leaderboard} getPctBar={getPctBar} getRoleBadge={getRoleBadge} />}
              {tab === 'hierarchy' && <HierarchyTab data={regionTree} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AgentTab({ data, getPctBar, getRoleBadge }: { data: AgentReport[]; getPctBar: (pct: number) => JSX.Element; getRoleBadge: (role: string) => JSX.Element }) {
  if (data.length === 0) return <div className="text-center py-12 text-gray-500">No agent data available</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Agent</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Region</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Target</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Achieved</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.agent_name}</td>
              <td className="px-4 py-3">{getRoleBadge(r.role_level)}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{r.region_name || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700 capitalize">{r.target_type} / {r.target_scope}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">{r.period_type}</span></td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.total_target}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.total_achieved}</td>
              <td className="px-4 py-3">{getPctBar(r.achievement_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RegionTab({ data, getPctBar }: { data: RegionReport[]; getPctBar: (pct: number) => JSX.Element }) {
  if (data.length === 0) return <div className="text-center py-12 text-gray-500">No region data available</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Region</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Level</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Agents</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Target</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Achieved</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.region_name}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">{r.region_level}</span></td>
              <td className="px-4 py-3 text-sm text-gray-700 capitalize">{r.target_type}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{r.agent_count}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.total_target}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.total_achieved}</td>
              <td className="px-4 py-3">{getPctBar(r.achievement_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LeaderboardTab({ data, getPctBar, getRoleBadge }: { data: LeaderboardEntry[]; getPctBar: (pct: number) => JSX.Element; getRoleBadge: (role: string) => JSX.Element }) {
  if (data.length === 0) return <div className="text-center py-12 text-gray-500">No leaderboard data available</div>
  return (
    <div className="space-y-3">
      {data.map((entry, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{entry.agent_name}</span>
              {getRoleBadge(entry.role_level)}
            </div>
            {entry.region_name && <p className="text-xs text-gray-500">{entry.region_name}</p>}
          </div>
          <div className="text-right mr-4">
            <p className="text-sm font-bold text-gray-900">{entry.total_achieved}/{entry.total_target}</p>
          </div>
          <div className="w-32">{getPctBar(entry.achievement_pct)}</div>
        </div>
      ))}
    </div>
  )
}

function HierarchyTab({ data }: { data: RegionNode[] }) {
  if (data.length === 0) return <div className="text-center py-12 text-gray-500">No region hierarchy configured</div>
  return (
    <div className="space-y-2">
      {data.map(node => <RegionTreeNode key={node.id} node={node} depth={0} />)}
    </div>
  )
}

function RegionTreeNode({ node, depth }: { node: RegionNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  const levelColors: Record<string, string> = {
    country: 'bg-red-100 text-red-700',
    province: 'bg-orange-100 text-orange-700',
    district: 'bg-blue-100 text-blue-700',
    area: 'bg-green-100 text-green-700'
  }

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => hasChildren && setExpanded(!expanded)}>
        {hasChildren ? (expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />) : <div className="w-4" />}
        <MapPin className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{node.name}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[node.level] || 'bg-gray-100 text-gray-600'}`}>{node.level}</span>
        {node.manager_name && <span className="text-xs text-gray-500 ml-2">Mgr: {node.manager_name}</span>}
      </div>
      {expanded && hasChildren && node.children.map(child => <RegionTreeNode key={child.id} node={child} depth={depth + 1} />)}
    </div>
  )
}
