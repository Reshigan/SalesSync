import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { inventoryService } from '../../../services/inventory.service'

export default function StockCountCreate() {
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
      name: 'count_date',
      label: 'Count Date',
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
      name: 'count_type',
      label: 'Count Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'full', label: 'Full Count' },
        { value: 'cycle', label: 'Cycle Count' },
        { value: 'spot', label: 'Spot Check' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add stock count notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await inventoryService.createStockCount(data)
      navigate('/inventory/stock-counts')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create stock count')
    }
  }

  return (
    <TransactionForm
      title="Create Stock Count"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/inventory/stock-counts')}
      submitLabel="Create Stock Count"
    />
  )
}
