import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { crmService } from '../../../services/crm.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomer()
  }, [id])

  const loadCustomer = async () => {
    setLoading(true)
    try {
      const response = await crmService.getCustomer(Number(id))
      setCustomer(response.data)
    } catch (error) {
      console.error('Failed to load customer:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!customer) {
    return <div className="flex items-center justify-center h-64">Customer not found</div>
  }

  const fields = [
    { label: 'Customer Code', value: customer.customer_code },
    { label: 'Customer Name', value: customer.customer_name },
    { label: 'Customer Type', value: customer.customer_type },
    { label: 'Contact Person', value: customer.contact_person },
    { label: 'Phone', value: customer.phone },
    { label: 'Email', value: customer.email || '-' },
    { label: 'Physical Address', value: customer.physical_address },
    { label: 'GPS Coordinates', value: customer.gps_latitude && customer.gps_longitude ? `${customer.gps_latitude}, ${customer.gps_longitude}` : '-' },
    { label: 'Credit Limit', value: customer.credit_limit ? formatCurrency(customer.credit_limit) : '-' },
    { label: 'Current Balance', value: formatCurrency(customer.current_balance || 0) },
    { label: 'Payment Terms', value: customer.payment_terms || '-' },
    { label: 'Status', value: customer.status },
    { label: 'Notes', value: customer.notes },
    { label: 'Created By', value: customer.created_by },
    { label: 'Created At', value: formatDate(customer.created_at) }
  ]

  const statusColor = {
    active: 'green',
    inactive: 'gray',
    suspended: 'red'
  }[customer.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`Customer ${customer.customer_code}`}
      fields={fields}
      auditTrail={customer.audit_trail || []}
      editPath={`/crm/customers/${id}/edit`}
      backPath="/crm/customers"
      status={customer.status}
      statusColor={statusColor}
    />
  )
}
