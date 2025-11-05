import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TransactionDetail from '../../../components/transactions/TransactionDetail'
import { marketingService } from '../../../services/marketing.service'
import { formatDate } from '../../../utils/format'

export default function ActivationDetail() {
  const { id } = useParams()
  const [activation, setActivation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivation()
  }, [id])

  const loadActivation = async () => {
    setLoading(true)
    try {
      const response = await marketingService.getActivation(Number(id))
      setActivation(response.data)
    } catch (error) {
      console.error('Failed to load activation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!activation) {
    return <div className="flex items-center justify-center h-64">Activation not found</div>
  }

  const fields = [
    { label: 'Activation Code', value: activation.activation_code },
    { label: 'Activation Name', value: activation.activation_name },
    { label: 'Activation Type', value: activation.activation_type },
    { label: 'Activation Date', value: formatDate(activation.activation_date) },
    { label: 'Location', value: activation.location },
    { label: 'Assigned Agent', value: activation.agent_name },
    { label: 'Description', value: activation.description },
    { label: 'Status', value: activation.status.replace('_', ' ') },
    { label: 'Start Time', value: activation.start_time || '-' },
    { label: 'End Time', value: activation.end_time || '-' },
    { label: 'Samples Distributed', value: activation.samples_distributed || 0 },
    { label: 'Consumer Interactions', value: activation.consumer_interactions || 0 },
    { label: 'Notes', value: activation.notes },
    { label: 'Created By', value: activation.created_by },
    { label: 'Created At', value: formatDate(activation.created_at) }
  ]

  const statusColor = {
    planned: 'blue',
    in_progress: 'yellow',
    completed: 'green',
    cancelled: 'red'
  }[activation.status] as 'green' | 'yellow' | 'red' | 'gray'

  return (
    <TransactionDetail
      title={`Activation ${activation.activation_code}`}
      fields={fields}
      auditTrail={activation.audit_trail || []}
      backPath="/marketing/activations"
      status={activation.status.replace('_', ' ')}
      statusColor={statusColor}
    />
  )
}
