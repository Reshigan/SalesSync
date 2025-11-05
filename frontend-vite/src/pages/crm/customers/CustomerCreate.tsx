import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { crmService } from '../../../services/crm.service'

export default function CustomerCreate() {
  const navigate = useNavigate()

  const fields = [
    {
      name: 'customer_code',
      label: 'Customer Code',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., CUST001'
    },
    {
      name: 'customer_name',
      label: 'Customer Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., ABC Store'
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
      required: true,
      placeholder: 'e.g., +27 12 345 6789'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text' as const,
      placeholder: 'e.g., contact@abcstore.co.za'
    },
    {
      name: 'physical_address',
      label: 'Physical Address',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Street address, suburb, city'
    },
    {
      name: 'gps_latitude',
      label: 'GPS Latitude',
      type: 'number' as const,
      placeholder: 'e.g., -26.2041'
    },
    {
      name: 'gps_longitude',
      label: 'GPS Longitude',
      type: 'number' as const,
      placeholder: 'e.g., 28.0473'
    },
    {
      name: 'credit_limit',
      label: 'Credit Limit (R)',
      type: 'number' as const,
      placeholder: 'e.g., 50000'
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
      type: 'textarea' as const,
      placeholder: 'Add customer notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await crmService.createCustomer(data)
      navigate('/crm/customers')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create customer')
    }
  }

  return (
    <TransactionForm
      title="Create Customer"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/crm/customers')}
      submitLabel="Create Customer"
    />
  )
}
