import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function VanLoadItemEdit() {
  const { loadId, itemId } = useParams<{ loadId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['van-load-item', loadId, itemId],
    queryFn: async () => {
      const res = await apiClient.get(`/van-loads/${loadId}/items/${itemId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'load',
      title: 'Load Details',
      description: 'Update quantity loaded',
      fields: [
        { name: 'quantity_loaded', label: 'Quantity Loaded', type: 'number', required: true, min: 1, autoFocus: true, placeholder: 'Enter quantity loaded' },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any notes about this item...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/van-loads/${loadId}/items/${itemId}`, data)
      toast.success('Item updated successfully')
      navigate(`/van-sales/loads/${loadId}/items/${itemId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update item')
    }
  }

  return (
    <FlowWizard
      title="Edit Van Load Item"
      subtitle={item?.product_name || `Item #${itemId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/van-sales/loads/${loadId}/items/${itemId}`)}
      submitLabel="Save Changes"
      initialData={item || {}}
      icon={<Package className="w-5 h-5" />}
    />
  )
}
