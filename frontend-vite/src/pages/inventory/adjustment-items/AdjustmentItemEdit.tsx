import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Settings, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function AdjustmentItemEdit() {
  const { adjustmentId, itemId } = useParams<{ adjustmentId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['adjustment-item', adjustmentId, itemId],
    queryFn: async () => {
      const res = await apiClient.get(`/adjustments/${adjustmentId}/items/${itemId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'adjustment',
      title: 'Adjustment Details',
      description: 'Update quantity and reason',
      fields: [
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, autoFocus: true, helpText: 'Negative values decrease inventory, positive values increase inventory' },
        { name: 'reason', label: 'Reason', type: 'select', required: true, options: [{ value: 'damaged', label: 'Damaged goods' }, { value: 'expired', label: 'Expired products' }, { value: 'theft', label: 'Theft/Loss' }, { value: 'found', label: 'Found inventory' }, { value: 'correction', label: 'System correction' }, { value: 'return', label: 'Customer return' }, { value: 'other', label: 'Other' }] },
        { name: 'justification', label: 'Justification', type: 'textarea', required: true, placeholder: 'Provide detailed explanation for this adjustment...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/adjustments/${adjustmentId}/items/${itemId}`, data)
      toast.success('Adjustment item updated successfully')
      navigate(`/inventory/adjustments/${adjustmentId}/items/${itemId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update adjustment item')
    }
  }

  return (
    <FlowWizard
      title="Edit Adjustment Item"
      subtitle={item?.product_name || `Item #${itemId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/inventory/adjustments/${adjustmentId}/items/${itemId}`)}
      submitLabel="Save Changes"
      initialData={item || {}}
      icon={<Settings className="w-5 h-5" />}
    />
  )
}
