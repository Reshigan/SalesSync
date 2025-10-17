import { apiClient } from './api.service'
import { 
  Transaction, 
  FieldAgentTransaction, 
  CustomerTransaction, 
  OrderTransaction, 
  ProductTransaction,
  TransactionFilter,
  TransactionSummary,
  ReversalRequest,
  TransactionAudit
} from '../types/transaction.types'

class TransactionService {
  private baseUrl = '/api/v1/transactions'

  // Generic CRUD Operations
  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    try {
      const response = await apiClient.get(this.baseUrl, { params: filter })
      return response.data
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      return this.getMockTransactions(filter)
    }
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch transaction:', error)
      return null
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    try {
      const response = await apiClient.post(this.baseUrl, transaction)
      return response.data
    } catch (error) {
      console.error('Failed to create transaction:', error)
      throw error
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates)
      return response.data
    } catch (error) {
      console.error('Failed to update transaction:', error)
      throw error
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      throw error
    }
  }

  // Forward Transaction Operations
  async createForwardTransaction(transaction: Omit<Transaction, 'id' | 'type' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const forwardTransaction = {
      ...transaction,
      type: 'forward' as const
    }
    return this.createTransaction(forwardTransaction)
  }

  async processForwardTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/process`)
      return response.data
    } catch (error) {
      console.error('Failed to process forward transaction:', error)
      throw error
    }
  }

  async completeForwardTransaction(id: string, completionData?: any): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/complete`, completionData)
      return response.data
    } catch (error) {
      console.error('Failed to complete forward transaction:', error)
      throw error
    }
  }

  // Reverse Transaction Operations
  async createReverseTransaction(reversalRequest: ReversalRequest): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${reversalRequest.transaction_id}/reverse`, reversalRequest)
      return response.data
    } catch (error) {
      console.error('Failed to create reverse transaction:', error)
      throw error
    }
  }

  async processReverseTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/process-reversal`)
      return response.data
    } catch (error) {
      console.error('Failed to process reverse transaction:', error)
      throw error
    }
  }

  async approveReversal(id: string, approvalNotes?: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/approve-reversal`, { notes: approvalNotes })
      return response.data
    } catch (error) {
      console.error('Failed to approve reversal:', error)
      throw error
    }
  }

  async rejectReversal(id: string, rejectionReason: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/reject-reversal`, { reason: rejectionReason })
      return response.data
    } catch (error) {
      console.error('Failed to reject reversal:', error)
      throw error
    }
  }

  // Module-specific Operations
  
  // Field Agent Transactions
  async createFieldAgentTransaction(transaction: Omit<FieldAgentTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<FieldAgentTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/field-agents`, transaction)
      return response.data
    } catch (error) {
      console.error('Failed to create field agent transaction:', error)
      throw error
    }
  }

  async getFieldAgentTransactions(agentId: string, filter?: TransactionFilter): Promise<FieldAgentTransaction[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/field-agents/${agentId}`, { params: filter })
      return response.data
    } catch (error) {
      console.error('Failed to fetch field agent transactions:', error)
      return []
    }
  }

  async recordCommission(agentId: string, commissionData: any): Promise<FieldAgentTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/field-agents/${agentId}/commission`, commissionData)
      return response.data
    } catch (error) {
      console.error('Failed to record commission:', error)
      throw error
    }
  }

  async recordBoardPlacement(agentId: string, placementData: any): Promise<FieldAgentTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/field-agents/${agentId}/board-placement`, placementData)
      return response.data
    } catch (error) {
      console.error('Failed to record board placement:', error)
      throw error
    }
  }

  // Customer Transactions
  async createCustomerTransaction(transaction: Omit<CustomerTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customers`, transaction)
      return response.data
    } catch (error) {
      console.error('Failed to create customer transaction:', error)
      throw error
    }
  }

  async getCustomerTransactions(customerId: string, filter?: TransactionFilter): Promise<CustomerTransaction[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/customers/${customerId}`, { params: filter })
      return response.data
    } catch (error) {
      console.error('Failed to fetch customer transactions:', error)
      return []
    }
  }

  async processPayment(customerId: string, paymentData: any): Promise<CustomerTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customers/${customerId}/payment`, paymentData)
      return response.data
    } catch (error) {
      console.error('Failed to process payment:', error)
      throw error
    }
  }

  async processRefund(transactionId: string, refundData: any): Promise<CustomerTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customers/${transactionId}/refund`, refundData)
      return response.data
    } catch (error) {
      console.error('Failed to process refund:', error)
      throw error
    }
  }

  // Order Transactions
  async createOrderTransaction(transaction: Omit<OrderTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<OrderTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/orders`, transaction)
      return response.data
    } catch (error) {
      console.error('Failed to create order transaction:', error)
      throw error
    }
  }

  async getOrderTransactions(orderId: string, filter?: TransactionFilter): Promise<OrderTransaction[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/${orderId}`, { params: filter })
      return response.data
    } catch (error) {
      console.error('Failed to fetch order transactions:', error)
      return []
    }
  }

  async processOrderPayment(orderId: string, paymentData: any): Promise<OrderTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/orders/${orderId}/payment`, paymentData)
      return response.data
    } catch (error) {
      console.error('Failed to process order payment:', error)
      throw error
    }
  }

  async cancelOrder(orderId: string, cancellationReason: string): Promise<OrderTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/orders/${orderId}/cancel`, { reason: cancellationReason })
      return response.data
    } catch (error) {
      console.error('Failed to cancel order:', error)
      throw error
    }
  }

  // Product/Inventory Transactions
  async createProductTransaction(transaction: Omit<ProductTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<ProductTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/products`, transaction)
      return response.data
    } catch (error) {
      console.error('Failed to create product transaction:', error)
      throw error
    }
  }

  async getProductTransactions(productId: string, filter?: TransactionFilter): Promise<ProductTransaction[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/products/${productId}`, { params: filter })
      return response.data
    } catch (error) {
      console.error('Failed to fetch product transactions:', error)
      return []
    }
  }

  async recordStockMovement(productId: string, movementData: any): Promise<ProductTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/products/${productId}/stock-movement`, movementData)
      return response.data
    } catch (error) {
      console.error('Failed to record stock movement:', error)
      throw error
    }
  }

  async adjustInventory(productId: string, adjustmentData: any): Promise<ProductTransaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/products/${productId}/adjustment`, adjustmentData)
      return response.data
    } catch (error) {
      console.error('Failed to adjust inventory:', error)
      throw error
    }
  }

  // Analytics and Reporting
  async getTransactionSummary(filter?: TransactionFilter): Promise<TransactionSummary> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/summary`, { params: filter })
      return response.data
    } catch (error) {
      console.error('Failed to fetch transaction summary:', error)
      return {
        total_transactions: 0,
        total_amount: 0,
        forward_transactions: { count: 0, amount: 0 },
        reverse_transactions: { count: 0, amount: 0 },
        by_status: {},
        by_module: {}
      }
    }
  }

  async getTransactionAudit(transactionId: string): Promise<TransactionAudit[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${transactionId}/audit`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch transaction audit:', error)
      return []
    }
  }

  async exportTransactions(filter?: TransactionFilter, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export`, {
        params: { ...filter, format },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Failed to export transactions:', error)
      throw error
    }
  }

  // Batch Operations
  async batchCreateTransactions(transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]): Promise<Transaction[]> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/batch`, { transactions })
      return response.data
    } catch (error) {
      console.error('Failed to batch create transactions:', error)
      throw error
    }
  }

  async batchUpdateTransactions(updates: { id: string; updates: Partial<Transaction> }[]): Promise<Transaction[]> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/batch`, { updates })
      return response.data
    } catch (error) {
      console.error('Failed to batch update transactions:', error)
      throw error
    }
  }

  async batchReverseTransactions(reversalRequests: ReversalRequest[]): Promise<Transaction[]> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/batch-reverse`, { reversals: reversalRequests })
      return response.data
    } catch (error) {
      console.error('Failed to batch reverse transactions:', error)
      throw error
    }
  }

  // Mock data for development
  private getMockTransactions(filter?: TransactionFilter): Transaction[] {
    const mockTransactions: Transaction[] = [
      {
        id: 'txn_001',
        type: 'forward',
        module: 'field_agents',
        status: 'completed',
        amount: 150.00,
        currency: 'GBP',
        description: 'Commission payment for board placement',
        metadata: { board_id: 'board_001', location: 'High Street, London' },
        created_by: 'agent_001',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        completed_at: '2024-01-15T10:30:00Z',
        agent_id: 'agent_001',
        transaction_data: {
          commission_rate: 0.15,
          commission_amount: 150.00,
          board_placement: {
            board_id: 'board_001',
            location: 'High Street, London',
            placement_fee: 1000.00
          }
        }
      } as FieldAgentTransaction,
      {
        id: 'txn_002',
        type: 'reverse',
        module: 'customers',
        reference_id: 'txn_001',
        status: 'pending',
        amount: -75.00,
        currency: 'GBP',
        description: 'Partial refund for damaged goods',
        metadata: { refund_reason: 'Product damaged during delivery' },
        created_by: 'admin_001',
        created_at: '2024-01-15T14:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
        reversal_reason: 'Product damaged during delivery',
        customer_id: 'cust_001',
        transaction_data: {
          payment_method: 'card',
          payment_reference: 'ref_12345',
          invoice_number: 'INV-001',
          items: [
            {
              product_id: 'prod_001',
              product_name: 'Premium Widget',
              quantity: 1,
              unit_price: 75.00,
              discount: 0,
              tax: 0,
              total: 75.00
            }
          ]
        }
      } as CustomerTransaction
    ]

    if (filter) {
      return mockTransactions.filter(txn => {
        if (filter.module && txn.module !== filter.module) return false
        if (filter.type && txn.type !== filter.type) return false
        if (filter.status && txn.status !== filter.status) return false
        return true
      })
    }

    return mockTransactions
  }
}

export const transactionService = new TransactionService()