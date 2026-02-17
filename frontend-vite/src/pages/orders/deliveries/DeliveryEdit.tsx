import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Truck, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { ordersService } from '../../../services/orders.service'

export default function DeliveryEdit() {
  const { orderId, deliveryId } = useParams<{ orderId: string; deliveryId: string }>()
  const navigate = useNavigate()

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', orderId, deliveryId],
    queryFn: async () => ordersService.getOrderDelivery(orderId!, deliveryId!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'driver',
      title: 'Driver & Vehicle',
      description: 'Update driver and vehicle details',
      fields: [
        { name: 'driver_name', label: 'Driver Name', type: 'text', required: true, autoFocus: true },
        { name: 'vehicle_number', label: 'Vehicle Number', type: 'text', required: true },
      ],
    },
    {
      id: 'schedule',
      title: 'Schedule & Address',
      description: 'Update delivery schedule and address',
      fields: [
        { name: 'scheduled_date', label: 'Scheduled Date', type: 'date', required: true },
        { name: 'estimated_delivery_time', label: 'Estimated Delivery Time', type: 'date', required: true },
        { name: 'delivery_address', label: 'Delivery Address', type: 'textarea', required: true, colSpan: 2 },
        { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await ordersService.updateOrderDelivery(orderId!, deliveryId!, data)
      toast.success('Delivery updated successfully')
      navigate(`/orders/${orderId}/deliveries/${deliveryId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update delivery')
    }
  }

  return (
    <FlowWizard
      title="Edit Delivery"
      subtitle={delivery?.delivery_number || `Delivery #${deliveryId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/orders/${orderId}/deliveries/${deliveryId}`)}
      submitLabel="Save Changes"
      initialData={delivery || {}}
      icon={<Truck className="w-5 h-5" />}
    />
  )
}
