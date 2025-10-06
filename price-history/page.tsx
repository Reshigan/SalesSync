'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SimpleTable } from '@/components/ui/SimpleTable'

interface PriceHistory {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function PriceHistoryPage() {
  const [data, setData] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PriceHistory | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Mock data for development
  const mockData: PriceHistory[] = [
    {
      id: '1',
      name: 'Sample Price Histor',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/price-history')
      // const result = await response.json()
      
      // Using mock data for now
      setTimeout(() => {
        setData(mockData)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching data:', error)
      setData(mockData)
      setLoading(false)
    }
  }

  const handleCreate = async (itemData: Partial<PriceHistory>) => {
    try {
      // TODO: Replace with actual API call
      console.log('Creating item:', itemData)
      setShowCreateModal(false)
      fetchData()
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleEdit = async (itemData: Partial<PriceHistory>) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating item:', itemData)
      setShowEditModal(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        // TODO: Replace with actual API call
        console.log('Deleting item:', itemId)
        fetchData()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (item: PriceHistory) => (
        <span className="font-medium">{item.name}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: PriceHistory) => (
        <Badge variant={item.status === 'active' ? 'success' : 'error'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: PriceHistory) => (
        <span className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: PriceHistory) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItem(item)
              setShowEditModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price History</h1>
          <p className="text-gray-600">Product price history</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Price Histor
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search price history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <SimpleTable
          data={filteredData}
          columns={columns}
          emptyMessage="No price history found"
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Price Histor"
      >
        <div className="p-4">
          <p>Create form for price history will be implemented here.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedItem(null)
        }}
        title="Edit Price Histor"
      >
        <div className="p-4">
          <p>Edit form for price history will be implemented here.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowEditModal(false)
              setSelectedItem(null)
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowEditModal(false)
              setSelectedItem(null)
            }}>
              Update
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}