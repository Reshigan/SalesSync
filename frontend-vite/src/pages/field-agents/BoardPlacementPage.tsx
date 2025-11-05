import { useState, useEffect } from 'react'
import {
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  RefreshCw,
  Target,
  Image as ImageIcon
} from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fieldMarketingService } from '../../services/field-marketing.service'

interface BoardPlacement {
  id: string
  board_id: string
  board_type: 'billboard' | 'poster' | 'banner' | 'digital'
  location: {
    address: string
    lat: number
    lng: number
    landmark: string
  }
  agent_id: string
  agent_name: string
  placement_date: string
  removal_date?: string
  status: 'active' | 'removed' | 'damaged' | 'expired'
  photos: {
    before?: string
    after: string
    current?: string
  }
  campaign: {
    id: string
    name: string
    client: string
    budget: number
  }
  metrics: {
    visibility_score: number
    foot_traffic: number
    estimated_impressions: number
    cost_per_impression: number
  }
  notes: string
  verification_required: boolean
  last_verified: string
}

interface Campaign {
  id: string
  name: string
  client: string
  start_date: string
  end_date: string
  budget: number
  boards_required: number
  boards_placed: number
  status: 'active' | 'completed' | 'paused'
}

export default function BoardPlacementPage() {
  const [placements, setPlacements] = useState<BoardPlacement[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedPlacement, setSelectedPlacement] = useState<BoardPlacement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [, setShowAddModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPlacementsData()
  }, [])

  const loadPlacementsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const installationsResponse = await fieldMarketingService.getBoardInstallations({
        status: statusFilter === 'all' ? undefined : statusFilter
      })

      const mappedPlacements: BoardPlacement[] = (installationsResponse.data || []).map((installation: any) => ({
        id: installation.id,
        board_id: installation.board_code || installation.board_id || `BOARD-${installation.id}`,
        board_type: installation.board_type || 'billboard',
        location: {
          address: installation.location_address || installation.customer_address || 'Unknown location',
          lat: installation.latitude || installation.location?.latitude || 0,
          lng: installation.longitude || installation.location?.longitude || 0,
          landmark: installation.landmark || installation.location_notes || ''
        },
        agent_id: installation.agent_id || 'unknown',
        agent_name: installation.agent_name || 'Unknown Agent',
        placement_date: installation.installation_date || installation.created_at || new Date().toISOString(),
        removal_date: installation.removal_date,
        status: installation.status || 'active',
        photos: {
          before: installation.pre_installation_photo || installation.before_photo,
          after: installation.post_installation_photo || installation.after_photo || '',
          current: installation.current_photo
        },
        campaign: {
          id: installation.campaign_id || installation.brand_id || 'unknown',
          name: installation.campaign_name || installation.brand_name || 'Unknown Campaign',
          client: installation.client_name || installation.customer_name || 'Unknown Client',
          budget: installation.campaign_budget || 0
        },
        metrics: {
          visibility_score: installation.visibility_score || installation.coverage_percentage || 0,
          foot_traffic: installation.foot_traffic || installation.estimated_traffic || 0,
          estimated_impressions: installation.estimated_impressions || (installation.foot_traffic || 0) * 3,
          cost_per_impression: installation.cost_per_impression || 0.10
        },
        notes: installation.notes || installation.installation_notes || '',
        verification_required: installation.verification_required || installation.requires_verification || false,
        last_verified: installation.last_verified || installation.verification_date || installation.updated_at || new Date().toISOString()
      }))

      // Derive campaigns from placements
      const campaignMap = new Map<string, Campaign>()
      mappedPlacements.forEach(placement => {
        if (!campaignMap.has(placement.campaign.id)) {
          campaignMap.set(placement.campaign.id, {
            id: placement.campaign.id,
            name: placement.campaign.name,
            client: placement.campaign.client,
            start_date: placement.placement_date,
            end_date: placement.removal_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            budget: placement.campaign.budget,
            boards_required: 0,
            boards_placed: 0,
            status: 'active'
          })
        }
        const campaign = campaignMap.get(placement.campaign.id)!
        campaign.boards_placed++
        campaign.boards_required = Math.max(campaign.boards_required, campaign.boards_placed + 5)
      })
      
      setPlacements(mappedPlacements)
      setCampaigns(Array.from(campaignMap.values()))
    } catch (err) {
      setError('Failed to load board placements data')
      console.error('Error loading placements:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadPlacementsData()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'removed': return 'text-gray-600 bg-gray-100'
      case 'damaged': return 'text-red-600 bg-red-100'
      case 'expired': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getBoardTypeColor = (type: string) => {
    switch (type) {
      case 'billboard': return 'text-blue-600 bg-blue-100'
      case 'poster': return 'text-green-600 bg-green-100'
      case 'banner': return 'text-purple-600 bg-purple-100'
      case 'digital': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredPlacements = placements.filter(placement => {
    const matchesSearch = placement.board_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || placement.status === statusFilter
    const matchesCampaign = campaignFilter === 'all' || placement.campaign.id === campaignFilter
    
    return matchesSearch && matchesStatus && matchesCampaign
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board Placement</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage advertising board placements and campaign tracking.
          </p>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Board Placements
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadPlacementsData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board Placement</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage advertising board placements, campaigns, and performance tracking.
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="btn-outline p-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Placement</span>
          </button>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campaigns.filter(c => c.status === 'active').map((campaign) => (
          <div key={campaign.id} className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                  {campaign.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium text-gray-900">{campaign.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(campaign.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium text-gray-900">{campaign.boards_placed}/{campaign.boards_required}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(campaign.boards_placed / campaign.boards_required) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatDate(campaign.start_date)}</span>
                  <span>{formatDate(campaign.end_date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by board ID, location, agent, or campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="removed">Removed</option>
          <option value="damaged">Damaged</option>
          <option value="expired">Expired</option>
        </select>
        
        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
          ))}
        </select>
      </div>

      {/* Placements Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Board Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlacements.map((placement) => (
                <tr key={placement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Target className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{placement.board_id}</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBoardTypeColor(placement.board_type)}`}>
                          {placement.board_type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{placement.location.address}</div>
                    <div className="text-sm text-gray-500">{placement.location.landmark}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{placement.campaign.name}</div>
                    <div className="text-sm text-gray-500">{placement.campaign.client}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{placement.agent_name}</div>
                    <div className="text-sm text-gray-500">{formatDate(placement.placement_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(placement.status)}`}>
                      {placement.status}
                    </span>
                    {placement.verification_required && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-yellow-600 bg-yellow-100">
                          Verification Required
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Score: {placement.metrics.visibility_score}%</div>
                    <div className="text-sm text-gray-500">{placement.metrics.estimated_impressions.toLocaleString()} impressions</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedPlacement(placement)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placement Details Modal */}
      {selectedPlacement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Board Placement Details - {selectedPlacement.board_id}
                </h3>
                <button
                  onClick={() => setSelectedPlacement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Board Type</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBoardTypeColor(selectedPlacement.board_type)}`}>
                      {selectedPlacement.board_type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPlacement.status)}`}>
                      {selectedPlacement.status}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-900">{selectedPlacement.location.address}</div>
                    <div className="text-sm text-gray-500">{selectedPlacement.location.landmark}</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance Metrics</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary-600">{selectedPlacement.metrics.visibility_score}%</div>
                      <div className="text-sm text-gray-500">Visibility Score</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedPlacement.metrics.estimated_impressions.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Est. Impressions</div>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedPlacement.photos.before && (
                      <div className="text-center">
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-500">Before</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500">After</div>
                    </div>
                    {selectedPlacement.photos.current && (
                      <div className="text-center">
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-500">Current</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedPlacement.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-900">{selectedPlacement.notes}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedPlacement(null)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button className="btn-primary">
                  Edit Placement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
