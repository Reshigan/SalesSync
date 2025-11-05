import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { inventoryService } from '../../../services/inventory.service'

export default function TransferCreate() {
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
      name: 'transfer_date',
      label: 'Transfer Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'from_warehouse_id',
      label: 'From Warehouse',
      type: 'select' as const,
      required: true,
      options: warehouses.map((w: any) => ({
        value: w.id.toString(),
        label: w.name
      }))
    },
    {
      name: 'to_warehouse_id',
      label: 'To Warehouse',
      type: 'select' as const,
      required: true,
      options: warehouses.map((w: any) => ({
        value: w.id.toString(),
        label: w.name
      }))
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add transfer notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    if (data.from_warehouse_id === data.to_warehouse_id) {
      throw new Error('From and To warehouses must be different')
    }

    try {
      await inventoryService.createTransfer(data)
      navigate('/inventory/transfers')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create transfer')
    }
  }

  return (
    <TransactionForm
      title="Create Inventory Transfer"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/inventory/transfers')}
      submitLabel="Create Transfer"
    />
  )
}
