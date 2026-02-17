import { useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { financeService } from '../../services/finance.service'

export default function PaymentCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'invoice',
      title: 'Invoice',
      description: 'Select the invoice to pay',
      fields: [
        { name: 'invoice_id', label: 'Invoice', type: 'select', required: true, options: [{ value: 'inv-1', label: 'INV-2024-001 - ABC Store' }, { value: 'inv-2', label: 'INV-2024-002 - XYZ Shop' }], autoFocus: true },
      ],
    },
    {
      id: 'payment-details',
      title: 'Payment Details',
      description: 'Enter payment amount and method',
      fields: [
        { name: 'amount', label: 'Amount', type: 'number', required: true, step: '0.01', min: 0, placeholder: '0.00' },
        { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
        { name: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: [{ value: 'Cash', label: 'Cash' }, { value: 'Bank Transfer', label: 'Bank Transfer' }, { value: 'Credit Card', label: 'Credit Card' }, { value: 'Cheque', label: 'Cheque' }] },
        { name: 'reference_number', label: 'Reference Number', type: 'text', placeholder: 'e.g., TXN-12345' },
      ],
    },
    {
      id: 'confirm',
      title: 'Confirm',
      description: 'Set status and add notes',
      fields: [
        { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'pending', options: [{ value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }] },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter any notes...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await financeService.createPayment(data)
      toast.success('Payment recorded successfully')
      navigate(`/finance/payments/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to record payment')
    }
  }

  return (
    <FlowWizard
      title="Record Payment"
      subtitle="Record a new payment against an invoice"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/finance/payments')}
      submitLabel="Record Payment"
      icon={<CreditCard className="w-5 h-5" />}
    />
  )
}
