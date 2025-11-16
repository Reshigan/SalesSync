import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, Edit } from 'lucide-react'
import { formatCurrency } from '../../../utils/currency'

export default function InvoiceItemList() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  const { data: invoice } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => ({
      id: invoiceId,
      invoice_number: 'INV-2024-001',
      customer_name: 'ABC Store',
    }),
  })

  const { data: items, isLoading } = useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: async () => [
      {
        id: '1',
        product_name: 'Coca-Cola 500ml',
        product_sku: 'CC-500',
        quantity: 100,
        unit_price: 15.00,
        discount_percent: 5,
        tax_amount: 213.75,
        total: 1638.75,
      },
      {
        id: '2',
        product_name: 'Pepsi 500ml',
        product_sku: 'PP-500',
        quantity: 50,
        unit_price: 14.00,
        discount_percent: 0,
        tax_amount: 105.00,
        total: 805.00,
      },
    ],
  })

  if (isLoading) {
    return <div className="p-6">Loading invoice items...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/finance/invoices/${invoiceId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Invoice
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Invoice Items</h1>
        <p className="text-gray-600">{invoice?.invoice_number} - {invoice?.customer_name}</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.product_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.product_sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.discount_percent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(item.tax_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(item.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/finance/invoices/${invoiceId}/items/${item.id}`)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/finance/invoices/${invoiceId}/items/${item.id}/edit`)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
