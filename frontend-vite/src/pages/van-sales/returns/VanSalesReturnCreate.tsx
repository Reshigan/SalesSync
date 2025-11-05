import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { vanSalesService } from '../../../services/van-sales.service'

export default function VanSalesReturnCreate() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await vanSalesService.getOrders()
      setOrders(response.data || [])
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
      label: 'Original Order',
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
        { value: 'damaged', label: 'Damaged Product' },
        { value: 'expired', label: 'Expired Product' },
        { value: 'wrong_item', label: 'Wrong Item' },
        { value: 'customer_request', label: 'Customer Request' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add any additional details...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await vanSalesService.createReturn(data)
      navigate('/van-sales/returns')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create return')
    }
  }

  return (
    <TransactionForm
      title="Create Van Sales Return"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/van-sales/returns')}
      submitLabel="Create Return"
    />
  )
}
