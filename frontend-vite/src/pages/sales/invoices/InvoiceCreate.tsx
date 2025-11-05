import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { salesService } from '../../../services/sales.service'

export default function InvoiceCreate() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await salesService.getOrders()
      const uninvoicedOrders = (response.data || []).filter((o: any) => o.status === 'confirmed' && !o.invoiced)
      setOrders(uninvoicedOrders)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const fields = [
    {
      name: 'invoice_date',
      label: 'Invoice Date',
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
      name: 'due_date',
      label: 'Due Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add invoice notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await salesService.createInvoice(data)
      navigate('/sales/invoices')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create invoice')
    }
  }

  return (
    <TransactionForm
      title="Create Sales Invoice"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sales/invoices')}
      submitLabel="Create Invoice"
    />
  )
}
