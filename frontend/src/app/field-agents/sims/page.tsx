'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Smartphone, 
  MapPin, 
  User, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  QrCode,
  FileText,
  TrendingUp,
  Users,
  Package
} from 'lucide-react'

interface SimDistribution {
  id: string
  customerName: string
  customerPhone: string
  customerType: 'new' | 'existing'
  simNumber: string
  activationCode: string
  location: string
  distributionDate: string
  distributionTime: string
  kycStatus: 'pending' | 'verified' | 'rejected'
  activationStatus: 'pending' | 'activated' | 'failed'
  agentId: string
  commission: number
}

export default function SimDistributionPage() {
    const { formatCurrency } = useCurrency();
const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewDistributionModal, setShowNewDistributionModal] = useState(false)
  const [scanMode, setScanMode] = useState(false)

  // Mock data
  const distributions: SimDistribution[] = [
    {
      id: '1',
      customerName: 'John Adebayo',
      customerPhone: '+234-801-234-5678',
      customerType: 'new',
      simNumber: '234-80-1234-5678',
      activationCode: 'ACT123456',
      location: 'Lagos, Nigeria',
      distributionDate: '2024-10-01',
      distributionTime: '10:30 AM',
      kycStatus: 'verified',
      activationStatus: 'activated',
      agentId: 'AGT-001',
      commission: 500,
    },
    {
      id: '2',
      customerName: 'Sarah Okafor',
      customerPhone: '+234-802-345-6789',
      customerType: 'new',
      simNumber: '234-80-2345-6789',
      activationCode: 'ACT234567',
      location: 'Abuja, Nigeria',
      distributionDate: '2024-10-01',
      distributionTime: '02:15 PM',
      kycStatus: 'pending',
      activationStatus: 'pending',
      agentId: 'AGT-001',
      commission: 500,
    },
    {
      id: '3',
      customerName: 'Mike Johnson',
      customerPhone: '+234-803-456-7890',
      customerType: 'existing',
      simNumber: '234-80-3456-7890',
      activationCode: 'ACT345678',
      location: 'Port Harcourt, Nigeria',
      distributionDate: '2024-10-01',
      distributionTime: '04:45 PM',
      kycStatus: 'verified',
      activationStatus: 'activated',
      agentId: 'AGT-001',
      commission: 300,
    },
  ]

  const todayStats = {
    totalDistributions: 15,
    newCustomers: 12,
    existingCustomers: 3,
    pendingActivations: 5,
    totalCommission: 6800,
    activationRate: 73.3,
  }

  const filteredDistributions = distributions.filter(distribution => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && (distribution.kycStatus === 'pending' || distribution.activationStatus === 'pending')) ||
      (filterStatus === 'activated' && distribution.activationStatus === 'activated') ||
      (filterStatus === 'new_customer' && distribution.customerType === 'new')
    
    const matchesSearch = distribution.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distribution.customerPhone.includes(searchTerm) ||
                         distribution.simNumber.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivationStatusColor = (status: string) => {
    switch (status) {
      case 'activated':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerTypeIcon = (type: string) => {
    return type === 'new' ? (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <User className="w-3 h-3 mr-1" />
        New
      </div>
    ) : (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Users className="w-3 h-3 mr-1" />
        Existing
      </div>
    )
  }

  return (<ErrorBoundary>

    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SIM Distribution</h1>
            <p className="text-gray-600">Manage SIM card distribution and customer onboarding</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setScanMode(!scanMode)}>
              <QrCode className="w-4 h-4 mr-2" />
              {scanMode ? 'Manual Entry' : 'Scan Mode'}
            </Button>
            <Button onClick={() => setShowNewDistributionModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Distribution
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Distributions</p>
                <p className="text-2xl font-bold">{todayStats.totalDistributions}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">{todayStats.newCustomers}</p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Existing Customers</p>
                <p className="text-2xl font-bold">{todayStats.existingCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Activations</p>
                <p className="text-2xl font-bold">{todayStats.pendingActivations}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold">₦{todayStats.totalCommission.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activation Rate</p>
                <p className="text-2xl font-bold">{todayStats.activationRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
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
                  <option value="all">All Distributions</option>
                  <option value="pending">Pending</option>
                  <option value="activated">Activated</option>
                  <option value="new_customer">New Customers</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or SIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </Card>

        {/* Quick SIM Distribution */}
        {scanMode && (
          <Card className="border-2 border-dashed border-primary-300 bg-primary-50">
            <Card.Content className="p-6">
              <div className="text-center">
                <QrCode className="w-12 h-12 mx-auto mb-4 text-primary-600" />
                <h3 className="text-lg font-semibold mb-2">Quick SIM Distribution</h3>
                <p className="text-gray-600 mb-4">Scan SIM card or enter details manually</p>
                <div className="max-w-md mx-auto space-y-3">
                  <Input placeholder="Scan SIM barcode or enter SIM number" />
                  <Input placeholder="Customer phone number" />
                  <Button fullWidth>Start Distribution Process</Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Distributions Table */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Recent SIM Distributions</h3>
          </Card.Header>
          <Card.Content>
            <DataTable
              columns={[
                { 
                  header: 'Customer', 
                  accessor: 'customerName',
                  cell: ({ row }) => (
                    <div>
                      <p className="font-medium text-gray-900">{row.customerName}</p>
                      <p className="text-sm text-gray-500">{row.customerPhone}</p>
                    </div>
                  )
                },
                { 
                  header: 'Type', 
                  accessor: 'customerType',
                  cell: ({ value }) => getCustomerTypeIcon(value)
                },
                { 
                  header: 'SIM Number', 
                  accessor: 'simNumber',
                  cell: ({ value }) => (
                    <div className="font-mono text-sm">
                      {value}
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
                  header: 'Distribution Time', 
                  accessor: 'distributionTime',
                  cell: ({ row }) => (
                    <div className="text-sm">
                      <p>{row.distributionDate}</p>
                      <p className="text-gray-500">{row.distributionTime}</p>
                    </div>
                  )
                },
                { 
                  header: 'KYC Status', 
                  accessor: 'kycStatus',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getKycStatusColor(value)}`}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )
                },
                { 
                  header: 'Activation', 
                  accessor: 'activationStatus',
                  cell: ({ value }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivationStatusColor(value)}`}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )
                },
                { 
                  header: 'Commission', 
                  accessor: 'commission',
                  cell: ({ value }) => (
                    <div className="text-center">
                      <span className="font-medium text-green-600">₦{value}</span>
                    </div>
                  )
                },
                { 
                  header: 'Actions', 
                  accessor: 'id',
                  cell: ({ row }) => (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4" />
                      </Button>
                      {row.kycStatus === 'pending' && (
                        <Button size="sm" variant="outline">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={filteredDistributions}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <Smartphone className="w-12 h-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-lg font-semibold mb-2">New Distribution</h3>
              <p className="text-gray-600 mb-4">Distribute new SIM card</p>
              <Button fullWidth>Start Distribution</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
              <p className="text-gray-600 mb-4">Verify customer documents</p>
              <Button variant="outline" fullWidth>Verify KYC</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Activation Status</h3>
              <p className="text-gray-600 mb-4">Check activation status</p>
              <Button variant="outline" fullWidth>Check Status</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2">Commission Report</h3>
              <p className="text-gray-600 mb-4">View earnings</p>
              <Button variant="outline" fullWidth>View Report</Button>
            </div>
          </Card>
        </div>

        {/* Pending Actions Alert */}
        <Card className="border-l-4 border-l-yellow-500">
          <Card.Content className="p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-6 h-6 text-yellow-500 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Pending Actions Required</h4>
                <p className="text-gray-600 mt-1">
                  5 SIM activations are pending. 3 KYC documents need verification. 
                  Follow up with customers to complete the process.
                </p>
                <div className="mt-3 flex space-x-3">
                  <Button size="sm" variant="outline">View Pending KYC</Button>
                  <Button size="sm" variant="outline">Check Activations</Button>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  
</ErrorBoundary>)
}