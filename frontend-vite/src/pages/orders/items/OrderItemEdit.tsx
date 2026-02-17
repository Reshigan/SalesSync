import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { ordersService } from '../../../services/orders.service'

export default function OrderItemEdit() {
  const { orderId, itemId } = useParams<{ orderId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['order-item', orderId, itemId],
    queryFn: async () => ordersService.getOrderItem(orderId!, itemId!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'pricing',
      title: 'Pricing & Quantity',
      description: 'Update item quantity and pricing',
      fields: [
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1, autoFocus: true },
        { name: 'unit_price', label: 'Unit Price', type: 'number', required: true, min: 0, step: 0.01 },
        { name: 'discount_percent', label: 'Discount %', type: 'number', min: 0, max: 100, step: 0.01 },
        { name: 'price_override_reason', label: 'Price Override Reason', type: 'text', placeholder: 'Explain why price was overridden', colSpan: 2 },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes about this line item', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await ordersService.updateOrderItem(orderId!, itemId!, data)
      toast.success('Order item updated successfully')
      navigate(`/orders/${orderId}/items/${itemId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update order item')
    }
  }

  return (
    <FlowWizard
      title="Edit Order Item"
      subtitle={item?.product_name || `Item #${itemId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/orders/${orderId}/items/${itemId}`)}
      submitLabel="Save Changes"
      initialData={item || {}}
      icon={<ShoppingCart className="w-5 h-5" />}
    />
  )
}
