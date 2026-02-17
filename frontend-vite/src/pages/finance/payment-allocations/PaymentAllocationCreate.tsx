import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { financeService } from '../../../services/finance.service'

export default function PaymentAllocationCreate() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const navigate = useNavigate()

  const { data: payment } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => financeService.getPayment(paymentId!),
  })

  const { data: invoices } = useQuery({
    queryKey: ['customer-invoices', payment?.customer_id],
    queryFn: async () => financeService.getInvoicesList(),
    enabled: !!payment?.customer_id,
  })

  const invoiceOptions = (invoices || []).map((inv: any) => ({ value: inv.id, label: `${inv.invoice_number} (Balance: $${(inv.balance || 0).toFixed(2)})` }))

  const steps: WizardStep[] = [
    {
      id: 'allocation',
      title: 'Allocation Details',
      description: 'Allocate payment to an invoice',
      fields: [
        { name: 'invoice_id', label: 'Invoice', type: 'select', required: true, options: invoiceOptions, autoFocus: true },
        { name: 'allocated_amount', label: 'Allocated Amount', type: 'number', required: true, min: 0, step: 0.01 },
        { name: 'allocation_date', label: 'Allocation Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes about this allocation...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await financeService.createPaymentAllocation(paymentId!, data)
      toast.success('Allocation created successfully')
      navigate(`/finance/payments/${paymentId}/allocations/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create allocation')
    }
  }

  return (
    <FlowWizard
      title="Create Payment Allocation"
      subtitle={payment ? `${payment.payment_number} - ${payment.customer_name}` : ''}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/finance/payments/${paymentId}/allocations`)}
      submitLabel="Create Allocation"
      icon={<CreditCard className="w-5 h-5" />}
    />
  )
}
