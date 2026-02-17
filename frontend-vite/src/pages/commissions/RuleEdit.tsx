import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Scale, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { commissionsService } from '../../services/commissions.service'

export default function RuleEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading } = useQuery({
    queryKey: ['commission-rule', id],
    queryFn: async () => {
      const rules = await commissionsService.getRules()
      return rules.find((r: any) => r.id === id)
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  if (!rule) {
    return <div className="p-6 text-center text-gray-500">Rule not found</div>
  }

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Rule Details',
      description: 'Update rule name and description',
      fields: [
        { name: 'name', label: 'Rule Name', type: 'text', required: true, autoFocus: true, colSpan: 2 },
        { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
      ],
    },
    {
      id: 'rates',
      title: 'Rates & Schedule',
      description: 'Update commission rates and effective date',
      fields: [
        { name: 'base_rate', label: 'Base Rate (%)', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'bonus_threshold', label: 'Bonus Threshold', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'bonus_rate', label: 'Bonus Rate (%)', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        { name: 'effective_from', label: 'Effective From', type: 'date', required: true },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await commissionsService.updateRule(id!, data)
      toast.success('Rule updated successfully')
      navigate(`/commissions/rules/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update rule')
    }
  }

  return (
    <FlowWizard
      title="Edit Commission Rule"
      subtitle={rule.name || `Rule #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/commissions/rules/${id}`)}
      submitLabel="Save Changes"
      initialData={rule}
      icon={<Scale className="w-5 h-5" />}
    />
  )
}
