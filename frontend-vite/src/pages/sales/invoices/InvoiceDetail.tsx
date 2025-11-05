import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function InvoiceDetail() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoice()
  }, [id])

  const loadInvoice = async () => {
    setLoading(true)
    try {
      const response = await salesService.getInvoice(Number(id))
      setInvoice(response.data)
    } catch (error) {
      console.error('Failed to load invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!invoice) {
    return <div className="flex items-center justify-center h-64">Invoice not found</div>
  }

  const fields = [
    { label: 'Invoice Number', value: invoice.invoice_number },
    { label: 'Invoice Date', value: formatDate(invoice.invoice_date) },
    { label: 'Customer', value: invoice.customer_name },
    { label: 'Order Number', value: invoice.order_number },
    { label: 'Invoice Amount', value: formatCurrency(invoice.invoice_amount) },
    { label: 'Due Date', value: formatDate(invoice.due_date) },
    { label: 'Status', value: invoice.status },
    { label: 'Payment Status', value: invoice.payment_status },
    { label: 'Amount Paid', value: formatCurrency(invoice.amount_paid || 0) },
    { label: 'Balance Due', value: formatCurrency(invoice.balance_due || invoice.invoice_amount) },
    { label: 'Notes', value: invoice.notes },
    { label: 'Created By', value: invoice.created_by },
    { label: 'Created At', value: formatDate(invoice.created_at) }
  ]

  const statusColor = {
    draft: 'gray',
    sent: 'blue',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray'
  }[invoice.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`Invoice ${invoice.invoice_number}`}
      fields={fields}
      auditTrail={invoice.audit_trail || []}
      backPath="/sales/invoices"
      status={invoice.status}
      statusColor={statusColor}
    />
  )
}
