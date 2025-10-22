/**
 * Order Service
 * Handles order processing with inventory integration
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');

class OrderService {
  constructor() {
    this.db = null;
  }

  getDb() {
    if (!this.db) {
      this.db = new Database(dbPath);
      this.db.pragma('foreign_keys = ON');
    }
    return this.db;
  }

  /**
   * Create order with inventory reservation
   * @param {Object} orderData - Order data
   * @param {Array} items - Order items
   * @param {string} userId - User creating the order
   * @returns {Object} Created order
   */
  async createOrder(orderData, items, userId) {
    const db = this.getDb();
    
    try {
      // Start transaction
      db.prepare('BEGIN TRANSACTION').run();

      // Get main warehouse
      const warehouse = db.prepare(`
        SELECT id FROM warehouses WHERE tenant_id = ? LIMIT 1
      `).get(orderData.tenant_id);

      if (!warehouse) {
        throw new Error('No warehouse found for tenant');
      }

      // Check stock availability
      const insufficientItems = [];
      for (const item of items) {
        const stock = db.prepare(`
          SELECT 
            COALESCE(SUM(quantity_on_hand - quantity_reserved), 0) as available
          FROM inventory_stock
          WHERE product_id = ? AND tenant_id = ?
        `).get(item.product_id, orderData.tenant_id);

        if (stock.available < item.quantity) {
          const product = db.prepare(`
            SELECT name FROM products WHERE id = ?
          `).get(item.product_id);
          
          insufficientItems.push({
            product: product?.name || 'Unknown',
            requested: item.quantity,
            available: stock.available
          });
        }
      }

      if (insufficientItems.length > 0) {
        db.prepare('ROLLBACK').run();
        return {
          success: false,
          error: 'Insufficient stock',
          insufficientItems
        };
      }

      // Generate order number
      const orderCount = db.prepare(`
        SELECT COUNT(*) as count FROM orders 
        WHERE tenant_id = ? AND DATE(created_at) = DATE('now')
      `).get(orderData.tenant_id);
      
      const orderNumber = `ORD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(orderCount.count + 1).padStart(4, '0')}`;

      // Insert order
      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO orders (
          id, tenant_id, order_number, customer_id, salesman_id,
          order_date, delivery_date, subtotal, tax_amount, discount_amount,
          total_amount, payment_method, payment_status, order_status, notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        orderId,
        orderData.tenant_id,
        orderNumber,
        orderData.customer_id,
        orderData.salesman_id,
        orderData.order_date,
        orderData.delivery_date,
        orderData.subtotal,
        orderData.tax_amount,
        orderData.discount_amount,
        orderData.total_amount,
        orderData.payment_method,
        'pending',
        'pending',
        orderData.notes
      );

      // Insert order items and reserve stock
      for (const item of items) {
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert order item
        db.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, quantity, unit_price,
            discount_percentage, tax_percentage, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          itemId,
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.discount_percentage || 0,
          item.tax_percentage || 0,
          item.line_total
        );

        // Reserve stock
        db.prepare(`
          UPDATE inventory_stock
          SET quantity_reserved = quantity_reserved + ?
          WHERE product_id = ? AND tenant_id = ?
          AND (quantity_on_hand - quantity_reserved) >= ?
          LIMIT 1
        `).run(item.quantity, item.product_id, orderData.tenant_id, item.quantity);
      }

      db.prepare('COMMIT').run();

      // Get complete order
      const order = this.getOrderWithDetails(orderId, orderData.tenant_id);
      
      return {
        success: true,
        order
      };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Update order status with inventory handling
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} tenantId - Tenant ID
   */
  updateOrderStatus(orderId, newStatus, tenantId) {
    const db = this.getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const order = db.prepare(`
        SELECT * FROM orders WHERE id = ? AND tenant_id = ?
      `).get(orderId, tenantId);

      if (!order) {
        throw new Error('Order not found');
      }

      const oldStatus = order.order_status;

      // Handle inventory based on status change
      if (oldStatus !== 'shipped' && newStatus === 'shipped') {
        // Commit stock reservation (deduct from inventory)
        this.commitStock(orderId, tenantId);
      } else if ((oldStatus === 'pending' || oldStatus === 'confirmed') && newStatus === 'cancelled') {
        // Release stock reservation
        this.releaseStock(orderId, tenantId);
      }

      // Update order status
      db.prepare(`
        UPDATE orders
        SET order_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
      `).run(newStatus, orderId, tenantId);

      db.prepare('COMMIT').run();

      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Commit stock (deduct from inventory on ship)
   */
  commitStock(orderId, tenantId) {
    const db = this.getDb();

    // Get order items
    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(orderId);

    for (const item of items) {
      // Deduct from inventory
      db.prepare(`
        UPDATE inventory_stock
        SET 
          quantity_on_hand = quantity_on_hand - ?,
          quantity_reserved = quantity_reserved - ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND tenant_id = ?
        AND quantity_reserved >= ?
        LIMIT 1
      `).run(item.quantity, item.quantity, item.product_id, tenantId, item.quantity);

      // Create stock movement record
      const refNumber = `MOV-${orderId}-${Date.now()}`;
      db.prepare(`
        INSERT INTO stock_movements (
          tenant_id, reference_number, product_id, from_warehouse_id,
          quantity, movement_type, movement_date, reason,
          status, created_by, created_at
        )
        SELECT 
          ?, ?, ?, warehouse_id, ?, 'sale', DATE('now'), 'Order shipped', 'completed', ?, CURRENT_TIMESTAMP
        FROM inventory_stock
        WHERE product_id = ? AND tenant_id = ?
        LIMIT 1
      `).run(tenantId, refNumber, item.product_id, item.quantity, 'system', item.product_id, tenantId);
    }
  }

  /**
   * Release stock (return to available on cancel)
   */
  releaseStock(orderId, tenantId) {
    const db = this.getDb();

    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(orderId);

    for (const item of items) {
      db.prepare(`
        UPDATE inventory_stock
        SET 
          quantity_reserved = quantity_reserved - ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ? AND tenant_id = ?
        AND quantity_reserved >= ?
        LIMIT 1
      `).run(item.quantity, item.product_id, tenantId, item.quantity);
    }
  }

  /**
   * Get order with full details
   */
  getOrderWithDetails(orderId, tenantId) {
    const db = this.getDb();

    const order = db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        a.name as salesman_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN agents a ON o.salesman_id = a.id
      WHERE o.id = ? AND o.tenant_id = ?
    `).get(orderId, tenantId);

    if (!order) return null;

    const items = db.prepare(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    order.items = items;

    return order;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = new OrderService();
