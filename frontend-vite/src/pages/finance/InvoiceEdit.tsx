import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { financeService } from '../../services/finance.service'

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => financeService.getInvoice(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'dates-amounts',
      title: 'Dates & Amounts',
      description: 'Update invoice dates and amounts',
      fields: [
        { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
        { name: 'due_date', label: 'Due Date', type: 'date', required: true },
        { name: 'subtotal', label: 'Subtotal', type: 'number', required: true, step: '0.01', min: 0 },
        { name: 'tax', label: 'Tax', type: 'number', required: true, step: '0.01', min: 0 },
      ],
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Update invoice notes',
      fields: [
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await financeService.updateInvoice(id!, data)
      toast.success('Invoice updated successfully')
      navigate(`/finance/invoices/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update invoice')
    }
  }

  return (
    <FlowWizard
      title="Edit Invoice"
      subtitle={`Invoice #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/finance/invoices/${id}`)}
      submitLabel="Save Changes"
      initialData={invoice || {}}
      icon={<FileText className="w-5 h-5" />}
    />
  )
}
