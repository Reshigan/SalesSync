import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { salesService } from '../../../services/sales.service'
import { formatCurrency, formatDate } from '../../../utils/format'

export default function CreditNoteDetail() {
  const { id } = useParams()
  const [creditNote, setCreditNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCreditNote()
  }, [id])

  const loadCreditNote = async () => {
    setLoading(true)
    try {
      const response = await salesService.getCreditNote(Number(id))
      setCreditNote(response.data)
    } catch (error) {
      console.error('Failed to load credit note:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!creditNote) {
    return <div className="flex items-center justify-center h-64">Credit note not found</div>
  }

  const fields = [
    { label: 'Credit Note Number', value: creditNote.credit_note_number },
    { label: 'Credit Note Date', value: formatDate(creditNote.credit_note_date) },
    { label: 'Customer', value: creditNote.customer_name },
    { label: 'Invoice Number', value: creditNote.invoice_number },
    { label: 'Credit Amount', value: formatCurrency(creditNote.credit_amount) },
    { label: 'Reason', value: creditNote.reason },
    { label: 'Status', value: creditNote.status },
    { label: 'Applied Date', value: creditNote.applied_date ? formatDate(creditNote.applied_date) : '-' },
    { label: 'Notes', value: creditNote.notes },
    { label: 'Created By', value: creditNote.created_by },
    { label: 'Created At', value: formatDate(creditNote.created_at) }
  ]

  const statusColor = {
    draft: 'gray',
    issued: 'green',
    applied: 'blue'
  }[creditNote.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`Credit Note ${creditNote.credit_note_number}`}
      fields={fields}
      auditTrail={creditNote.audit_trail || []}
      backPath="/sales/credit-notes"
      status={creditNote.status}
      statusColor={statusColor}
    />
  )
}
