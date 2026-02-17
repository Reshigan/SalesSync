import { useNavigate } from 'react-router-dom'
import { Scale } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { commissionsService } from '../../services/commissions.service'

export default function RuleCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Rule Details',
      description: 'Name and describe the commission rule',
      fields: [
        { name: 'name', label: 'Rule Name', type: 'text', required: true, placeholder: 'e.g., Standard Sales Commission', autoFocus: true, colSpan: 2 },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe when this rule applies', colSpan: 2 },
      ],
    },
    {
      id: 'rates',
      title: 'Rates & Schedule',
      description: 'Set commission rates and effective date',
      fields: [
        { name: 'base_rate', label: 'Base Rate (%)', type: 'number', required: true, defaultValue: 5, step: '0.01', min: 0 },
        { name: 'bonus_threshold', label: 'Bonus Threshold', type: 'number', required: true, defaultValue: 50000, step: '0.01', min: 0 },
        { name: 'bonus_rate', label: 'Bonus Rate (%)', type: 'number', required: true, defaultValue: 2, step: '0.01', min: 0 },
        { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'active', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        { name: 'effective_from', label: 'Effective From', type: 'date', required: true },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await commissionsService.createRule(data)
      toast.success('Rule created successfully')
      navigate(`/commissions/rules/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create rule')
    }
  }

  return (
    <FlowWizard
      title="Create Commission Rule"
      subtitle="Define a new commission structure"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/commissions/rules')}
      submitLabel="Create Rule"
      icon={<Scale className="w-5 h-5" />}
    />
  )
}
