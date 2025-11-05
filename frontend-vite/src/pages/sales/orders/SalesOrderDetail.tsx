import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function SalesOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const response = await salesService.getOrder(Number(id))
      setOrder(response.data)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!order) {
    return <div className="flex items-center justify-center h-64">Order not found</div>
  }

  const fields = [
    { label: 'Order Number', value: order.order_number },
    { label: 'Order Date', value: formatDate(order.order_date) },
    { label: 'Customer', value: order.customer_name },
    { label: 'Sales Rep', value: order.sales_rep },
    { label: 'Order Amount', value: formatCurrency(order.order_amount) },
    { label: 'Delivery Date', value: formatDate(order.delivery_date) },
    { label: 'Payment Terms', value: order.payment_terms },
    { label: 'Status', value: order.status },
    { label: 'Notes', value: order.notes },
    { label: 'Created By', value: order.created_by },
    { label: 'Created At', value: formatDate(order.created_at) }
  ]

  const statusColor = {
    draft: 'gray',
    pending: 'yellow',
    confirmed: 'blue',
    fulfilled: 'green',
    cancelled: 'red'
  }[order.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`Sales Order ${order.order_number}`}
      fields={fields}
      auditTrail={order.audit_trail || []}
      editPath={order.status === 'draft' ? `/sales/orders/${id}/edit` : undefined}
      backPath="/sales/orders"
      status={order.status}
      statusColor={statusColor}
    />
  )
}
