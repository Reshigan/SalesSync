import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { fieldOperationsService } from '../../../services/field-operations.service'

export default function VisitCreate() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [agentsRes, customersRes] = await Promise.all([
        fieldOperationsService.getAgents(),
        fieldOperationsService.getCustomers()
      ])
      setAgents(agentsRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const fields = [
    {
      name: 'visit_date',
      label: 'Visit Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'agent_id',
      label: 'Agent',
      type: 'select' as const,
      required: true,
      options: agents.map((a: any) => ({
        value: a.id.toString(),
        label: a.name
      }))
    },
    {
      name: 'customer_id',
      label: 'Customer',
      type: 'select' as const,
      required: true,
      options: customers.map((c: any) => ({
        value: c.id.toString(),
        label: c.name
      }))
    },
    {
      name: 'visit_type',
      label: 'Visit Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'sales', label: 'Sales Visit' },
        { value: 'survey', label: 'Survey' },
        { value: 'board_placement', label: 'Board Placement' },
        { value: 'product_distribution', label: 'Product Distribution' },
        { value: 'follow_up', label: 'Follow Up' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add visit notes or objectives...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await fieldOperationsService.createVisit(data)
      navigate('/field-operations/visits')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create visit')
    }
  }

  return (
    <TransactionForm
      title="Create Field Visit"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/field-operations/visits')}
      submitLabel="Create Visit"
    />
  )
}
