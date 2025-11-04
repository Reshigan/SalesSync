const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/search
 * @desc    Global search across customers, stores, products, visits, orders
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: []
      });
    }

    const searchTerm = `%${q.trim()}%`;
    const maxLimit = Math.min(parseInt(limit), 50);
    const results = [];

    // Search types: customer, store, product, visit, order, material
    const searchTypes = type ? [type] : ['customer', 'store', 'product', 'visit'];

    // Search Customers
    if (searchTypes.includes('customer')) {
      const customers = await db.all(
        `SELECT id, name, phone, address, customer_code
         FROM customers
         WHERE (name LIKE ? OR phone LIKE ? OR customer_code LIKE ?)
         AND tenant_id = ?
         LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, req.tenantId, maxLimit]
      );

      customers.forEach(customer => {
        results.push({
          id: `customer-${customer.id}`,
          type: 'customer',
          title: customer.name,
          subtitle: customer.phone || customer.customer_code,
          description: customer.address,
          path: `/customers/${customer.id}`
        });
      });
    }

    // Search Stores (similar to customers)
    if (searchTypes.includes('store')) {
      const stores = await db.all(
        `SELECT id, name, phone, address, store_code
         FROM customers
         WHERE (name LIKE ? OR phone LIKE ? OR store_code LIKE ?)
         AND tenant_id = ?
         LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, req.tenantId, maxLimit]
      );

      stores.forEach(store => {
        results.push({
          id: `store-${store.id}`,
          type: 'store',
          title: store.name,
          subtitle: store.phone || store.store_code,
          description: store.address,
          path: `/stores/${store.id}`
        });
      });
    }

    // Search Products
    if (searchTypes.includes('product')) {
      const products = await db.all(
        `SELECT id, name, sku, barcode, category
         FROM products
         WHERE (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)
         AND tenant_id = ?
         LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, req.tenantId, maxLimit]
      );

      products.forEach(product => {
        results.push({
          id: `product-${product.id}`,
          type: 'product',
          title: product.name,
          subtitle: product.sku || product.barcode,
          description: product.category,
          path: `/products/${product.id}`
        });
      });
    }

    // Search Visits (Field Marketing)
    if (searchTypes.includes('visit')) {
      const visits = await db.all(
        `SELECT fmv.id, fmv.visit_date, fmv.visit_status, c.name as customer_name, u.name as agent_name
         FROM field_marketing_visits fmv
         JOIN customers c ON fmv.customer_id = c.id
         JOIN users u ON fmv.agent_id = u.id
         WHERE (c.name LIKE ? OR u.name LIKE ?)
         AND fmv.tenant_id = ?
         LIMIT ?`,
        [searchTerm, searchTerm, req.tenantId, maxLimit]
      );

      visits.forEach(visit => {
        results.push({
          id: `visit-${visit.id}`,
          type: 'visit',
          title: `Visit to ${visit.customer_name}`,
          subtitle: `${visit.visit_date} - ${visit.visit_status}`,
          description: `Agent: ${visit.agent_name}`,
          path: `/field-marketing/visits/${visit.id}`
        });
      });
    }

    // Search Orders
    if (searchTypes.includes('order')) {
      const orders = await db.all(
        `SELECT o.id, o.order_number, o.order_date, o.total_amount, c.name as customer_name
         FROM orders o
         JOIN customers c ON o.customer_id = c.id
         WHERE (o.order_number LIKE ? OR c.name LIKE ?)
         AND o.tenant_id = ?
         LIMIT ?`,
        [searchTerm, searchTerm, req.tenantId, maxLimit]
      );

      orders.forEach(order => {
        results.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Order ${order.order_number}`,
          subtitle: `${order.customer_name} - ₹${order.total_amount}`,
          description: order.order_date,
          path: `/orders/${order.id}`
        });
      });
    }

    // Sort results by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === q.toLowerCase();
      const bExact = b.title.toLowerCase() === q.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    res.json({
      success: true,
      results: results.slice(0, maxLimit),
      count: results.length
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

module.exports = router;
