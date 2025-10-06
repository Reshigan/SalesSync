'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { 
  Megaphone, 
  MapPin, 
  Camera, 
  Users, 
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Star
} from 'lucide-react'

interface PromoterActivity {
  id: string
  campaignName: string
  storeName: string
  location: string
  activityType: string
  startTime: string
  endTime: string
  samplesDistributed: number
  contactsMade: number
  surveysCompleted: number
  status: 'pending' | 'verified' | 'approved' | 'rejected'
  photos: number
  verificationScore?: number
}

export default function PromoterActivitiesPage() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewActivityModal, setShowNewActivityModal] = useState(false)

  // Mock data
  const activities: PromoterActivity[] = [
    {
      id: '1',
      campaignName: 'Coca Cola Summer Sampling',
      storeName: 'SuperMart Downtown',
      location: 'Lagos, Nigeria',
      activityType: 'sampling',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      samplesDistributed: 156,
      contactsMade: 89,
      surveysCompleted: 34,
      status: 'approved',
      photos: 8,
      verificationScore: 95,
    },
    {
      id: '2',
      campaignName: 'Pepsi Brand Activation',
      storeName: 'MegaMall Central',
      location: 'Abuja, Nigeria',
      activityType: 'activation',
      startTime: '10:00 AM',
      endTime: '06:00 PM',
      samplesDistributed: 203,
      contactsMade: 127,
      surveysCompleted: 45,
      status: 'pending',
      photos: 12,
      verificationScore: 88,
    },
    {
      id: '3',
      campaignName: 'Sprite Display Setup',
      storeName: 'City Plaza Store',
      location: 'Port Harcourt, Nigeria',
      activityType: 'display_setup',
      startTime: '08:30 AM',
      endTime: '04:30 PM',
      samplesDistributed: 0,
      contactsMade: 15,
      surveysCompleted: 8,
      status: 'verified',
      photos: 6,
      verificationScore: 92,
    },
  ]

  const todayStats = {
    totalActivities: 8,
    samplesDistributed: 456,
    contactsMade: 234,
    surveysCompleted: 89,
    pendingApproval: 3,
    avgVerificationScore: 91.5,
  }

  const filteredActivities = activities.filter(activity => {
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus
    const matchesSearch = activity.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.storeName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'verified':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'sampling':
        return <Package className="w-4 h-4" />
      case 'activation':
        return <Megaphone className="w-4 h-4" />
      case 'display_setup':
        return <Eye className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promoter Activities</h1>
            <p className="text-gray-600">Track and manage promotional activities</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              Bulk Photo Upload
            </Button>
            <Button onClick={() => setShowNewActivityModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Activity
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Activities</p>
                <p className="text-2xl font-bold">{todayStats.totalActivities}</p>
              </div>
              <Megaphone className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Samples Distributed</p>
                <p className="text-2xl font-bold">{todayStats.samplesDistributed}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contacts Made</p>
                <p className="text-2xl font-bold">{todayStats.contactsMade}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Surveys Completed</p>
                <p className="text-2xl font-bold">{todayStats.surveysCompleted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold">{todayStats.pendingApproval}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{todayStats.avgVerificationScore}%</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </Card>

        {/* Activities Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Recent Activities</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'Campaign', 
                  accessor: 'campaignName',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.campaignName}</p>
                      <p className="text-sm text-gray-500">{row.storeName}</p>
                    </div>
                  )
                },
                { 
                  header: 'Type', 
                  accessor: 'activityType',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-2">
                      {getActivityTypeIcon(value)}
                      <span className="capitalize">{value.replace('_', ' ')}</span>
                    </div>
                  )
                },
                { 
                  header: 'Location', 
                  accessor: 'location',
                  cell: ({ value }) => (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Time', 
                  accessor: 'startTime',
                  cell: ({ row }) => (
                    <div className="text-sm">
                      <p>{row.startTime} - {row.endTime}</p>
                    </div>
                  )
                },
                { 
                  header: 'Samples', 
                  accessor: 'samplesDistributed',
                  cell: ({ value }) => (
                    <div className="text-center">
                      <span className="font-medium text-green-600">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Contacts', 
                  accessor: 'contactsMade',
                  cell: ({ value }) => (
                    <div className="text-center">
                      <span className="font-medium text-blue-600">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Surveys', 
                  accessor: 'surveysCompleted',
                  cell: ({ value }) => (
                    <div className="text-center">
                      <span className="font-medium text-purple-600">{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Photos', 
                  accessor: 'photos',
                  cell: ({ value }) => (
                    <div className="flex items-center justify-center space-x-1">
                      <Camera className="w-4 h-4 text-gray-400" />
                      <span>{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Score', 
                  accessor: 'verificationScore',
                  cell: ({ value }) => value ? (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{value}%</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                },
                { 
                  header: 'Status', 
                  accessor: 'status',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredActivities}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <Megaphone className="w-12 h-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-lg font-semibold mb-2">Start New Activity</h3>
              <p className="text-gray-600 mb-4">Begin a new promotional activity</p>
              <Button fullWidth>Start Activity</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
              <p className="text-gray-600 mb-4">Add photos to existing activities</p>
              <Button variant="outline" fullWidth>Upload Photos</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Complete Survey</h3>
              <p className="text-gray-600 mb-4">Fill out activity surveys</p>
              <Button variant="outline" fullWidth>View Surveys</Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}