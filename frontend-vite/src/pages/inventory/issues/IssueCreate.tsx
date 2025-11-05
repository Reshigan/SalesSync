import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { inventoryService } from '../../../services/inventory.service'

export default function IssueCreate() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.getWarehouses()
      setWarehouses(response.data || [])
    } catch (error) {
      console.error('Failed to load warehouses:', error)
    }
  }

  const fields = [
    {
      name: 'issue_date',
      label: 'Issue Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'warehouse_id',
      label: 'Warehouse',
      type: 'select' as const,
      required: true,
      options: warehouses.map((w: any) => ({
        value: w.id.toString(),
        label: w.name
      }))
    },
    {
      name: 'issued_to',
      label: 'Issued To',
      type: 'text' as const,
      required: true,
      placeholder: 'Department, Van, or Person'
    },
    {
      name: 'issue_type',
      label: 'Issue Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'van_load', label: 'Van Load' },
        { value: 'department', label: 'Department' },
        { value: 'production', label: 'Production' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add issue notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await inventoryService.createIssue(data)
      navigate('/inventory/issues')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create issue')
    }
  }

  return (
    <TransactionForm
      title="Create Inventory Issue"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/inventory/issues')}
      submitLabel="Create Issue"
    />
  )
}
