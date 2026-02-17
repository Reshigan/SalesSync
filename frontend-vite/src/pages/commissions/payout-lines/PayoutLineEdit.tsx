import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Banknote, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function PayoutLineEdit() {
  const { payoutId, lineId } = useParams<{ payoutId: string; lineId: string }>()
  const navigate = useNavigate()

  const { data: line, isLoading } = useQuery({
    queryKey: ['payout-line', payoutId, lineId],
    queryFn: async () => {
      const res = await apiClient.get(`/commissions/payouts/${payoutId}/lines/${lineId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'payment',
      title: 'Payment Details',
      description: 'Update payment method and reference',
      fields: [
        { name: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: [{ value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'check', label: 'Check' }, { value: 'cash', label: 'Cash' }, { value: 'mobile_money', label: 'Mobile Money' }], autoFocus: true },
        { name: 'payment_reference', label: 'Payment Reference', type: 'text', required: true, placeholder: 'PAY-2024-001' },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/commissions/payouts/${payoutId}/lines/${lineId}`, data)
      toast.success('Payout line updated successfully')
      navigate(`/commissions/payouts/${payoutId}/lines/${lineId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update payout line')
    }
  }

  return (
    <FlowWizard
      title="Edit Payout Line"
      subtitle={line?.agent_name || `Line #${lineId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/commissions/payouts/${payoutId}/lines/${lineId}`)}
      submitLabel="Save Changes"
      initialData={line || {}}
      icon={<Banknote className="w-5 h-5" />}
    />
  )
}
