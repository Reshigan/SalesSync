export interface BaseTransaction {
  id: string
  type: 'forward' | 'reverse'
  module: 'field_agents' | 'customers' | 'orders' | 'products' | 'inventory'
  reference_id?: string // ID of the original transaction being reversed
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed'
  amount: number
  currency: string
  description: string
  metadata: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
  completed_at?: string
  reversed_at?: string
  reversed_by?: string
  reversal_reason?: string
}

// Field Agent Transactions
export interface FieldAgentTransaction extends BaseTransaction {
  module: 'field_agents'
  agent_id: string
  customer_id?: string
  visit_id?: string
  transaction_data: {
    location?: {
      latitude: number
      longitude: number
      address: string
      accuracy: number
    }
    commission_rate?: number
    commission_amount?: number
    board_placement?: {
      board_id: string
      location: string
      placement_fee: number
    }
    product_distribution?: {
      products: {
        product_id: string
        quantity: number
        unit_price: number
        total: number
      }[]
    }
    collection?: {
      collection_type: 'payment' | 'returns' | 'equipment'
      items: any[]
    }
  }
}

// Customer Transactions
export interface CustomerTransaction extends BaseTransaction {
  module: 'customers'
  customer_id: string
  agent_id?: string
  transaction_data: {
    payment_method: 'cash' | 'card' | 'credit' | 'bank_transfer' | 'mobile_payment'
    payment_reference?: string
    invoice_number?: string
    due_date?: string
    discount_applied?: number
    tax_amount?: number
    items?: {
      product_id: string
      product_name: string
      quantity: number
      unit_price: number
      discount: number
      tax: number
      total: number
    }[]
  }
}

// Order Transactions
export interface OrderTransaction extends BaseTransaction {
  module: 'orders'
  order_id: string
  customer_id: string
  agent_id?: string
  transaction_data: {
    order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
    shipping_address: {
      street: string
      city: string
      state: string
      postal_code: string
      country: string
    }
    items: {
      product_id: string
      product_name: string
      sku: string
      quantity: number
      unit_price: number
      discount: number
      tax: number
      total: number
    }[]
    shipping_cost: number
    handling_fee: number
    total_discount: number
    total_tax: number
    grand_total: number
  }
}

// Product/Inventory Transactions
export interface ProductTransaction extends BaseTransaction {
  module: 'products'
  product_id: string
  warehouse_id?: string
  agent_id?: string
  transaction_data: {
    transaction_type: 'stock_in' | 'stock_out' | 'transfer' | 'adjustment' | 'damage' | 'expiry'
    quantity: number
    unit_cost: number
    batch_number?: string
    expiry_date?: string
    supplier_id?: string
    destination_warehouse?: string
    reason?: string
    quality_check?: {
      passed: boolean
      notes: string
      inspector: string
    }
  }
}

export type Transaction = FieldAgentTransaction | CustomerTransaction | OrderTransaction | ProductTransaction

export interface TransactionFilter {
  module?: string
  type?: 'forward' | 'reverse'
  status?: string
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  agent_id?: string
  customer_id?: string
  product_id?: string
  search?: string
}

export interface TransactionSummary {
  total_transactions: number
  total_amount: number
  forward_transactions: {
    count: number
    amount: number
  }
  reverse_transactions: {
    count: number
    amount: number
  }
  by_status: {
    [status: string]: {
      count: number
      amount: number
    }
  }
  by_module: {
    [module: string]: {
      count: number
      amount: number
    }
  }
}

export interface ReversalRequest {
  transaction_id: string
  reason: string
  partial_amount?: number
  notes?: string
  supporting_documents?: string[]
}

export interface TransactionAudit {
  id: string
  transaction_id: string
  action: 'created' | 'updated' | 'completed' | 'cancelled' | 'reversed'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  performed_by: string
  performed_at: string
  ip_address?: string
  user_agent?: string
  notes?: string
}