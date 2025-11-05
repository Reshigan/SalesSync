import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { salesService } from '../../../services/sales.service'

export default function SalesReturnCreate() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await salesService.getOrders()
      const fulfilledOrders = (response.data || []).filter((o: any) => o.status === 'fulfilled')
      setOrders(fulfilledOrders)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const fields = [
    {
      name: 'return_date',
      label: 'Return Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'order_id',
      label: 'Order',
      type: 'select' as const,
      required: true,
      options: orders.map((o: any) => ({
        value: o.id.toString(),
        label: `${o.order_number} - ${o.customer_name}`
      }))
    },
    {
      name: 'reason',
      label: 'Return Reason',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'defective', label: 'Defective Product' },
        { value: 'wrong_item', label: 'Wrong Item' },
        { value: 'damaged', label: 'Damaged in Transit' },
        { value: 'not_needed', label: 'No Longer Needed' },
        { value: 'quality', label: 'Quality Issues' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Provide details about the return...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await salesService.createReturn(data)
      navigate('/sales/returns')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create return')
    }
  }

  return (
    <TransactionForm
      title="Create Sales Return"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sales/returns')}
      submitLabel="Create Return"
    />
  )
}
