import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TransactionForm from '../../../components/transactions/TransactionForm'
import { vanSalesService } from '../../../services/van-sales.service'

export default function VanLoadCreate() {
  const navigate = useNavigate()
  const [vans, setVans] = useState([])
  const [routes, setRoutes] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [vansRes, routesRes] = await Promise.all([
        vanSalesService.getVans(),
        vanSalesService.getRoutes()
      ])
      setVans(vansRes.data || [])
      setRoutes(routesRes.data || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const fields = [
    {
      name: 'load_date',
      label: 'Load Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'van_id',
      label: 'Van',
      type: 'select' as const,
      required: true,
      options: vans.map((v: any) => ({
        value: v.id.toString(),
        label: `${v.van_number} - ${v.driver_name}`
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
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Add any notes or special instructions...'
    }
  ]

  const handleSubmit = async (data: any) => {
    try {
      await vanSalesService.createVanLoad(data)
      navigate('/van-sales/van-loads')
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create van load')
    }
  }

  return (
    <TransactionForm
      title="Create Van Load"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/van-sales/van-loads')}
      submitLabel="Create Van Load"
    />
  )
}
