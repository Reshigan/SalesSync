import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../components/transactions/TransactionForm'
import { ordersService } from '../../services/orders.service'
import { customersService } from '../../services/customers.service'

export default function OrderCreatePage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const customersRes = await customersService.getCustomers()
      setCustomers(customersRes.customers || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const fields = [
    {
      name: 'order_date',
      label: 'Order Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'customer_id',
      label: 'Customer',
      type: 'select' as const,
      required: true,
      options: customers.map((c: any) => ({
        value: c.id,
        label: c.name
      }))
    },
    {
      name: 'delivery_date',
      label: 'Delivery Date',
      type: 'date' as const
    },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit' },
        { value: 'mobile_money', label: 'Mobile Money' }
      ]
    },
    {
      name: 'payment_status',
      label: 'Payment Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' }
      ]
    },
    {
      name: 'status',
      label: 'Order Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add order notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await ordersService.createOrder(data)
      navigate('/orders')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create order')
    }
  }

  return (
    <TransactionForm
      title="Create Order"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/orders')}
      submitLabel="Create Order"
    />
  )
}
