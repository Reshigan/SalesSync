import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { salesService } from '../../../services/sales.service'

export default function SalesOrderCreate() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [salesReps, setSalesReps] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [customersRes, salesRepsRes] = await Promise.all([
        salesService.getCustomers(),
        salesService.getSalesReps()
      ])
      setCustomers(customersRes.data || [])
      setSalesReps(salesRepsRes.data || [])
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
        value: c.id.toString(),
        label: c.name
      }))
    },
    {
      name: 'sales_rep_id',
      label: 'Sales Rep',
      type: 'select' as const,
      required: true,
      options: salesReps.map((s: any) => ({
        value: s.id.toString(),
        label: s.name
      }))
    },
    {
      name: 'delivery_date',
      label: 'Delivery Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'payment_terms',
      label: 'Payment Terms',
      type: 'select' as const,
      required: true,
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
      placeholder: 'Add order notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await salesService.createOrder(data)
      navigate('/sales/orders')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create order')
    }
  }

  return (
    <TransactionForm
      title="Create Sales Order"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sales/orders')}
      submitLabel="Create Order"
    />
  )
}
