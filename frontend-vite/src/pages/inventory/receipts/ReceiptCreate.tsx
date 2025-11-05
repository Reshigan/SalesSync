import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { inventoryService } from '../../../services/inventory.service'

export default function ReceiptCreate() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [warehousesRes, suppliersRes] = await Promise.all([
        inventoryService.getWarehouses(),
        inventoryService.getSuppliers()
      ])
      setWarehouses(warehousesRes.data || [])
      setSuppliers(suppliersRes.data || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const fields = [
    {
      name: 'receipt_date',
      label: 'Receipt Date',
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
      name: 'supplier_id',
      label: 'Supplier',
      type: 'select' as const,
      required: true,
      options: suppliers.map((s: any) => ({
        value: s.id.toString(),
        label: s.name
      }))
    },
    {
      name: 'po_number',
      label: 'PO Number',
      type: 'text' as const,
      required: true
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add receipt notes...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await inventoryService.createReceipt(data)
      navigate('/inventory/receipts')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create receipt')
    }
  }

  return (
    <TransactionForm
      title="Create Inventory Receipt (GRN)"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/inventory/receipts')}
      submitLabel="Create Receipt"
    />
  )
}
