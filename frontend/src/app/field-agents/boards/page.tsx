'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { BoardInstallationForm } from '@/components/boards/BoardInstallationForm'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { fieldAgentsService, Board } from '@/services/field-agents.service'
import toast from 'react-hot-toast'
import { 
  LayoutGrid,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  TrendingUp,
  RefreshCw,
  Filter,
  Map,
  BarChart3,
  Download,
  Eye
} from 'lucide-react'

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterBrand, setFilterBrand] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'analytics'>('list')

  // Mock agent brands
  const agentBrands = [
    { id: '1', name: 'Safaricom' },
    { id: '2', name: 'Airtel' },
    { id: '3', name: 'Coca-Cola' }
  ]

  // Stats
  const stats = {
    total: boards.length,
    active: boards.filter(b => b.status === 'active').length,
    avgShareOfVoice: boards.filter(b => b.competitiveAnalysis).length > 0
      ? boards
          .filter(b => b.competitiveAnalysis)
          .reduce((sum, b) => sum + (b.competitiveAnalysis?.shareOfVoice || 0), 0) /
        boards.filter(b => b.competitiveAnalysis).length
      : 0,
    needsMaintenance: boards.filter(b => b.maintenanceRequired).length
  }

  useEffect(() => {
    loadBoards()
  }, [filterStatus, filterBrand])

  const loadBoards = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterStatus !== 'all') filters.status = filterStatus
      if (filterBrand !== 'all') filters.brandId = filterBrand
      if (searchTerm) filters.search = searchTerm
      
      const response = await fieldAgentsService.getBoards(filters)
      setBoards(response.boards || [])
    } catch (error: any) {
      console.error('Error loading boards:', error)
      toast.error(error.message || 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadBoards()
  }

  const handleCreateBoard = async (data: Board, proofPhotoFile?: File, wideAnglePhotoFile?: File) => {
    try {
      // In production, upload photos first, then create board with URLs
      const createdBoard = await fieldAgentsService.createBoard(data)
      
      if (proofPhotoFile && createdBoard.id) {
        await fieldAgentsService.uploadBoardPhoto(createdBoard.id, 'proof', proofPhotoFile)
      }
      if (wideAnglePhotoFile && createdBoard.id) {
        await fieldAgentsService.uploadBoardPhoto(createdBoard.id, 'wide_angle', wideAnglePhotoFile)
      }
      
      toast.success('Board installed successfully')
      setShowCreateModal(false)
      loadBoards()
    } catch (error: any) {
      console.error('Error creating board:', error)
      throw error
    }
  }

  const handleEditBoard = async (data: Board, proofPhotoFile?: File, wideAnglePhotoFile?: File) => {
    if (!editingBoard?.id) return
    
    try {
      await fieldAgentsService.updateBoard(editingBoard.id, data)
      
      if (proofPhotoFile) {
        await fieldAgentsService.uploadBoardPhoto(editingBoard.id, 'proof', proofPhotoFile)
      }
      if (wideAnglePhotoFile) {
        await fieldAgentsService.uploadBoardPhoto(editingBoard.id, 'wide_angle', wideAnglePhotoFile)
      }
      
      toast.success('Board updated successfully')
      setShowEditModal(false)
      setEditingBoard(null)
      loadBoards()
    } catch (error: any) {
      console.error('Error updating board:', error)
      throw error
    }
  }

  const handleDeleteBoard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return

    try {
      await fieldAgentsService.deleteBoard(id)
      toast.success('Board deleted successfully')
      loadBoards()
    } catch (error: any) {
      console.error('Error deleting board:', error)
      toast.error(error.message || 'Failed to delete board')
    }
  }

  const openEditModal = (board: Board) => {
    setEditingBoard(board)
    setShowEditModal(true)
  }

  const getStatusBadge = (status: Board['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      removed: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotional Boards</h1>
            <p className="text-gray-600">Manage board installations and track competitive presence</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : viewMode === 'map' ? 'analytics' : 'list')}
            >
              {viewMode === 'list' ? <Map className="w-4 h-4 mr-2" /> : 
               viewMode === 'map' ? <BarChart3 className="w-4 h-4 mr-2" /> :
               <LayoutGrid className="w-4 h-4 mr-2" />}
              {viewMode === 'list' ? 'Map View' : viewMode === 'map' ? 'Analytics' : 'List View'}
            </Button>
            <Button variant="outline" onClick={loadBoards}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Install Board
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Boards</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <LayoutGrid className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Boards</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Share of Voice</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgShareOfVoice.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.needsMaintenance}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Brands</option>
              {agentBrands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="removed">Removed</option>
            </select>

            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Board</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Share of Voice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                          Loading boards...
                        </div>
                      </td>
                    </tr>
                  ) : boards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <LayoutGrid className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-lg font-medium">No boards found</p>
                          <p className="text-sm">Install your first promotional board</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    boards.map((board) => (
                      <tr key={board.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                              <LayoutGrid className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{board.boardNumber}</p>
                              <p className="text-xs text-gray-500">{board.size}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{board.brandName || board.brandId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {board.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {new Date(board.installationDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {board.competitiveAnalysis ? (
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                {board.competitiveAnalysis.shareOfVoice}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not analyzed</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(board.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => {}}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditModal(board)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => board.id && handleDeleteBoard(board.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map View Placeholder */}
        {viewMode === 'map' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map View</h3>
            <p className="text-gray-600 mb-4">Interactive map showing all board locations with GPS coordinates</p>
            <Button variant="outline">Load Map</Button>
          </div>
        )}

        {/* Analytics View Placeholder */}
        {viewMode === 'analytics' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600 mb-4">Detailed competitive analysis and performance metrics</p>
            <Button variant="outline">View Analytics</Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        title="Install Promotional Board"
        onClose={() => setShowCreateModal(false)}
        size="xl"
      >
        <BoardInstallationForm
          onSubmit={handleCreateBoard}
          onCancel={() => setShowCreateModal(false)}
          agentBrands={agentBrands}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Board"
        onClose={() => {
          setShowEditModal(false)
          setEditingBoard(null)
        }}
        size="xl"
      >
        {editingBoard && (
          <BoardInstallationForm
            initialData={editingBoard}
            onSubmit={handleEditBoard}
            onCancel={() => {
              setShowEditModal(false)
              setEditingBoard(null)
            }}
            agentBrands={agentBrands}
          />
        )}
      </FormModal>
    </DashboardLayout>
  )
}
