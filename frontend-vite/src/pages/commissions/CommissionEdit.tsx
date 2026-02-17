import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { commissionsService } from '../../services/commissions.service'

export default function CommissionEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: commission, isLoading } = useQuery({
    queryKey: ['commission', id],
    queryFn: () => commissionsService.getCommission(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'amounts',
      title: 'Amounts',
      description: 'Update commission amounts',
      fields: [
        { name: 'base_amount', label: 'Base Amount', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'bonus_amount', label: 'Bonus Amount', type: 'number', step: '0.01', min: 0 },
        { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
      ],
    },
    {
      id: 'status-notes',
      title: 'Status & Notes',
      description: 'Update status and add notes',
      fields: [
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'paid', label: 'Paid' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await commissionsService.updateCommission(id!, data)
      toast.success('Commission updated successfully')
      navigate(`/commissions/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update commission')
    }
  }

  return (
    <FlowWizard
      title="Edit Commission"
      subtitle={`Commission #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/commissions/${id}`)}
      submitLabel="Save Changes"
      initialData={commission || {}}
      icon={<DollarSign className="w-5 h-5" />}
    />
  )
}
