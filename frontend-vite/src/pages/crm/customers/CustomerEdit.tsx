import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { crmService } from '../../../services/crm.service'

export default function CustomerEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  const fields = [
    {
      name: 'customer_code',
      label: 'Customer Code',
      type: 'text' as const,
      required: true,
      disabled: true
    },
    {
      name: 'customer_name',
      label: 'Customer Name',
      type: 'text' as const,
      required: true
    },
    {
      name: 'customer_type',
      label: 'Customer Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'retailer', label: 'Retailer' },
        { value: 'wholesaler', label: 'Wholesaler' },
        { value: 'distributor', label: 'Distributor' },
        { value: 'spaza_shop', label: 'Spaza Shop' },
        { value: 'tavern', label: 'Tavern' }
      ]
    },
    {
      name: 'contact_person',
      label: 'Contact Person',
      type: 'text' as const,
      required: true
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text' as const,
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text' as const
    },
    {
      name: 'physical_address',
      label: 'Physical Address',
      type: 'textarea' as const,
      required: true
    },
    {
      name: 'gps_latitude',
      label: 'GPS Latitude',
      type: 'number' as const
    },
    {
      name: 'gps_longitude',
      label: 'GPS Longitude',
      type: 'number' as const
    },
    {
      name: 'credit_limit',
      label: 'Credit Limit (R)',
      type: 'number' as const
    },
    {
      name: 'payment_terms',
      label: 'Payment Terms',
      type: 'select' as const,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit_7', label: 'Credit 7 Days' },
        { value: 'credit_30', label: 'Credit 30 Days' },
        { value: 'credit_60', label: 'Credit 60 Days' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await crmService.updateCustomer(Number(id), data)
      navigate(`/crm/customers/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update customer')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!customer) {
    return <div className="flex items-center justify-center h-64">Customer not found</div>
  }

  return (
    <TransactionForm
      title={`Edit Customer ${customer.customer_code}`}
      fields={fields}
      initialData={customer}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/crm/customers/${id}`)}
      submitLabel="Update Customer"
    />
  )
}
