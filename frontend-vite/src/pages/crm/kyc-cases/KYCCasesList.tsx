import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import TransactionList from '../../../components/transactions/TransactionList'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function KYCCasesList() {
  const navigate = useNavigate()
  const [kycCases, setKYCCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKYCCases()
  }, [])

  const loadKYCCases = async () => {
    setLoading(true)
    try {
      const response = await crmService.getKYCCases()
      setKYCCases(response.data || [])
    } catch (error) {
      console.error('Failed to load KYC cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'case_number',
      label: 'Case #',
      sortable: true,
      render: (value: string, row: any) => (
        <button
          onClick={() => navigate(`/crm/kyc-cases/${row.id}`)}
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          {value}
        </button>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true
    },
    {
      key: 'case_type',
      label: 'Case Type',
      sortable: true
    },
    {
      key: 'created_date',
      label: 'Created Date',
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      sortable: true
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          low: 'bg-gray-100 text-gray-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[value] || colors.medium}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          open: 'bg-blue-100 text-blue-800',
          in_progress: 'bg-yellow-100 text-yellow-800',
          pending_docs: 'bg-orange-100 text-orange-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
          closed: 'bg-gray-100 text-gray-800'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[value] || colors.open}`}>
            {value.replace('_', ' ')}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <button
          onClick={() => navigate(`/crm/kyc-cases/${row.id}`)}
          className="p-1 text-gray-600 hover:text-primary-600"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ]

  return (
    <TransactionList
      title="KYC Cases"
      columns={columns}
      data={kycCases}
      loading={loading}
      onRefresh={loadKYCCases}
      onExport={() => console.log('Export KYC cases')}
      createPath="/crm/kyc-cases/create"
      createLabel="Create KYC Case"
    />
  )
}
