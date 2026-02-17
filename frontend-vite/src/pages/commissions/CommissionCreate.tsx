import { useNavigate } from 'react-router-dom'
import { DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { commissionsService } from '../../services/commissions.service'

export default function CommissionCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'agent',
      title: 'Agent & Period',
      description: 'Select the agent and commission period',
      fields: [
        { name: 'agent_id', label: 'Agent', type: 'select', required: true, options: [{ value: 'agent-1', label: 'John Doe' }, { value: 'agent-2', label: 'Jane Smith' }], autoFocus: true },
        { name: 'period', label: 'Period', type: 'text', required: true, placeholder: 'e.g., January 2024' },
      ],
    },
    {
      id: 'amounts',
      title: 'Amounts',
      description: 'Enter commission amounts',
      fields: [
        { name: 'base_amount', label: 'Base Amount', type: 'number', required: true, step: '0.01', min: 0, placeholder: '0.00' },
        { name: 'bonus_amount', label: 'Bonus Amount', type: 'number', step: '0.01', min: 0, defaultValue: 0, placeholder: '0.00' },
        { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
      ],
    },
    {
      id: 'confirm',
      title: 'Confirm',
      description: 'Set status and add notes',
      fields: [
        { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'pending', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'paid', label: 'Paid' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await commissionsService.createCommission(data)
      toast.success('Commission created successfully')
      navigate(`/commissions/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create commission')
    }
  }

  return (
    <FlowWizard
      title="Create Commission"
      subtitle="Record a new agent commission"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/commissions')}
      submitLabel="Create Commission"
      icon={<DollarSign className="w-5 h-5" />}
    />
  )
}
