import React, { useState } from 'react'
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react'

export interface LineItem {
  id?: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity: number
  unit_price: number
  discount_percentage?: number
  tax_percentage?: number
  line_total: number
}

interface LineItemTableProps {
  items: LineItem[]
  onItemsChange?: (items: LineItem[]) => void
  readonly?: boolean
  showProductSearch?: boolean
  onProductSearch?: (query: string) => Promise<any[]>
  currency?: string
}

export const LineItemTable: React.FC<LineItemTableProps> = ({
  items,
  onItemsChange,
  readonly = false,
  showProductSearch = false,
  onProductSearch,
  currency = 'USD'
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<LineItem | null>(null)

  const calculateLineTotal = (item: Partial<LineItem>): number => {
    const quantity = item.quantity || 0
    const unitPrice = item.unit_price || 0
    const discountPct = item.discount_percentage || 0
    const taxPct = item.tax_percentage || 0

    const subtotal = quantity * unitPrice
    const discount = subtotal * (discountPct / 100)
    const taxableAmount = subtotal - discount
    const tax = taxableAmount * (taxPct / 100)

    return taxableAmount + tax
  }

  const handleAddItem = () => {
    const newItem: LineItem = {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      tax_percentage: 0,
      line_total: 0
    }
    setEditingIndex(items.length)
    setEditingItem(newItem)
  }

  const handleEditItem = (index: number) => {
    setEditingIndex(index)
    setEditingItem({ ...items[index] })
  }

  const handleSaveItem = () => {
    if (editingItem && editingIndex !== null) {
      const updatedItem = {
        ...editingItem,
        line_total: calculateLineTotal(editingItem)
      }

      const newItems = [...items]
      if (editingIndex >= items.length) {
        newItems.push(updatedItem)
      } else {
        newItems[editingIndex] = updatedItem
      }

      onItemsChange?.(newItems)
      setEditingIndex(null)
      setEditingItem(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingItem(null)
  }

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onItemsChange?.(newItems)
  }

  const handleFieldChange = (field: keyof LineItem, value: any) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + (item.quantity * item.unit_price),
      discount: acc.discount + (item.quantity * item.unit_price * (item.discount_percentage || 0) / 100),
      tax: acc.tax + ((item.quantity * item.unit_price - item.quantity * item.unit_price * (item.discount_percentage || 0) / 100) * (item.tax_percentage || 0) / 100),
      total: acc.total + item.line_total
    }),
    { subtotal: 0, discount: 0, tax: 0, total: 0 }
  )

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Line Total
              </th>
              {!readonly && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {editingIndex === index ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editingItem?.product_name || ''}
                        onChange={(e) => handleFieldChange('product_name', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Product name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editingItem?.product_code || ''}
                        onChange={(e) => handleFieldChange('product_code', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Code"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editingItem?.quantity || 0}
                        onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border rounded text-right"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editingItem?.unit_price || 0}
                        onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border rounded text-right"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editingItem?.discount_percentage || 0}
                        onChange={(e) => handleFieldChange('discount_percentage', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 border rounded text-right"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editingItem?.tax_percentage || 0}
                        onChange={(e) => handleFieldChange('tax_percentage', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 border rounded text-right"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(calculateLineTotal(editingItem || {}))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={handleSaveItem}
                          className="text-green-600 hover:text-green-800"
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.product_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.product_code || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.discount_percentage || 0}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.tax_percentage || 0}%
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.line_total)}
                    </td>
                    {!readonly && (
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditItem(index)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            {editingIndex === items.length && editingItem && (
              <tr className="bg-blue-50">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={editingItem.product_name || ''}
                    onChange={(e) => handleFieldChange('product_name', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Product name"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={editingItem.product_code || ''}
                    onChange={(e) => handleFieldChange('product_code', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Code"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 border rounded text-right"
                    min="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={editingItem.unit_price}
                    onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value))}
                    className="w-24 px-2 py-1 border rounded text-right"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={editingItem.discount_percentage || 0}
                    onChange={(e) => handleFieldChange('discount_percentage', parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 border rounded text-right"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={editingItem.tax_percentage || 0}
                    onChange={(e) => handleFieldChange('tax_percentage', parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 border rounded text-right"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(calculateLineTotal(editingItem))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={handleSaveItem}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-600 hover:text-gray-800"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={readonly ? 6 : 7} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Subtotal:
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(totals.subtotal)}
              </td>
              {!readonly && <td></td>}
            </tr>
            <tr>
              <td colSpan={readonly ? 6 : 7} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Discount:
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                -{formatCurrency(totals.discount)}
              </td>
              {!readonly && <td></td>}
            </tr>
            <tr>
              <td colSpan={readonly ? 6 : 7} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Tax:
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(totals.tax)}
              </td>
              {!readonly && <td></td>}
            </tr>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={readonly ? 6 : 7} className="px-4 py-3 text-right text-base font-bold text-gray-900">
                Total:
              </td>
              <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                {formatCurrency(totals.total)}
              </td>
              {!readonly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {!readonly && (
        <div className="flex justify-start">
          <button
            onClick={handleAddItem}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </button>
        </div>
      )}
    </div>
  )
}
