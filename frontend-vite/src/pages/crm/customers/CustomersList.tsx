import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Edit } from 'lucide-react'
import TransactionList from '../../../components/transactions/TransactionList'
import { crmService } from '../../../services/crm.service'
import { formatDate } from '../../../utils/format'

export default function CustomersList() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const response = await crmService.getCustomers()
      setCustomers(response.data || [])
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'customer_code',
      label: 'Customer Code',
      sortable: true,
      render: (value: string, row: any) => (
        <button
          onClick={() => navigate(`/crm/customers/${row.id}`)}
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          {value}
        </button>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer Name',
      sortable: true
    },
    {
      key: 'customer_type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      sortable: true
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          suspended: 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[value] || colors.active}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/crm/customers/${row.id}`)}
            className="p-1 text-gray-600 hover:text-primary-600"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/crm/customers/${row.id}/edit`)}
            className="p-1 text-gray-600 hover:text-primary-600"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <TransactionList
      title="Customers"
      columns={columns}
      data={customers}
      loading={loading}
      onRefresh={loadCustomers}
      onExport={() => console.log('Export customers')}
      createPath="/crm/customers/create"
      createLabel="Create Customer"
    />
  )
}
