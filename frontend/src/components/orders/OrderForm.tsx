'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { Order, OrderItem } from '@/services/orders.service'
import { customersService, Customer } from '@/services/customers.service'
import { productsService, Product } from '@/services/products.service'
import { Plus, Trash2, Search, AlertCircle } from 'lucide-react'
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
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  
  const [formData, setFormData] = useState<Order>({
    customerId: initialData?.customerId || '',
    salesAgentId: initialData?.salesAgentId || '',
    orderDate: initialData?.orderDate || new Date().toISOString().split('T')[0],
    deliveryDate: initialData?.deliveryDate || '',
    status: initialData?.status || 'draft',
    paymentStatus: initialData?.paymentStatus || 'pending',
    paymentTerms: initialData?.paymentTerms || 'Net 30',
    priority: initialData?.priority || 'medium',
    items: initialData?.items || [],
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items])

  // Also recalculate when any item property changes
  useEffect(() => {
    if (Array.isArray(formData.items) && formData.items.length > 0) {
      calculateTotals()
    }
  }, [Array.isArray(formData.items) ? formData.items.map(item => `${item.quantity}-${item.unitPrice}-${item.discount}-${item.tax}`).join('|') : ''])

  useEffect(() => {
    if (formData.customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === formData.customerId)
      setSelectedCustomer(customer || null)
    }
  }, [formData.customerId, customers])

  const loadCustomers = async () => {
    try {
      console.log('🔍 OrderForm: Starting to load customers...')
      const response = await customersService.getAll({ status: 'active' })
      console.log('🔍 OrderForm: Raw response from customersService:', response)
      console.log('🔍 OrderForm: response?.customers:', response?.customers)
      console.log('🔍 OrderForm: Array.isArray(response?.customers):', Array.isArray(response?.customers))
      setCustomers(response?.customers || [])
      console.log('🔍 OrderForm: Customers set to state:', response?.customers || [])
    } catch (error: any) {
      console.error('🔍 OrderForm: Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productsService.getAll({ status: 'active' })
      setProducts(response?.products || [])
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const calculateLineItemTotal = (item: any) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    const discount = Number(item.discount) || 0
    const taxRate = Number(item.tax) || 0
    
    console.log('calculateLineItemTotal debug:', {
      item,
      quantity,
      unitPrice,
      discount,
      taxRate
    })
    
    const itemTotal = quantity * unitPrice
    const discountAmount = itemTotal * (discount / 100)
    const afterDiscount = itemTotal - discountAmount
    const taxAmount = afterDiscount * (taxRate / 100)
    const finalTotal = afterDiscount + taxAmount
    
    console.log('calculateLineItemTotal result:', {
      itemTotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      finalTotal
    })
    
    return isNaN(finalTotal) ? 0 : finalTotal
  }

  const calculateTotals = () => {
    const items = Array.isArray(formData.items) ? formData.items : [];
    
    const subtotal = items.reduce((sum, item) => {
      // Ensure all values are numbers
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      const discount = Number(item.discount) || 0
      
      const itemTotal = quantity * unitPrice
      const discountAmount = itemTotal * (discount / 100)
      return sum + (itemTotal - discountAmount)
    }, 0)

    const tax = items.reduce((sum, item) => {
      // Ensure all values are numbers
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      const discount = Number(item.discount) || 0
      const taxRate = Number(item.tax) || 0
      
      const itemTotal = quantity * unitPrice
      const discountAmount = itemTotal * (discount / 100)
      return sum + ((itemTotal - discountAmount) * (taxRate / 100))
    }, 0)

    // Ensure final values are numbers
    const finalSubtotal = Number(subtotal) || 0
    const finalTax = Number(tax) || 0
    const finalTotal = finalSubtotal + finalTax

    console.log('Order calculation debug:', {
      items: items.length,
      subtotal: finalSubtotal,
      tax: finalTax,
      totalAmount: finalTotal,
      itemsData: items
    })

    setFormData(prev => ({
      ...prev,
      subtotal: finalSubtotal,
      tax: finalTax,
      totalAmount: finalTotal
    }))
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(Array.isArray(prev.items) ? prev.items : []),
        {
          productId: '',
          productName: '',
          quantity: 1,
          price: 0,
          unitPrice: 0,
          discount: 0,
          tax: 0,
          total: 0,
        }
      ]
    }))
  }

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: Array.isArray(prev.items) ? prev.items.filter((_, i) => i !== index) : []
    }))
  }

  const updateLineItem = (index: number, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: Array.isArray(prev.items) ? prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-fill product details when product is selected
          if (field === 'productId' && value) {
            const product = products.find(p => p.id === value)
            if (product) {
              updatedItem.productName = product.name
              updatedItem.sku = product.sku
              updatedItem.unitPrice = product.basePrice
              updatedItem.tax = product.taxRate
            }
          }
          
          return updatedItem
        }
        return item
      }) : []
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required'
    }

    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Delivery date is required'
    }

    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    if (Array.isArray(formData.items)) {
      formData.items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`item_${index}_product`] = 'Product is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_price`] = 'Price must be greater than 0'
      }
      })
    }

    // Credit limit check
    if (selectedCustomer && formData.totalAmount) {
      const availableCredit = selectedCustomer.creditLimit - (selectedCustomer.creditBalance || 0)
      if (formData.paymentTerms !== 'Cash' && formData.totalAmount > availableCredit) {
        newErrors.creditLimit = `Order exceeds customer's available credit (${availableCredit.toFixed(2)})`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)
    try {
      // Get current user as sales agent (from localStorage)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const dataToSubmit = {
        ...formData,
        salesAgentId: user.id || formData.salesAgentId
      }

      await onSubmit(dataToSubmit)
      toast.success(initialData ? 'Order updated successfully' : 'Order created successfully')
      onCancel()
    } catch (error: any) {
      console.error('Error submitting order:', error)
      toast.error(error.response?.data?.message || 'Failed to save order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
              className={errors.customerId ? 'border-red-500' : ''}
              disabled={loadingCustomers}
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customerCode})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-500">{errors.customerId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
            >
              <option value="Cash">Cash</option>
              <option value="Net 7">Net 7</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
            </select>
          </div>
        </div>

        {/* Customer Credit Info */}
        {selectedCustomer && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 font-medium">Credit Information</p>
                <p className="text-blue-700">
                  Credit Limit: KES {selectedCustomer.creditLimit.toLocaleString()} | 
                  Used: KES {(selectedCustomer.creditBalance || 0).toLocaleString()} | 
                  Available: KES {(selectedCustomer.creditLimit - (selectedCustomer.creditBalance || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {errors.creditLimit && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.creditLimit}</p>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Date
            </label>
            <Input
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              className={errors.deliveryDate ? 'border-red-500' : ''}
              min={formData.orderDate}
            />
            {errors.deliveryDate && (
              <p className="mt-1 text-sm text-red-500">{errors.deliveryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Order['priority'] }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
            disabled={loadingProducts}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.items}</p>
          </div>
        )}

        <div className="space-y-3">
          {Array.isArray(formData.items) && formData.items.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                    className={errors[`item_${index}_product`] ? 'border-red-500' : ''}
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - KES {product.basePrice}
                      </option>
                    ))}
                  </select>
                  {errors[`item_${index}_product`] && (
                    <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_product`]}</p>
                  )}
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className={errors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-4 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Disc %
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-4 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tax %
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.tax}
                    onChange={(e) => updateLineItem(index, 'tax', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-4 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <div className="h-10 flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium">
                    {calculateLineItemTotal(item).toFixed(2)}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="w-full text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!Array.isArray(formData.items) || formData.items.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No items added yet. Click "Add Item" to get started.</p>
          </div>
        )}
      </div>

      {/* Order Totals */}
      {Array.isArray(formData.items) && formData.items.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">KES {(formData.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">KES {(formData.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span className="text-blue-600">KES {(formData.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes / Special Instructions
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add any special instructions or notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Order' : 'Create Order')}
        </Button>
      </div>
    </form>
  )
}
