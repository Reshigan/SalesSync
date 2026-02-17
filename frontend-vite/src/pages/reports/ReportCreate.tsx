import { useNavigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { reportsService } from '../../services/reports.service'

export default function ReportCreate() {
  const navigate = useNavigate()

  const steps: WizardStep[] = [
    {
      id: 'basics',
      title: 'Report Info',
      description: 'Name and describe the report',
      fields: [
        { name: 'name', label: 'Report Name', type: 'text', required: true, placeholder: 'Enter report name', autoFocus: true },
        { name: 'type', label: 'Report Type', type: 'select', required: true, options: [{ value: 'sales', label: 'Sales' }, { value: 'inventory', label: 'Inventory' }, { value: 'finance', label: 'Finance' }, { value: 'operations', label: 'Operations' }, { value: 'custom', label: 'Custom' }] },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter report description', colSpan: 2 },
      ],
    },
    {
      id: 'delivery',
      title: 'Schedule & Delivery',
      description: 'Set up report schedule and format',
      fields: [
        { name: 'schedule', label: 'Schedule', type: 'select', required: true, defaultValue: 'monthly', options: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'manual', label: 'Manual Only' }] },
        { name: 'format', label: 'Format', type: 'select', required: true, defaultValue: 'pdf', options: [{ value: 'pdf', label: 'PDF' }, { value: 'excel', label: 'Excel' }, { value: 'csv', label: 'CSV' }, { value: 'html', label: 'HTML' }] },
        { name: 'recipients', label: 'Recipients', type: 'text', placeholder: 'email1@example.com, email2@example.com', helpText: 'Comma-separated email addresses', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await reportsService.createReport(data)
      toast.success('Report created successfully')
      navigate(`/reports/${result.id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create report')
    }
  }

  return (
    <FlowWizard
      title="Create Report"
      subtitle="Set up a new report"
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/reports')}
      submitLabel="Create Report"
      icon={<BarChart3 className="w-5 h-5" />}
    />
  )
}
