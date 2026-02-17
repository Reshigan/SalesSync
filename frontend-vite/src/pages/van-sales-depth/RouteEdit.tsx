import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Route, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { vanSalesService } from '../../services/vanSales.service'

export default function RouteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: route, isLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: () => vanSalesService.getRoute(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  if (!route) {
    return <div className="p-6 text-center text-gray-500">Route not found</div>
  }

  const steps: WizardStep[] = [
    {
      id: 'route-info',
      title: 'Route Information',
      description: 'Update the route name and assignments',
      fields: [
        { name: 'route_name', label: 'Route Name', type: 'text', required: true, autoFocus: true, colSpan: 2 },
        { name: 'agent_id', label: 'Agent', type: 'select', required: true, options: [{ value: 'agent-1', label: 'John Doe' }, { value: 'agent-2', label: 'Jane Smith' }] },
        { name: 'van_id', label: 'Van', type: 'select', required: true, options: [{ value: 'van-1', label: 'VAN-001' }, { value: 'van-2', label: 'VAN-002' }] },
      ],
    },
    {
      id: 'location',
      title: 'Location & Notes',
      description: 'Update coverage area and notes',
      fields: [
        { name: 'coverage_area', label: 'Coverage Area', type: 'text', required: true },
        { name: 'start_location', label: 'Start Location', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await vanSalesService.updateRoute(id!, data)
      toast.success('Route updated successfully')
      navigate(`/van-sales/routes/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update route')
    }
  }

  return (
    <FlowWizard
      title="Edit Route"
      subtitle={route.route_name || `Route #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/van-sales/routes/${id}`)}
      submitLabel="Save Changes"
      initialData={route}
      icon={<Route className="w-5 h-5" />}
    />
  )
}
