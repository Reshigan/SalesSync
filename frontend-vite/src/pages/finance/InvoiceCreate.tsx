import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { financeService } from '../../services/finance.service'

export default function InvoiceCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Select the customer for this invoice',
      fields: [
        { name: 'customer_id', label: 'Customer', type: 'select', required: true, options: [{ value: 'cust-1', label: 'ABC Store' }, { value: 'cust-2', label: 'XYZ Shop' }], autoFocus: true },
      ],
    },
    {
      id: 'dates-amounts',
      title: 'Dates & Amounts',
      description: 'Set invoice dates and amounts',
      fields: [
        { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
        { name: 'due_date', label: 'Due Date', type: 'date', required: true },
        { name: 'subtotal', label: 'Subtotal', type: 'number', required: true, step: '0.01', min: 0, placeholder: '0.00' },
        { name: 'tax', label: 'Tax', type: 'number', step: '0.01', min: 0, defaultValue: 0, placeholder: '0.00' },
      ],
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Add any additional notes',
      fields: [
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes for this invoice...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await financeService.createInvoice(data)
      toast.success('Invoice created successfully')
      navigate(`/finance/invoices/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create invoice')
    }
  }

  return (
    <FlowWizard
      title="Create Invoice"
      subtitle="Create a new customer invoice"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/finance/invoices')}
      submitLabel="Create Invoice"
      icon={<FileText className="w-5 h-5" />}
    />
  )
}
