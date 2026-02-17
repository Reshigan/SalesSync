import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function TransferItemEdit() {
  const { transferId, itemId } = useParams<{ transferId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['transfer-item', transferId, itemId],
    queryFn: async () => {
      const res = await apiClient.get(`/transfers/${transferId}/items/${itemId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'transfer',
      title: 'Transfer Details',
      description: 'Update transfer quantity',
      fields: [
        { name: 'quantity_requested', label: 'Quantity Requested', type: 'number', required: true, min: 1, autoFocus: true },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any special instructions or notes...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/transfers/${transferId}/items/${itemId}`, data)
      toast.success('Transfer item updated successfully')
      navigate(`/inventory/transfers/${transferId}/items/${itemId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update transfer item')
    }
  }

  return (
    <FlowWizard
      title="Edit Transfer Item"
      subtitle={item?.product_name || `Item #${itemId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/inventory/transfers/${transferId}/items/${itemId}`)}
      submitLabel="Save Changes"
      initialData={item || {}}
      icon={<ArrowRightLeft className="w-5 h-5" />}
    />
  )
}
