import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Wallet, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { cashReconciliationService } from '../../services/cashReconciliation.service'

export default function SessionEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: session, isLoading } = useQuery({
    queryKey: ['cash-session', id],
    queryFn: () => cashReconciliationService.getSession(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'balances',
      title: 'Session Balances',
      description: 'Update opening and closing balances',
      fields: [
        { name: 'opening_balance', label: 'Opening Balance', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'closing_balance', label: 'Closing Balance', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes or observations', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await cashReconciliationService.updateSession(id!, data)
      toast.success('Session updated successfully')
      navigate(`/cash-reconciliation/sessions/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update session')
    }
  }

  return (
    <FlowWizard
      title="Edit Cash Session"
      subtitle={`Session #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/cash-reconciliation/sessions/${id}`)}
      submitLabel="Save Changes"
      initialData={session || {}}
      icon={<Wallet className="w-5 h-5" />}
    />
  )
}
