/**
 * Enhanced Orders API with Inventory Integration
 * Adds transactional capabilities to order management
 */

const express = require('express');
const router = express.Router();
const orderService = require('../services/order.service');

/**
 * Update order status (with inventory handling)
 * POST /api/orders/:id/status
 */
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = orderService.updateOrderStatus(id, status, tenantId);

    if (result.success) {
      const order = orderService.getOrderWithDetails(id, tenantId);
      res.json({
        success: true,
        data: { order },
        message: `Order status updated to ${status}`
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * Get order stock availability
 * GET /api/orders/:id/stock-check
 */
router.get('/:id/stock-check', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const order = orderService.getOrderWithDetails(id, tenantId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check current stock for each item
    const Database = require('better-sqlite3');
    const path = require('path');
    const db = new Database(path.join(__dirname, '../../database/salessync.db'));

    const stockStatus = [];

    for (const item of order.items) {
      const stock = db.prepare(`
        SELECT 
          COALESCE(SUM(quantity_on_hand), 0) as total_stock,
          COALESCE(SUM(quantity_reserved), 0) as reserved_stock,
          COALESCE(SUM(quantity_on_hand - quantity_reserved), 0) as available_stock
        FROM inventory_stock
        WHERE product_id = ? AND tenant_id = ?
      `).get(item.product_id, tenantId);

      stockStatus.push({
        product_id: item.product_id,
        product_name: item.product_name,
        ordered_quantity: item.quantity,
        total_stock: stock.total_stock,
        reserved_stock: stock.reserved_stock,
        available_stock: stock.available_stock,
        can_fulfill: stock.available_stock >= item.quantity
      });
    }

    db.close();

    res.json({
      success: true,
      data: { stockStatus }
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
