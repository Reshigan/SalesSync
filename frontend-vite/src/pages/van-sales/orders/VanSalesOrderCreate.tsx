import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { vanSalesService } from '../../../services/van-sales.service'

export default function VanSalesOrderCreate() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [routes, setRoutes] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [customersRes, routesRes, productsRes] = await Promise.all([
        vanSalesService.getCustomers(),
        vanSalesService.getRoutes(),
        vanSalesService.getProducts()
      ])
      setCustomers(customersRes.data || [])
      setRoutes(routesRes.data || [])
      setProducts(productsRes.data || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const fields = [
    {
      name: 'order_date',
      label: 'Order Date',
      type: 'date' as const,
      required: true
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
      name: 'route_id',
      label: 'Route',
      type: 'select' as const,
      required: true,
      options: routes.map((r: any) => ({
        value: r.id.toString(),
        label: r.name
      }))
    },
    {
      name: 'delivery_date',
      label: 'Delivery Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit' },
        { value: 'mobile_money', label: 'Mobile Money' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add any notes or special instructions...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await vanSalesService.createOrder(data)
      navigate('/van-sales/orders')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create order')
    }
  }

  return (
    <TransactionForm
      title="Create Van Sales Order"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/van-sales/orders')}
      submitLabel="Create Order"
    />
  )
}
