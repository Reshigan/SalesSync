import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '../../services/products.service';
import orderLinesService, { PricingQuote } from '../../services/orderLines.service';
import { formatCurrency } from '../../utils/currency';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

interface OrderLine {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  line_total: number;
}

interface OrderProductSelectorProps {
  customerId?: string;
  orderLines: OrderLine[];
  onChange: (lines: OrderLine[]) => void;
  readonly?: boolean;
}

export const OrderProductSelector: React.FC<OrderProductSelectorProps> = ({
  customerId,
  orderLines,
  onChange,
  readonly = false
}) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getProducts({ status: 'active' })
  });

  const products = productsData?.products || [];

  const handleAddProduct = async () => {
    if (!selectedProduct || quantity <= 0) return;

    setIsLoadingPrice(true);
    try {
      const quote = await orderLinesService.getPricingQuote({
        product_id: selectedProduct,
        customer_id: customerId,
        quantity
      });

      const product = products.find((p: any) => p.id === selectedProduct);
      
      const newLine: OrderLine = {
        product_id: selectedProduct,
        product_name: product?.name || '',
        quantity,
        unit_price: quote.data.unit_price,
        discount_percent: 0,
        tax_rate: quote.data.tax_rate,
        line_total: quote.data.total
      };

      onChange([...orderLines, newLine]);
      setSelectedProduct('');
      setQuantity(1);
    } catch (error) {
      console.error('Failed to get pricing:', error);
      const product = products.find((p: any) => p.id === selectedProduct);
      const unitPrice = product?.price || 0;
      const lineTotal = unitPrice * quantity;
      
      const newLine: OrderLine = {
        product_id: selectedProduct,
        product_name: product?.name || '',
        quantity,
        unit_price: unitPrice,
        discount_percent: 0,
        tax_rate: 0,
        line_total: lineTotal
      };

      onChange([...orderLines, newLine]);
      setSelectedProduct('');
      setQuantity(1);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const handleRemoveLine = (index: number) => {
    const newLines = orderLines.filter((_, i) => i !== index);
    onChange(newLines);
  };

  const handleUpdateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;

    const line = orderLines[index];
    setIsLoadingPrice(true);
    
    try {
      const quote = await orderLinesService.getPricingQuote({
        product_id: line.product_id,
        customer_id: customerId,
        quantity: newQuantity
      });

      const updatedLines = [...orderLines];
      updatedLines[index] = {
        ...line,
        quantity: newQuantity,
        unit_price: quote.data.unit_price,
        line_total: quote.data.total
      };
      
      onChange(updatedLines);
    } catch (error) {
      console.error('Failed to update pricing:', error);
      const updatedLines = [...orderLines];
      updatedLines[index] = {
        ...line,
        quantity: newQuantity,
        line_total: line.unit_price * newQuantity
      };
      onChange(updatedLines);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = orderLines.reduce((sum, line) => sum + (line.unit_price * line.quantity), 0);
    const tax = orderLines.reduce((sum, line) => {
      const lineSubtotal = line.unit_price * line.quantity;
      return sum + (lineSubtotal * (line.tax_rate / 100));
    }, 0);
    const total = orderLines.reduce((sum, line) => sum + line.line_total, 0);

    return { subtotal, tax, total };
  };

  const totals = calculateTotals();

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Product Section */}
      {!readonly && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add Product
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoadingPrice}
              >
                <option value="">Select a product...</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price || 0)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Qty"
                disabled={isLoadingPrice}
              />
              <button
                onClick={handleAddProduct}
                disabled={!selectedProduct || quantity <= 0 || isLoadingPrice}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoadingPrice ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Lines Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {orderLines.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products added</h3>
            <p className="mt-1 text-sm text-gray-500">
              {readonly ? 'This order has no products.' : 'Add products to this order using the form above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line Total
                  </th>
                  {!readonly && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderLines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{line.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {readonly ? (
                        <div className="text-sm text-gray-900">{line.quantity}</div>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          disabled={isLoadingPrice}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(line.unit_price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{line.tax_rate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(line.line_total)}</div>
                    </td>
                    {!readonly && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveLine(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={isLoadingPrice}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Totals Section */}
      {orderLines.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium text-gray-900">{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderProductSelector;
