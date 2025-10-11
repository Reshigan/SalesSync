'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Order, OrderItem } from '@/services/orders.service'
import { Customer, Product } from '@/types'
import { customersService } from '@/services/customers.service'
import { productsService } from '@/services/products.service'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderFormProps {
  initialData?: Order
  onSubmit: (data: Order) => Promise<void>
  onCancel: () => void
}

export function OrderForm({ initialData, onSubmit, onCancel }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  const [formData, setFormData] = useState<Order>({
    id: initialData?.id || '',
    customer_id: initialData?.customer_id || '',
    customer_name: initialData?.customer_name || '',
    total_amount: initialData?.total_amount || 0,
    status: initialData?.status || 'draft',
    order_date: initialData?.order_date || new Date().toISOString().split('T')[0],
    delivery_date: initialData?.delivery_date || '',
    items: initialData?.items || [],
    payment_status: initialData?.payment_status || 'pending',
    delivery_address: initialData?.delivery_address || '',
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await customersService.getAll({ status: 'active' })
      setCustomers(response || [])
    } catch (error: any) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productsService.getAll({ status: 'active' })
      setProducts(response || [])
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.order_date) {
      newErrors.order_date = 'Order date is required'
    }
    if (!formData.delivery_address?.trim()) {
      newErrors.delivery_address = 'Delivery address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addLineItem = () => {
    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      toast.success('Order saved successfully')
    } catch (error: any) {
      console.error('Error saving order:', error)
      toast.error(error.message || 'Failed to save order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => {
                const customerId = e.target.value
                const customer = customers.find(c => c.id === customerId)
                setFormData(prev => ({
                  ...prev,
                  customer_id: customerId,
                  customer_name: customer?.contactPerson || ''
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.contactPerson} - {customer.code}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Date *
            </label>
            <Input
              type="date"
              value={formData.order_date}
              onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
              error={errors.order_date}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Address *
          </label>
          <textarea
            value={formData.delivery_address}
            onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          {errors.delivery_address && (
            <p className="text-red-500 text-sm mt-1">{errors.delivery_address}</p>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
          <Button
            type="button"
            onClick={addLineItem}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}