import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FlowWizard, { WizardStep } from '../../../components/ui/FlowWizard'
import { apiClient } from '../../../services/api.service'

export default function VisitTaskEdit() {
  const { visitId, taskId } = useParams<{ visitId: string; taskId: string }>()
  const navigate = useNavigate()

  const { data: task, isLoading } = useQuery({
    queryKey: ['visit-task', visitId, taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/visits/${visitId}/tasks/${taskId}`)
      return res.data?.data || null
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Task Details',
      description: 'Update task information',
      fields: [
        { name: 'task_title', label: 'Task Title', type: 'text', required: true, autoFocus: true, placeholder: 'Enter task title' },
        { name: 'priority', label: 'Priority', type: 'select', required: true, options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Enter task description', colSpan: 2 },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional notes...', colSpan: 2 },
      ],
    },
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await apiClient.put(`/visits/${visitId}/tasks/${taskId}`, data)
      toast.success('Task updated successfully')
      navigate(`/field-operations/visits/${visitId}/tasks/${taskId}`)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update task')
    }
  }

  return (
    <FlowWizard
      title="Edit Visit Task"
      subtitle={task?.task_title || `Task #${taskId}`}
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/field-operations/visits/${visitId}/tasks/${taskId}`)}
      submitLabel="Save Changes"
      initialData={task || {}}
      icon={<ClipboardList className="w-5 h-5" />}
    />
  )
}
