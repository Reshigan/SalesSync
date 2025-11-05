import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { salesService } from '../../../services/sales.service'

export default function CreditNoteCreate() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await salesService.getInvoices()
      const eligibleInvoices = (response.data || []).filter((i: any) => 
        i.status === 'sent' || i.status === 'paid'
      )
      setInvoices(eligibleInvoices)
    } catch (error) {
      console.error('Failed to load invoices:', error)
    }
  }

  const fields = [
    {
      name: 'credit_note_date',
      label: 'Credit Note Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'invoice_id',
      label: 'Invoice',
      type: 'select' as const,
      required: true,
      options: invoices.map((i: any) => ({
        value: i.id.toString(),
        label: `${i.invoice_number} - ${i.customer_name}`
      }))
    },
    {
      name: 'credit_amount',
      label: 'Credit Amount (R)',
      type: 'number' as const,
      required: true,
      validation: (value: number) => value <= 0 ? 'Credit amount must be greater than 0' : null
    },
    {
      name: 'reason',
      label: 'Reason',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'return', label: 'Product Return' },
        { value: 'discount', label: 'Discount Adjustment' },
        { value: 'error', label: 'Billing Error' },
        { value: 'damage', label: 'Damaged Goods' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Explain the reason for this credit note...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await salesService.createCreditNote(data)
      navigate('/sales/credit-notes')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create credit note')
    }
  }

  return (
    <TransactionForm
      title="Create Credit Note"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sales/credit-notes')}
      submitLabel="Create Credit Note"
    />
  )
}
