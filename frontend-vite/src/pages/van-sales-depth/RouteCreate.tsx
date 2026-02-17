import { useNavigate } from 'react-router-dom'
import { Route } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { vanSalesService } from '../../services/vanSales.service'

export default function RouteCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'route-info',
      title: 'Route Information',
      description: 'Enter the route name and assignments',
      fields: [
        { name: 'route_name', label: 'Route Name', type: 'text', required: true, autoFocus: true, colSpan: 2 },
        { name: 'agent_id', label: 'Agent', type: 'select', required: true, options: [{ value: 'agent-1', label: 'John Doe' }] },
        { name: 'van_id', label: 'Van', type: 'select', required: true, options: [{ value: 'van-1', label: 'VAN-001' }] },
      ],
    },
    {
      id: 'location',
      title: 'Location & Notes',
      description: 'Set coverage area and start location',
      fields: [
        { name: 'coverage_area', label: 'Coverage Area', type: 'text', required: true },
        { name: 'start_location', label: 'Start Location', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await vanSalesService.createRoute(data)
      toast.success('Route created successfully')
      navigate(`/van-sales/routes/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create route')
    }
  }

  return (
    <FlowWizard
      title="Create Route"
      subtitle="Set up a new delivery route"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/van-sales/routes')}
      submitLabel="Create Route"
      icon={<Route className="w-5 h-5" />}
    />
  )
}
