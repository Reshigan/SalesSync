import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../components/ui/FlowWizard'
import { reportsService } from '../../services/reports.service'

export default function ReportEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsService.getReport(id!),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'basics',
      title: 'Report Info',
      description: 'Update report name and type',
      fields: [
        { name: 'name', label: 'Report Name', type: 'text', required: true, autoFocus: true },
        { name: 'type', label: 'Report Type', type: 'select', required: true, options: [{ value: 'sales', label: 'Sales' }, { value: 'inventory', label: 'Inventory' }, { value: 'finance', label: 'Finance' }, { value: 'operations', label: 'Operations' }, { value: 'custom', label: 'Custom' }] },
        { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
      ],
    },
    {
      id: 'delivery',
      title: 'Schedule & Delivery',
      description: 'Update schedule and format',
      fields: [
        { name: 'schedule', label: 'Schedule', type: 'select', required: true, options: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'manual', label: 'Manual Only' }] },
        { name: 'format', label: 'Format', type: 'select', required: true, options: [{ value: 'pdf', label: 'PDF' }, { value: 'excel', label: 'Excel' }, { value: 'csv', label: 'CSV' }, { value: 'html', label: 'HTML' }] },
        { name: 'recipients', label: 'Recipients', type: 'text', placeholder: 'email1@example.com, email2@example.com', helpText: 'Comma-separated email addresses', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await reportsService.updateReport(id!, data)
      toast.success('Report updated successfully')
      navigate(`/reports/${id}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update report')
    }
  }

  return (
    <FlowWizard
      title="Edit Report"
      subtitle={report?.name || `Report #${id}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/reports/${id}`)}
      submitLabel="Save Changes"
      initialData={report || {}}
      icon={<BarChart3 className="w-5 h-5" />}
    />
  )
}
