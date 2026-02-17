import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../components/transactions/TransactionForm'
import { customersService } from '../../services/customers.service'

export default function CustomerCreatePage() {
  const navigate = useNavigate()

  const fields = [
    {
      name: 'code',
      label: 'Customer Code',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., CUST001',
      step: 'Identity',
      helpText: 'Unique identifier for this customer'
    },
    {
      name: 'name',
      label: 'Customer Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., ABC Store',
      step: 'Identity'
    },
    {
      name: 'type',
      label: 'Customer Type',
      type: 'select' as const,
      required: true,
      step: 'Identity',
      options: [
        { value: 'retail', label: 'Retail' },
        { value: 'wholesale', label: 'Wholesale' },
        { value: 'distributor', label: 'Distributor' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      step: 'Identity',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., +27 12 345 6789',
      step: 'Contact'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text' as const,
      placeholder: 'e.g., contact@abcstore.co.za',
      step: 'Contact'
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Street address, suburb, city',
      step: 'Location'
    },
    {
      name: 'city',
      label: 'City',
      type: 'text' as const,
      placeholder: 'e.g., Johannesburg',
      step: 'Location'
    },
    {
      name: 'region',
      label: 'Region',
      type: 'text' as const,
      placeholder: 'e.g., Gauteng',
      step: 'Location'
    },
    {
      name: 'credit_limit',
      label: 'Credit Limit',
      type: 'number' as const,
      placeholder: 'e.g., 50000',
      step: 'Billing',
      helpText: 'Maximum credit amount allowed'
    },
    {
      name: 'payment_terms',
      label: 'Payment Terms',
      type: 'select' as const,
      step: 'Billing',
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit_7', label: 'Credit 7 Days' },
        { value: 'credit_30', label: 'Credit 30 Days' },
        { value: 'credit_60', label: 'Credit 60 Days' }
      ]
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      const result = await customersService.createCustomer(data)
      navigate('/customers')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create customer')
    }
  }

  return (
    <TransactionForm
      title="Create Customer"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/customers')}
      submitLabel="Create Customer"
    />
  )
}
