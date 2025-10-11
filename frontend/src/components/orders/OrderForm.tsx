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
    orderNumber: initialData?.orderNumber || '',
    orderDate: initialData?.orderDate || new Date(),
    deliveryDate: initialData?.deliveryDate,
    totalAmount: initialData?.totalAmount || 0,
    status: initialData?.status || 'PENDING',
    paymentStatus: initialData?.paymentStatus || 'PENDING',
    notes: initialData?.notes || '',
    createdAt: initialData?.createdAt || new Date(),
    updatedAt: initialData?.updatedAt || new Date(),
    tenantId: initialData?.tenantId || '',
    customerId: initialData?.customerId || '',
    userId: initialData?.userId || '',
    items: initialData?.items || [],
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
      setProducts(response.products || [])
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required'
    }
    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addLineItem = () => {
    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      productId: '',
      orderId: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      discount: 0
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
              value={formData.customerId}
              onChange={(e) => {
                const customerId = e.target.value
                const customer = customers.find(c => c.id === customerId)
                setFormData(prev => ({
                  ...prev,
                  customerId: customerId,
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.code}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Date *
            </label>
            <Input
              type="date"
              value={formData.orderDate instanceof Date ? formData.orderDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData(prev => ({ ...prev, orderDate: new Date(e.target.value) }))}
              error={errors.orderDate}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

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

        {formData.items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={item.productId}
                onChange={(e) => {
                  const productId = e.target.value
                  const product = products.find(p => p.id === productId)
                  const updatedItems = [...formData.items]
                  updatedItems[index] = {
                    ...item,
                    productId,
                    unitPrice: product?.unitPrice || 0,
                    totalPrice: (product?.unitPrice || 0) * item.quantity
                  }
                  setFormData(prev => ({ ...prev, items: updatedItems }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.unitPrice}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value) || 1
                  const updatedItems = [...formData.items]
                  updatedItems[index] = {
                    ...item,
                    quantity,
                    totalPrice: item.unitPrice * quantity
                  }
                  setFormData(prev => ({ ...prev, items: updatedItems }))
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price
              </label>
              <Input
                type="number"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => {
                  const unitPrice = parseFloat(e.target.value) || 0
                  const updatedItems = [...formData.items]
                  updatedItems[index] = {
                    ...item,
                    unitPrice,
                    totalPrice: unitPrice * item.quantity
                  }
                  setFormData(prev => ({ ...prev, items: updatedItems }))
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total
              </label>
              <Input
                type="number"
                step="0.01"
                value={item.totalPrice}
                readOnly
                className="bg-gray-50"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => {
                  const updatedItems = formData.items.filter((_, i) => i !== index)
                  setFormData(prev => ({ ...prev, items: updatedItems }))
                }}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

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