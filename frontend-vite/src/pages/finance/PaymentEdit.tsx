import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { financeService } from '../../services/finance.service'

export default function PaymentEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => financeService.getPayment(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'payment-details',
      title: 'Payment Details',
      description: 'Update payment amount and method',
      fields: [
        { name: 'amount', label: 'Amount', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
        { name: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: [{ value: 'Cash', label: 'Cash' }, { value: 'Bank Transfer', label: 'Bank Transfer' }, { value: 'Credit Card', label: 'Credit Card' }, { value: 'Cheque', label: 'Cheque' }] },
        { name: 'reference_number', label: 'Reference Number', type: 'text' },
      ],
    },
    {
      id: 'status-notes',
      title: 'Status & Notes',
      description: 'Update payment status and notes',
      fields: [
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await financeService.updatePayment(id!, data)
      toast.success('Payment updated successfully')
      navigate(`/finance/payments/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update payment')
    }
  }

  return (
    <FlowWizard
      title="Edit Payment"
      subtitle={`Payment #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/finance/payments/${id}`)}
      submitLabel="Save Changes"
      initialData={payment || {}}
      icon={<CreditCard className="w-5 h-5" />}
    />
  )
}
