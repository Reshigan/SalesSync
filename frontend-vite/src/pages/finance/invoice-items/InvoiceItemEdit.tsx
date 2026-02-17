import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { financeService } from '../../../services/finance.service'

export default function InvoiceItemEdit() {
  const { invoiceId, itemId } = useParams<{ invoiceId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['invoice-item', invoiceId, itemId],
    queryFn: async () => financeService.getInvoiceItem(invoiceId!, itemId!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'pricing',
      title: 'Item Details',
      description: 'Update quantity and pricing',
      fields: [
        { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1, autoFocus: true },
        { name: 'unit_price', label: 'Unit Price', type: 'number', required: true, min: 0, step: 0.01 },
        { name: 'discount_percent', label: 'Discount %', type: 'number', min: 0, max: 100, step: 0.01 },
        { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await financeService.updateInvoiceItem(invoiceId!, itemId!, data)
      toast.success('Invoice item updated successfully')
      navigate(`/finance/invoices/${invoiceId}/items/${itemId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update invoice item')
    }
  }

  return (
    <FlowWizard
      title="Edit Invoice Item"
      subtitle={item?.product_name || `Item #${itemId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/finance/invoices/${invoiceId}/items/${itemId}`)}
      submitLabel="Save Changes"
      initialData={item || {}}
      icon={<FileText className="w-5 h-5" />}
    />
  )
}
