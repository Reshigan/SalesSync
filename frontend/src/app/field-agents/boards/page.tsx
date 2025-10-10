'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MobileLayout, MobileCard, MobileList, MobileListItem, MobileButton, MobileInput, MobileFloatingActionButton } from '@/components/mobile'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { fieldAgentsService, Board, BoardPlacement } from '@/services/field-agents.service'

import { 
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Camera,
  BarChart3,
  Target,
  Layers
} from 'lucide-react'

export default function BoardsManagementPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [placements, setPlacements] = useState<BoardPlacement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'boards' | 'placements'>('boards')
  
  const { success, error } = useToast()
  const router = useRouter()

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData()
  }, [statusFilter, typeFilter, activeTab])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      if (activeTab === 'boards') {
        const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
        const response = await fieldAgentsService.getBoards(filters)
        setBoards(response.data?.data || response.boards || [])
      } else {
        const filters: any = {}
        if (statusFilter !== 'all') filters.status = statusFilter
        if (typeFilter !== 'all') filters.type = typeFilter
        
        const response = await fieldAgentsService.getBoardPlacements(filters)
        setPlacements(response.data?.data || response.placements || [])
      }
    } catch (err) {
      error(`Failed to load ${activeTab}`)
      console.error(`Error loading ${activeTab}:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBoard = async (boardData: Partial<Board>) => {
    try {
      await fieldAgentsService.createBoard(boardData)
      success('Board created successfully')
      setShowCreateModal(false)
      loadData()
    } catch (err) {
      error('Failed to create board')
      console.error('Error creating board:', err)
    }
  }

  const handleCreatePlacement = async (placementData: Partial<BoardPlacement>) => {
    try {
      await fieldAgentsService.createBoardPlacement(placementData)
      success('Board placement created successfully')
      setShowCreateModal(false)
      loadData()
    } catch (err) {
      error('Failed to create board placement')
      console.error('Error creating placement:', err)
    }
  }

  const handleVerifyPlacement = async (id: string) => {
    try {
      await fieldAgentsService.updateBoardPlacement(id, { 
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString()
      })
      success('Board placement verified successfully')
      loadData()
    } catch (err) {
      error('Failed to verify board placement')
      console.error('Error verifying placement:', err)
    }
  }

  const filteredBoards = boards.filter(board =>
    (board.name || board.boardNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (board.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPlacements = placements.filter(placement =>
    (placement.boardId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (placement.fieldAgentId || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'PLACED': return 'bg-blue-100 text-blue-800'
      case 'VERIFIED': return 'bg-green-100 text-green-800'
      case 'REMOVED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />
      case 'INACTIVE': return <XCircle className="h-4 w-4" />
      case 'MAINTENANCE': return <Clock className="h-4 w-4" />
      case 'PLACED': return <Target className="h-4 w-4" />
      case 'VERIFIED': return <CheckCircle className="h-4 w-4" />
      case 'REMOVED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const totalBoards = boards.length
  const activeBoards = boards.filter(b => b.status?.toUpperCase() === 'ACTIVE').length
  const totalPlacements = placements.length
  const verifiedPlacements = placements.filter(p => p.status?.toUpperCase() === 'VERIFIED').length

  // Mobile version
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout title="Boards" showBackButton>
          <div className="space-y-6">
            {/* Tab Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('boards')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'boards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Boards ({totalBoards})
              </button>
              <button
                onClick={() => setActiveTab('placements')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'placements'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Placements ({totalPlacements})
              </button>
            </div>

            {/* Quick Stats */}
            {activeTab === 'boards' ? (
              <div className="grid grid-cols-2 gap-4">
                <MobileCard className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalBoards}</div>
                  <div className="text-sm text-gray-600">Total Boards</div>
                </MobileCard>
                <MobileCard className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activeBoards}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </MobileCard>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <MobileCard className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalPlacements}</div>
                  <div className="text-sm text-gray-600">Total Placements</div>
                </MobileCard>
                <MobileCard className="text-center">
                  <div className="text-2xl font-bold text-green-600">{verifiedPlacements}</div>
                  <div className="text-sm text-gray-600">Verified</div>
                </MobileCard>
              </div>
            )}

            {/* Search */}
            <MobileInput
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<Search className="w-5 h-5" />}
            />

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'ACTIVE', 'INACTIVE', 'VERIFIED', 'PENDING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>

            {/* Content List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <MobileList>
                {activeTab === 'boards' ? (
                  filteredBoards.map((board) => (
                    <MobileListItem
                      key={board.id}
                      title={board.title}
                      subtitle={board.type}
                      description={`Size: ${board.size} | ${board.location || 'No location'}`}
                      badge={{
                        text: board.status || 'UNKNOWN',
                        color: board.status?.toUpperCase() === 'ACTIVE' ? 'green' : 'gray'
                      }}
                      rightText={board.coordinates ? '📍' : ''}
                      onClick={() => router.push(`/field-agents/boards/${board.id}`)}
                    />
                  ))
                ) : (
                  filteredPlacements.map((placement) => (
                    <MobileListItem
                      key={placement.id}
                      title={`Board: ${placement.board?.title || 'Unknown'}`}
                      subtitle={`Agent: ${placement.agent?.name || 'Unassigned'}`}
                      description={`${new Date(placement.placementDate).toLocaleDateString()} | ${placement.location || 'No location'}`}
                      badge={{
                        text: placement.status || 'UNKNOWN',
                        color: placement.status?.toUpperCase() === 'VERIFIED' ? 'green' : 
                               placement.status?.toUpperCase() === 'PENDING' ? 'yellow' : 'gray'
                      }}
                      rightText={placement.coordinates ? '📍' : ''}
                      onClick={() => router.push(`/field-agents/boards/placements/${placement.id}`)}
                    />
                  ))
                )}
              </MobileList>
            )}

            {((activeTab === 'boards' && filteredBoards.length === 0) || 
              (activeTab === 'placements' && filteredPlacements.length === 0)) && !isLoading && (
              <MobileCard className="text-center py-8">
                <div className="text-gray-500">
                  No {activeTab} found matching your criteria.
                </div>
              </MobileCard>
            )}
          </div>

          {/* Floating Action Button */}
          <MobileFloatingActionButton
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-6 h-6" />}
          />
        </MobileLayout>
      </ErrorBoundary>
    );
  }

  // Desktop version
  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Board Management</h1>
              <p className="mt-2 text-gray-600">
                Manage advertising boards and track their placements
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'boards' ? 'Add Board' : 'Add Placement'}
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('boards')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'boards'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Boards
                </div>
              </button>
              <button
                onClick={() => setActiveTab('placements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'placements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Placements
                </div>
              </button>
            </nav>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Boards</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBoards}</p>
                </div>
                <Layers className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Boards</p>
                  <p className="text-2xl font-bold text-green-600">{activeBoards}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Placements</p>
                  <p className="text-2xl font-bold text-purple-600">{totalPlacements}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified Placements</p>
                  <p className="text-2xl font-bold text-orange-600">{verifiedPlacements}</p>
                </div>
                <Camera className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  {activeTab === 'boards' ? (
                    <>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </>
                  ) : (
                    <>
                      <option value="PLACED">Placed</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="REMOVED">Removed</option>
                    </>
                  )}
                </select>
                {activeTab === 'placements' && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="BILLBOARD">Billboard</option>
                    <option value="POSTER">Poster</option>
                    <option value="BANNER">Banner</option>
                    <option value="DIGITAL">Digital</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Content Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
              </div>
            ) : activeTab === 'boards' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Board
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dimensions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBoards.map((board) => (
                      <tr key={board.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Layers className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {board.name || board.boardNumber || 'Unnamed Board'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {board.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{board.type || board.size || 'Standard'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {board.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(board.status || 'inactive')}`}>
                            {getStatusIcon(board.status || 'inactive')}
                            {(board.status || 'inactive').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {board.dimensions ? `${board.dimensions.width} × ${board.dimensions.height}` : board.size || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {board.createdAt ? new Date(board.createdAt).toLocaleDateString() : 
                             board.installationDate ? new Date(board.installationDate).toLocaleDateString() : 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/field-agents/boards/${board.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/field-agents/boards/${board.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/field-agents/boards/${board.id}/analytics`)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredBoards.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No boards found matching your criteria.
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Board
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placement Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coverage
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlacements.map((placement) => (
                      <tr key={placement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Board {placement.boardId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                Agent {placement.fieldAgentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {placement.placementDate ? new Date(placement.placementDate).toLocaleDateString() : 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(placement.status || 'placed')}`}>
                            {getStatusIcon(placement.status || 'placed')}
                            {(placement.status || 'placed').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {placement.coordinates ? 
                              `${placement.coordinates.latitude.toFixed(4)}, ${placement.coordinates.longitude.toFixed(4)}` : 
                              'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {placement.coveragePercentage ? `${placement.coveragePercentage}%` : 'Not analyzed'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/field-agents/boards/placements/${placement.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {placement.status?.toUpperCase() === 'PLACED' && (
                              <button
                                onClick={() => handleVerifyPlacement(placement.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Verify Placement"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/field-agents/boards/placements/${placement.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredPlacements.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No board placements found matching your criteria.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}