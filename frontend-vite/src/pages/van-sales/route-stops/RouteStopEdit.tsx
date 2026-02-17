import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function RouteStopEdit() {
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>()
  const navigate = useNavigate()

  const { data: stop, isLoading } = useQuery({
    queryKey: ['route-stop', routeId, stopId],
    queryFn: async () => {
      const res = await apiClient.get(`/route-stops/${stopId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'schedule',
      title: 'Stop Schedule',
      description: 'Update arrival and departure times',
      fields: [
        { name: 'planned_arrival', label: 'Planned Arrival Time', type: 'date', required: true, autoFocus: true },
        { name: 'planned_departure', label: 'Planned Departure Time', type: 'date', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any special instructions or notes...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/route-stops/${stopId}`, data)
      toast.success('Stop updated successfully')
      navigate(`/van-sales/routes/${routeId}/stops/${stopId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update stop')
    }
  }

  return (
    <FlowWizard
      title="Edit Route Stop"
      subtitle={stop?.customer_name || `Stop #${stopId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/van-sales/routes/${routeId}/stops/${stopId}`)}
      submitLabel="Save Changes"
      initialData={stop || {}}
      icon={<MapPin className="w-5 h-5" />}
    />
  )
}
