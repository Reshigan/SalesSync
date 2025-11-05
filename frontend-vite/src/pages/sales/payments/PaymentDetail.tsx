import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function PaymentDetail() {
  const { id } = useParams()
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayment()
  }, [id])

  const loadPayment = async () => {
    setLoading(true)
    try {
      const response = await salesService.getPayment(Number(id))
      setPayment(response.data)
    } catch (error) {
      console.error('Failed to load payment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!payment) {
    return <div className="flex items-center justify-center h-64">Payment not found</div>
  }

  const fields = [
    { label: 'Payment Number', value: payment.payment_number },
    { label: 'Payment Date', value: formatDate(payment.payment_date) },
    { label: 'Customer', value: payment.customer_name },
    { label: 'Invoice Number', value: payment.invoice_number },
    { label: 'Payment Amount', value: formatCurrency(payment.payment_amount) },
    { label: 'Payment Method', value: payment.payment_method },
    { label: 'Reference Number', value: payment.reference_number },
    { label: 'Status', value: payment.status },
    { label: 'Cleared Date', value: payment.cleared_date ? formatDate(payment.cleared_date) : '-' },
    { label: 'Notes', value: payment.notes },
    { label: 'Created By', value: payment.created_by },
    { label: 'Created At', value: formatDate(payment.created_at) }
  ]

  const statusColor = {
    pending: 'yellow',
    cleared: 'green',
    bounced: 'red'
  }[payment.status] as 'green' | 'yellow' | 'red'

  return (
    <TransactionDetail
      title={`Payment ${payment.payment_number}`}
      fields={fields}
      auditTrail={payment.audit_trail || []}
      backPath="/sales/payments"
      status={payment.status}
      statusColor={statusColor}
    />
  )
}
