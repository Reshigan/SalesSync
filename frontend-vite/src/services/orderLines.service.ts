import api from './api';

export interface OrderLine {
  id: string;
  tenant_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  notes?: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingQuote {
  product_id: string;
  product_name: string;
  product_sku: string;
  unit: string;
  quantity: number;
  unit_price: number;
  price_source: 'standard' | 'price_list';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

class OrderLinesService {
  async getOrderLines(orderId?: string) {
    const response = await api.get('/order-lines', {
      params: orderId ? { order_id: orderId } : undefined
    });
    return response.data;
  }

  async getOrderLine(id: string) {
    const response = await api.get(`/order-lines/${id}`);
    return response.data;
  }

  async createOrderLine(data: {
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price?: number;
    discount_percent?: number;
    tax_rate?: number;
    notes?: string;
  }) {
    const response = await api.post('/order-lines', data);
    return response.data;
  }

  async updateOrderLine(id: string, data: {
    quantity?: number;
    unit_price?: number;
    discount_percent?: number;
    tax_rate?: number;
    notes?: string;
  }) {
    const response = await api.put(`/order-lines/${id}`, data);
    return response.data;
  }

  async deleteOrderLine(id: string) {
    const response = await api.delete(`/order-lines/${id}`);
    return response.data;
  }

  async getPricingQuote(params: {
    product_id: string;
    customer_id?: string;
    quantity?: number;
  }): Promise<{ data: PricingQuote }> {
    const response = await api.get('/pricing/quote', { params });
    return response.data;
  }

  async getBulkPricingQuote(data: {
    customer_id?: string;
    items: Array<{ product_id: string; quantity: number }>;
  }) {
    const response = await api.post('/pricing/bulk-quote', data);
    return response.data;
  }
}

export default new OrderLinesService();
