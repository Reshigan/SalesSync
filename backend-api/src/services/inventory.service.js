/**
 * Inventory Service
 * Handles all inventory-related business logic and stock movements
 * Uses actual database schema: inventory_stock, stock_movements, warehouses
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');

class InventoryService {
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
   * Check if sufficient stock is available for an order
   * @param {Array} items - Order items with product_id and quantity
   * @param {string} tenantId - Tenant ID
   * @param {string} warehouseId - Warehouse ID (optional)
   * @returns {Object} - {success: boolean, insufficientItems: Array}
   */
  checkStockAvailability(items, tenantId, warehouseId = null) {
    const db = this.getDb();
    const insufficientItems = [];

    try {
      for (const item of items) {
        let stock;
        
        if (warehouseId) {
          // Check stock at specific warehouse
          stock = db.prepare(`
            SELECT SUM(quantity_on_hand - quantity_reserved) as available_quantity
            FROM inventory_stock
            WHERE product_id = ? AND tenant_id = ? AND warehouse_id = ?
          `).get(item.product_id, tenantId, warehouseId);
        } else {
          // Check total stock across all warehouses
          stock = db.prepare(`
            SELECT SUM(quantity_on_hand - quantity_reserved) as available_quantity
            FROM inventory_stock
            WHERE product_id = ? AND tenant_id = ?
          `).get(item.product_id, tenantId);
        }

        const availableQty = stock?.available_quantity || 0;
        
        if (availableQty < item.quantity) {
          // Get product details
          const product = db.prepare(`
            SELECT name, sku FROM products WHERE id = ? AND tenant_id = ?
          `).get(item.product_id, tenantId);
          
          insufficientItems.push({
            product_id: item.product_id,
            product_name: product?.name || 'Unknown',
            sku: product?.sku || '',
            requested: item.quantity,
            available: availableQty,
            short: item.quantity - availableQty
          });
        }
      }

      return {
        success: insufficientItems.length === 0,
        insufficientItems
      };
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  }

  /**
   * Reserve stock for an order (reduces available quantity)
   * @param {string} orderId - Order ID
   * @param {Array} items - Order items
   * @param {string} tenantId - Tenant ID
   * @param {string} locationId - Warehouse/location ID
   * @returns {boolean} - Success status
   */
  reserveStock(orderId, items, tenantId, locationId = null) {
    const db = this.getDb();

    try {
      // Start transaction
      db.prepare('BEGIN TRANSACTION').run();

      for (const item of items) {
        // Create stock reservation record
        const reservationId = `rsv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        db.prepare(`
          INSERT INTO inventory_reservations (id, order_id, product_id, quantity, tenant_id, location_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(reservationId, orderId, item.product_id, item.quantity, tenantId, locationId);

        // Reduce available stock (but don't remove from inventory yet)
        if (locationId) {
          db.prepare(`
            UPDATE inventory_stock
            SET reserved_quantity = COALESCE(reserved_quantity, 0) + ?
            WHERE product_id = ? AND tenant_id = ? AND location_id = ?
          `).run(item.quantity, item.product_id, tenantId, locationId);
        } else {
          // Reserve from first available location with sufficient stock
          db.prepare(`
            UPDATE inventory_stock
            SET reserved_quantity = COALESCE(reserved_quantity, 0) + ?
            WHERE product_id = ? AND tenant_id = ?
            AND (quantity - COALESCE(reserved_quantity, 0)) >= ?
            LIMIT 1
          `).run(item.quantity, item.product_id, tenantId, item.quantity);
        }
      }

      db.prepare('COMMIT').run();
      return true;
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error reserving stock:', error);
      throw error;
    }
  }

  /**
   * Commit stock reservation (actually deduct from inventory)
   * Called when order is confirmed/shipped
   * @param {string} orderId - Order ID
   * @param {string} tenantId - Tenant ID
   */
  commitStockReservation(orderId, tenantId) {
    const db = this.getDb();

    try {
      db.prepare('BEGIN TRANSACTION').run();

      // Get all reservations for this order
      const reservations = db.prepare(`
        SELECT * FROM inventory_reservations
        WHERE order_id = ? AND tenant_id = ? AND status = 'reserved'
      `).all(orderId, tenantId);

      for (const reservation of reservations) {
        // Deduct from actual inventory
        db.prepare(`
          UPDATE inventory_stock
          SET 
            quantity = quantity - ?,
            reserved_quantity = COALESCE(reserved_quantity, 0) - ?
          WHERE product_id = ? AND tenant_id = ?
          AND (location_id = ? OR ? IS NULL)
        `).run(
          reservation.quantity, 
          reservation.quantity, 
          reservation.product_id, 
          tenantId,
          reservation.location_id,
          reservation.location_id
        );

        // Create stock movement record
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO inventory_movements (
            id, product_id, location_id, movement_type, quantity, 
            reference_type, reference_id, tenant_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          movementId,
          reservation.product_id,
          reservation.location_id,
          'OUT',
          reservation.quantity,
          'ORDER',
          orderId,
          tenantId
        );

        // Mark reservation as committed
        db.prepare(`
          UPDATE inventory_reservations
          SET status = 'committed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reservation.id);
      }

      db.prepare('COMMIT').run();
      return true;
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error committing stock reservation:', error);
      throw error;
    }
  }

  /**
   * Release stock reservation (return to available stock)
   * Called when order is cancelled
   * @param {string} orderId - Order ID
   * @param {string} tenantId - Tenant ID
   */
  releaseStockReservation(orderId, tenantId) {
    const db = this.getDb();

    try {
      db.prepare('BEGIN TRANSACTION').run();

      // Get all active reservations for this order
      const reservations = db.prepare(`
        SELECT * FROM inventory_reservations
        WHERE order_id = ? AND tenant_id = ? AND status = 'reserved'
      `).all(orderId, tenantId);

      for (const reservation of reservations) {
        // Release reserved quantity
        db.prepare(`
          UPDATE inventory_stock
          SET reserved_quantity = COALESCE(reserved_quantity, 0) - ?
          WHERE product_id = ? AND tenant_id = ?
          AND (location_id = ? OR ? IS NULL)
        `).run(
          reservation.quantity,
          reservation.product_id,
          tenantId,
          reservation.location_id,
          reservation.location_id
        );

        // Mark reservation as released
        db.prepare(`
          UPDATE inventory_reservations
          SET status = 'released', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reservation.id);
      }

      db.prepare('COMMIT').run();
      return true;
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error releasing stock reservation:', error);
      throw error;
    }
  }

  /**
   * Get product stock levels
   * @param {string} productId - Product ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} - Stock levels by location
   */
  getProductStock(productId, tenantId) {
    const db = this.getDb();
    
    const stock = db.prepare(`
      SELECT 
        s.*,
        l.name as location_name,
        (s.quantity - COALESCE(s.reserved_quantity, 0)) as available_quantity
      FROM inventory_stock s
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.product_id = ? AND s.tenant_id = ?
      ORDER BY l.name
    `).all(productId, tenantId);

    return stock;
  }

  /**
   * Add stock (purchase, production, adjustment)
   * @param {Object} data - Stock data
   */
  addStock(data) {
    const db = this.getDb();
    const { product_id, location_id, quantity, cost_price, reference_type, reference_id, tenant_id, notes } = data;

    try {
      db.prepare('BEGIN TRANSACTION').run();

      // Check if stock record exists for this product/location
      const existingStock = db.prepare(`
        SELECT * FROM inventory_stock
        WHERE product_id = ? AND tenant_id = ? AND location_id = ?
      `).get(product_id, tenant_id, location_id);

      if (existingStock) {
        // Update existing stock
        db.prepare(`
          UPDATE inventory_stock
          SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP
          WHERE product_id = ? AND tenant_id = ? AND location_id = ?
        `).run(quantity, product_id, tenant_id, location_id);
      } else {
        // Create new stock record
        const stockId = `stk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO inventory_stock (
            id, product_id, location_id, quantity, reserved_quantity, tenant_id, created_at
          ) VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        `).run(stockId, product_id, location_id, quantity, tenant_id);
      }

      // Create movement record
      const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, location_id, movement_type, quantity, cost_price,
          reference_type, reference_id, notes, tenant_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        movementId,
        product_id,
        location_id,
        'IN',
        quantity,
        cost_price,
        reference_type,
        reference_id,
        notes,
        tenant_id
      );

      db.prepare('COMMIT').run();
      return { success: true, movementId };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  /**
   * Transfer stock between locations
   * @param {Object} data - Transfer data
   */
  transferStock(data) {
    const db = this.getDb();
    const { product_id, from_location_id, to_location_id, quantity, tenant_id, notes } = data;

    try {
      db.prepare('BEGIN TRANSACTION').run();

      // Check if sufficient stock available at source location
      const sourceStock = db.prepare(`
        SELECT quantity, reserved_quantity FROM inventory_stock
        WHERE product_id = ? AND tenant_id = ? AND location_id = ?
      `).get(product_id, tenant_id, from_location_id);

      const availableQty = (sourceStock?.quantity || 0) - (sourceStock?.reserved_quantity || 0);
      if (availableQty < quantity) {
        throw new Error(`Insufficient stock at source location. Available: ${availableQty}, Requested: ${quantity}`);
      }

      // Deduct from source
      db.prepare(`
        UPDATE inventory_stock
        SET quantity = quantity - ?, last_updated = CURRENT_TIMESTAMP
        WHERE product_id = ? AND tenant_id = ? AND location_id = ?
      `).run(quantity, product_id, tenant_id, from_location_id);

      // Add to destination
      const destStock = db.prepare(`
        SELECT * FROM inventory_stock
        WHERE product_id = ? AND tenant_id = ? AND location_id = ?
      `).get(product_id, tenant_id, to_location_id);

      if (destStock) {
        db.prepare(`
          UPDATE inventory_stock
          SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP
          WHERE product_id = ? AND tenant_id = ? AND location_id = ?
        `).run(quantity, product_id, tenant_id, to_location_id);
      } else {
        const stockId = `stk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO inventory_stock (
            id, product_id, location_id, quantity, reserved_quantity, tenant_id, created_at
          ) VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        `).run(stockId, product_id, to_location_id, quantity, tenant_id);
      }

      // Create movement records
      const transferId = `trf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // OUT from source
      const movementOutId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, location_id, movement_type, quantity,
          reference_type, reference_id, notes, tenant_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        movementOutId,
        product_id,
        from_location_id,
        'TRANSFER_OUT',
        quantity,
        'TRANSFER',
        transferId,
        notes,
        tenant_id
      );

      // IN to destination
      const movementInId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, location_id, movement_type, quantity,
          reference_type, reference_id, notes, tenant_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        movementInId,
        product_id,
        to_location_id,
        'TRANSFER_IN',
        quantity,
        'TRANSFER',
        transferId,
        notes,
        tenant_id
      );

      db.prepare('COMMIT').run();
      return { success: true, transferId };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error transferring stock:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
module.exports = new InventoryService();
