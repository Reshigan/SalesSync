import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Banknote, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { cashReconciliationService } from '../../services/cashReconciliation.service'

export default function DepositEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: deposit, isLoading } = useQuery({
    queryKey: ['deposit', id],
    queryFn: async () => {
      const deposits = await cashReconciliationService.getBankDeposits({ id })
      return deposits.data[0]
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'deposit-details',
      title: 'Deposit Details',
      description: 'Update deposit amount and bank info',
      fields: [
        { name: 'amount', label: 'Deposit Amount', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'deposit_date', label: 'Deposit Date', type: 'date', required: true },
        { name: 'bank_name', label: 'Bank Name', type: 'text', required: true },
        { name: 'reference_number', label: 'Reference Number', type: 'text', required: true },
      ],
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Add any additional notes',
      fields: [
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await cashReconciliationService.updateBankDeposit(id!, data)
      toast.success('Deposit updated successfully')
      navigate(`/cash-reconciliation/deposits/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update deposit')
    }
  }

  return (
    <FlowWizard
      title="Edit Bank Deposit"
      subtitle={`Deposit #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/cash-reconciliation/deposits/${id}`)}
      submitLabel="Save Changes"
      initialData={deposit || {}}
      icon={<Banknote className="w-5 h-5" />}
    />
  )
}
