import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { financeService } from '../../../services/finance.service'

export default function PaymentAllocationEdit() {
  const { paymentId, allocationId } = useParams<{ paymentId: string; allocationId: string }>()
  const navigate = useNavigate()

  const { data: allocation, isLoading } = useQuery({
    queryKey: ['payment-allocation', paymentId, allocationId],
    queryFn: async () => financeService.getPaymentAllocation(paymentId!, allocationId!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'allocation',
      title: 'Allocation Details',
      description: 'Update allocation information',
      fields: [
        { name: 'allocated_amount', label: 'Allocated Amount', type: 'number', required: true, min: 0, step: 0.01, autoFocus: true },
        { name: 'allocation_date', label: 'Allocation Date', type: 'date', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await financeService.updatePaymentAllocation(paymentId!, allocationId!, data)
      toast.success('Allocation updated successfully')
      navigate(`/finance/payments/${paymentId}/allocations/${allocationId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update allocation')
    }
  }

  return (
    <FlowWizard
      title="Edit Payment Allocation"
      subtitle={allocation?.invoice_number || `Allocation #${allocationId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/finance/payments/${paymentId}/allocations/${allocationId}`)}
      submitLabel="Save Changes"
      initialData={allocation || {}}
      icon={<CreditCard className="w-5 h-5" />}
    />
  )
}
