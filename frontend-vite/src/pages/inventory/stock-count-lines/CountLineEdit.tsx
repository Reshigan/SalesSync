import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function CountLineEdit() {
  const { countId, lineId } = useParams<{ countId: string; lineId: string }>()
  const navigate = useNavigate()

  const { data: line, isLoading } = useQuery({
    queryKey: ['count-line', countId, lineId],
    queryFn: async () => {
      const res = await apiClient.get(`/stock-counts/${countId}/lines/${lineId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'count',
      title: 'Count Details',
      description: `Expected: ${line?.expected_quantity || 0} units`,
      fields: [
        { name: 'counted_quantity', label: 'Counted Quantity', type: 'number', required: true, min: 0, autoFocus: true },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any observations or issues during counting...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/stock-counts/${countId}/lines/${lineId}`, data)
      toast.success('Count line updated successfully')
      navigate(`/inventory/stock-counts/${countId}/lines/${lineId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update count line')
    }
  }

  return (
    <FlowWizard
      title="Edit Count Line"
      subtitle={line?.product_name || `Line #${lineId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/inventory/stock-counts/${countId}/lines/${lineId}`)}
      submitLabel="Save Changes"
      initialData={line || {}}
      icon={<ClipboardCheck className="w-5 h-5" />}
    />
  )
}
