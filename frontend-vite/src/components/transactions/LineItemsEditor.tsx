import { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator, Package } from 'lucide-react'

export interface Product {
  id: string
  name: string
  code?: string
  sku?: string
  price: number
  selling_price?: number
  cost_price?: number
  tax_rate?: number
  unit_of_measure?: string
}

export interface Discount {
  id: string
  name: string
  value: number
  discount_type: 'percentage' | 'fixed'
}

export interface LineItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  cost_price: number
  discount_id: string
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  line_total: number
}

export interface LineItemsTotals {
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  item_count: number
}

interface LineItemsEditorProps {
  products: Product[]
  discounts?: Discount[]
  lineItems: LineItem[]
  onLineItemsChange: (items: LineItem[]) => void
  onTotalsChange?: (totals: LineItemsTotals) => void
  onRecalculate?: () => void
  calculating?: boolean
  readOnly?: boolean
  showCostPrice?: boolean
  currencySymbol?: string
  title?: string
}

export function createEmptyLineItem(): LineItem {
  return {
    product_id: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    cost_price: 0,
    discount_id: '',
    discount_percentage: 0,
    discount_amount: 0,
    tax_percentage: 0,
    tax_amount: 0,
    line_total: 0
  }
}

export function calculateLineItemTotals(item: LineItem): LineItem {
  const subtotal = item.unit_price * item.quantity
  const discountAmount = (subtotal * item.discount_percentage) / 100
  const discountedSubtotal = subtotal - discountAmount
  const taxAmount = (discountedSubtotal * item.tax_percentage) / 100
  const lineTotal = discountedSubtotal + taxAmount

  return {
    ...item,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    line_total: lineTotal
  }
}

export function calculateTotals(items: LineItem[]): LineItemsTotals {
  const validItems = items.filter(item => item.product_id)
  return {
    subtotal: validItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
    discount_amount: validItems.reduce((sum, item) => sum + item.discount_amount, 0),
    tax_amount: validItems.reduce((sum, item) => sum + item.tax_amount, 0),
    total_amount: validItems.reduce((sum, item) => sum + item.line_total, 0),
    item_count: validItems.length
  }
}

export default function LineItemsEditor({
  products,
  discounts = [],
  lineItems,
  onLineItemsChange,
  onTotalsChange,
  onRecalculate,
  calculating = false,
  readOnly = false,
  showCostPrice = false,
  currencySymbol = 'R',
  title = 'Line Items'
}: LineItemsEditorProps) {
  
  useEffect(() => {
    if (onTotalsChange) {
      onTotalsChange(calculateTotals(lineItems))
    }
  }, [lineItems, onTotalsChange])

  const addLineItem = () => {
    onLineItemsChange([...lineItems, createEmptyLineItem()])
  }

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index)
    onLineItemsChange(newItems)
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems]
    let item = { ...newItems[index] }

    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        item.product_id = value
        item.product_name = product.name
        // Pricing is set from product master data - salesmen cannot modify
        item.unit_price = product.selling_price || product.price || 0
        item.cost_price = product.cost_price || 0
        item.tax_percentage = product.tax_rate || 0
        // Discount will be applied by backend based on customer/product rules
        item.discount_percentage = 0
      }
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, parseInt(value) || 1)
    }
    // Note: unit_price and discount are read-only - salesmen cannot affect pricing

    item = calculateLineItemTotals(item)
    newItems[index] = item
    onLineItemsChange(newItems)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {title}
        </h3>
        {!readOnly && (
          <div className="flex gap-2">
            {onRecalculate && (
              <button
                type="button"
                onClick={onRecalculate}
                disabled={calculating}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-surface-secondary flex items-center gap-1"
              >
                <Calculator className="w-4 h-4" />
                {calculating ? 'Calculating...' : 'Recalculate'}
              </button>
            )}
            <button
              type="button"
              onClick={addLineItem}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        )}
      </div>

      {lineItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No items added yet</p>
          {!readOnly && (
            <button
              type="button"
              onClick={addLineItem}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Add your first item
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Unit Price</th>
                {showCostPrice && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Cost</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">Discount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">Tax</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Total</th>
                {!readOnly && <th className="px-4 py-3 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item, index) => (
                <tr key={index} className="hover:bg-surface-secondary">
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="text-sm text-gray-900">{item.product_name || '-'}</span>
                    ) : (
                      <select
                        value={item.product_id}
                        onChange={(e) => updateLineItem(index, 'product_id', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {currencySymbol} {(product.selling_price || product.price || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="text-sm text-gray-900 text-right block">{item.quantity}</span>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {currencySymbol} {item.unit_price.toFixed(2)}
                  </td>
                  {showCostPrice && (
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {currencySymbol} {item.cost_price.toFixed(2)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.discount_percentage > 0 ? (
                      <span className="text-green-600">{item.discount_percentage}% off</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {currencySymbol} {item.tax_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {currencySymbol} {item.line_total.toFixed(2)}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface TotalsSummaryProps {
  totals: LineItemsTotals
  currencySymbol?: string
  showItemCount?: boolean
}

export function TotalsSummary({ totals, currencySymbol = 'R', showItemCount = true }: TotalsSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Summary
      </h3>
      <div className="space-y-3">
        {showItemCount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items</span>
            <span className="font-medium">{totals.item_count}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{currencySymbol} {totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Discount</span>
          <span className="font-medium text-red-600">- {currencySymbol} {totals.discount_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">{currencySymbol} {totals.tax_amount.toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-green-600">{currencySymbol} {totals.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
