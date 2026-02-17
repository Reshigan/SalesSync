import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function ReturnItemEdit() {
  const { returnId, itemId } = useParams<{ returnId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['return-item', returnId, itemId],
    queryFn: async () => {
      const res = await apiClient.get(`/returns/${returnId}/items/${itemId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Return Details',
      description: 'Update return item information',
      fields: [
        { name: 'quantity_returned', label: 'Quantity Returned', type: 'number', required: true, min: 1, autoFocus: true },
        { name: 'condition', label: 'Condition', type: 'select', required: true, options: [{ value: 'new', label: 'New/Unopened' }, { value: 'opened', label: 'Opened' }, { value: 'damaged', label: 'Damaged' }, { value: 'defective', label: 'Defective' }] },
        { name: 'restockable', label: 'Restockable', type: 'checkbox' },
        { name: 'reason', label: 'Return Reason', type: 'textarea', required: true, colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/returns/${returnId}/items/${itemId}`, data)
      toast.success('Return item updated successfully')
      navigate(`/orders/returns/${returnId}/items/${itemId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update return item')
    }
  }

  return (
    <FlowWizard
      title="Edit Return Item"
      subtitle={item?.product_name || `Item #${itemId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/orders/returns/${returnId}/items/${itemId}`)}
      submitLabel="Save Changes"
      initialData={item || {}}
      icon={<RotateCcw className="w-5 h-5" />}
    />
  )
}
