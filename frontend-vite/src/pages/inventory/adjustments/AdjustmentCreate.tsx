import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { inventoryService } from '../../../services/inventory.service'

export default function AdjustmentCreate() {
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
      name: 'adjustment_date',
      label: 'Adjustment Date',
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
      name: 'adjustment_type',
      label: 'Adjustment Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'increase', label: 'Increase' },
        { value: 'decrease', label: 'Decrease' },
        { value: 'damage', label: 'Damage' },
        { value: 'expiry', label: 'Expiry' },
        { value: 'recount', label: 'Recount' }
      ]
    },
    {
      name: 'reason',
      label: 'Reason',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Explain the reason for this adjustment...'
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add any additional notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await inventoryService.createAdjustment(data)
      navigate('/inventory/adjustments')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create adjustment')
    }
  }

  return (
    <TransactionForm
      title="Create Inventory Adjustment"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/inventory/adjustments')}
      submitLabel="Create Adjustment"
    />
  )
}
