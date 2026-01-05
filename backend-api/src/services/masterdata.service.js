/**
 * Master Data Governance Service
 * Provides validation, lifecycle management, and governance for all master data entities
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const settingsService = require('./settings.service');
const crypto = require('crypto');

// ============================================
// PRODUCT GOVERNANCE
// ============================================

/**
 * Validate product data before create/update
 */
async function validateProduct(tenantId, productData, existingProductId = null) {
  const errors = [];
  const warnings = [];
  
  // SKU validation
  const skuValidation = await settingsService.validateProductSKU(tenantId, productData.code, existingProductId);
  if (!skuValidation.valid) {
    errors.push(skuValidation.reason);
  }
  
  // Category requirement
  const requireCategory = await settingsService.getSetting(tenantId, 'product.require_category', true);
  if (requireCategory && !productData.category_id) {
    errors.push('Category is required');
  }
  
  // Validate category exists
  if (productData.category_id) {
    const category = await getOneQuery(
      'SELECT id, status FROM categories WHERE id = ? AND tenant_id = ?',
      [productData.category_id, tenantId]
    );
    if (!category) {
      errors.push('Category not found');
    } else if (category.status !== 'active') {
      warnings.push('Selected category is inactive');
    }
  }
  
  // Validate brand exists
  if (productData.brand_id) {
    const brand = await getOneQuery(
      'SELECT id, status FROM brands WHERE id = ? AND tenant_id = ?',
      [productData.brand_id, tenantId]
    );
    if (!brand) {
      errors.push('Brand not found');
    } else if (brand.status !== 'active') {
      warnings.push('Selected brand is inactive');
    }
  }
  
  // Price validation
  const allowBelowCost = await settingsService.getSetting(tenantId, 'pricing.allow_below_cost', false);
  if (!allowBelowCost && productData.selling_price && productData.cost_price) {
    if (parseFloat(productData.selling_price) < parseFloat(productData.cost_price)) {
      errors.push('Selling price cannot be below cost price');
    }
  }
  
  // Barcode uniqueness
  if (productData.barcode) {
    let barcodeQuery = 'SELECT id FROM products WHERE tenant_id = ? AND barcode = ?';
    const params = [tenantId, productData.barcode];
    if (existingProductId) {
      barcodeQuery += ' AND id != ?';
      params.push(existingProductId);
    }
    const existingBarcode = await getOneQuery(barcodeQuery, params);
    if (existingBarcode) {
      errors.push(`Barcode '${productData.barcode}' already exists`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if product can be deactivated (no pending orders, etc.)
 */
async function canDeactivateProduct(tenantId, productId) {
  // Check for pending orders
  const pendingOrders = await getOneQuery(`
    SELECT COUNT(*) as count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = ? AND o.tenant_id = ? AND o.status IN ('pending', 'processing', 'confirmed')
  `, [productId, tenantId]);
  
  if (pendingOrders && pendingOrders.count > 0) {
    return {
      canDeactivate: false,
      reason: `Product has ${pendingOrders.count} pending orders`
    };
  }
  
  // Check for reserved inventory
  const reservedStock = await getOneQuery(`
    SELECT COALESCE(SUM(quantity_reserved), 0) as reserved
    FROM inventory_stock
    WHERE product_id = ? AND tenant_id = ?
  `, [productId, tenantId]);
  
  if (reservedStock && reservedStock.reserved > 0) {
    return {
      canDeactivate: false,
      reason: `Product has ${reservedStock.reserved} units reserved`
    };
  }
  
  return { canDeactivate: true };
}

/**
 * Get product lifecycle status
 */
async function getProductLifecycle(tenantId, productId) {
  const product = await getOneQuery(`
    SELECT p.*, 
           COALESCE(SUM(i.quantity_on_hand), 0) as total_stock,
           COALESCE(SUM(i.quantity_reserved), 0) as reserved_stock,
           (SELECT COUNT(*) FROM order_items oi JOIN orders o ON oi.order_id = o.id 
            WHERE oi.product_id = p.id AND o.tenant_id = p.tenant_id) as total_orders,
           (SELECT MAX(o.created_at) FROM order_items oi JOIN orders o ON oi.order_id = o.id 
            WHERE oi.product_id = p.id AND o.tenant_id = p.tenant_id) as last_ordered
    FROM products p
    LEFT JOIN inventory_stock i ON p.id = i.product_id
    WHERE p.id = ? AND p.tenant_id = ?
    GROUP BY p.id
  `, [productId, tenantId]);
  
  if (!product) {
    return null;
  }
  
  const lowStockThreshold = await settingsService.getSetting(tenantId, 'product.low_stock_threshold', 10);
  
  return {
    ...product,
    lifecycle: {
      isLowStock: product.total_stock <= lowStockThreshold && product.total_stock > 0,
      isOutOfStock: product.total_stock === 0,
      hasReservedStock: product.reserved_stock > 0,
      availableStock: product.total_stock - product.reserved_stock,
      daysSinceLastOrder: product.last_ordered 
        ? Math.floor((Date.now() - new Date(product.last_ordered).getTime()) / (1000 * 60 * 60 * 24))
        : null
    }
  };
}

// ============================================
// CUSTOMER GOVERNANCE
// ============================================

/**
 * Validate customer data before create/update
 */
async function validateCustomer(tenantId, customerData, existingCustomerId = null) {
  const errors = [];
  const warnings = [];
  
  // Required fields
  if (!customerData.name || customerData.name.trim().length < 2) {
    errors.push('Customer name is required (minimum 2 characters)');
  }
  
  // Duplicate check
  const duplicateCheck = await settingsService.checkDuplicateCustomer(tenantId, customerData);
  if (duplicateCheck.isDuplicate && (!existingCustomerId || duplicateCheck.existingCustomer.id !== existingCustomerId)) {
    errors.push(`Potential duplicate customer found: ${duplicateCheck.existingCustomer.name} (matched on: ${duplicateCheck.matchedFields.join(', ')})`);
  }
  
  // Email format validation
  if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
    errors.push('Invalid email format');
  }
  
  // Phone format validation (basic)
  if (customerData.phone && !/^[\d\s\-+()]{7,20}$/.test(customerData.phone)) {
    warnings.push('Phone number format may be invalid');
  }
  
  // Credit limit validation
  const maxCreditLimit = await settingsService.getSetting(tenantId, 'order.max_credit_limit', 50000);
  if (customerData.credit_limit && parseFloat(customerData.credit_limit) > maxCreditLimit) {
    warnings.push(`Credit limit exceeds maximum allowed (${maxCreditLimit})`);
  }
  
  // Territory validation
  if (customerData.territory_id) {
    const territory = await getOneQuery(
      'SELECT id FROM territories WHERE id = ? AND tenant_id = ?',
      [customerData.territory_id, tenantId]
    );
    if (!territory) {
      errors.push('Territory not found');
    }
  }
  
  // Route validation
  if (customerData.route_id) {
    const route = await getOneQuery(
      'SELECT id FROM routes WHERE id = ? AND tenant_id = ?',
      [customerData.route_id, tenantId]
    );
    if (!route) {
      errors.push('Route not found');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check customer credit before order
 */
async function checkCustomerCreditForOrder(tenantId, customerId, orderAmount) {
  return await settingsService.checkCustomerCredit(tenantId, customerId, orderAmount);
}

/**
 * Get customer health score
 */
async function getCustomerHealthScore(tenantId, customerId) {
  const customer = await getOneQuery(`
    SELECT c.*,
           (SELECT COUNT(*) FROM orders WHERE customer_id = c.id AND tenant_id = c.tenant_id) as total_orders,
           (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.id AND tenant_id = c.tenant_id AND status = 'completed') as total_revenue,
           (SELECT MAX(created_at) FROM orders WHERE customer_id = c.id AND tenant_id = c.tenant_id) as last_order_date,
           (SELECT COUNT(*) FROM visits WHERE customer_id = c.id AND tenant_id = c.tenant_id) as total_visits,
           (SELECT MAX(visit_date) FROM visits WHERE customer_id = c.id AND tenant_id = c.tenant_id) as last_visit_date
    FROM customers c
    WHERE c.id = ? AND c.tenant_id = ?
  `, [customerId, tenantId]);
  
  if (!customer) {
    return null;
  }
  
  // Calculate health score (0-100)
  let score = 50; // Base score
  
  // Order frequency bonus
  if (customer.total_orders > 10) score += 15;
  else if (customer.total_orders > 5) score += 10;
  else if (customer.total_orders > 0) score += 5;
  
  // Recent activity bonus
  const daysSinceLastOrder = customer.last_order_date 
    ? Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceLastOrder < 7) score += 15;
  else if (daysSinceLastOrder < 30) score += 10;
  else if (daysSinceLastOrder < 90) score += 5;
  else if (daysSinceLastOrder > 180) score -= 15;
  
  // Payment history (if outstanding balance is low relative to credit limit)
  const creditUtilization = customer.credit_limit > 0 
    ? (customer.outstanding_balance || 0) / customer.credit_limit 
    : 0;
  
  if (creditUtilization < 0.3) score += 10;
  else if (creditUtilization > 0.8) score -= 10;
  else if (creditUtilization > 0.95) score -= 20;
  
  // Visit engagement
  if (customer.total_visits > 20) score += 10;
  else if (customer.total_visits > 10) score += 5;
  
  return {
    customer,
    healthScore: Math.max(0, Math.min(100, score)),
    metrics: {
      totalOrders: customer.total_orders || 0,
      totalRevenue: customer.total_revenue || 0,
      daysSinceLastOrder,
      creditUtilization: Math.round(creditUtilization * 100),
      totalVisits: customer.total_visits || 0
    }
  };
}

// ============================================
// TERRITORY GOVERNANCE
// ============================================

/**
 * Validate territory assignment
 */
async function validateTerritoryAssignment(tenantId, agentId, territoryId, effectiveDate = null) {
  const errors = [];
  const warnings = [];
  
  // Check agent exists
  const agent = await getOneQuery(
    'SELECT id, status FROM users WHERE id = ? AND tenant_id = ?',
    [agentId, tenantId]
  );
  if (!agent) {
    errors.push('Agent not found');
  } else if (agent.status !== 'active') {
    warnings.push('Agent is not active');
  }
  
  // Check territory exists
  const territory = await getOneQuery(
    'SELECT id, status FROM territories WHERE id = ? AND tenant_id = ?',
    [territoryId, tenantId]
  );
  if (!territory) {
    errors.push('Territory not found');
  }
  
  // Check for existing assignment
  const existingAssignment = await getOneQuery(`
    SELECT ta.*, u.first_name, u.last_name
    FROM territory_assignments ta
    JOIN users u ON ta.agent_id = u.id
    WHERE ta.territory_id = ? AND ta.tenant_id = ? AND ta.status = 'active'
    AND (ta.end_date IS NULL OR ta.end_date > ?)
  `, [territoryId, tenantId, effectiveDate || new Date().toISOString()]);
  
  if (existingAssignment && existingAssignment.agent_id !== agentId) {
    warnings.push(`Territory is currently assigned to ${existingAssignment.first_name} ${existingAssignment.last_name}`);
  }
  
  // Check agent's current territory load
  const agentTerritories = await getOneQuery(`
    SELECT COUNT(*) as count
    FROM territory_assignments
    WHERE agent_id = ? AND tenant_id = ? AND status = 'active'
    AND (end_date IS NULL OR end_date > ?)
  `, [agentId, tenantId, new Date().toISOString()]);
  
  if (agentTerritories && agentTerritories.count >= 5) {
    warnings.push(`Agent already has ${agentTerritories.count} active territory assignments`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get territory coverage report
 */
async function getTerritoryReport(tenantId, territoryId) {
  const territory = await getOneQuery(`
    SELECT t.*,
           (SELECT COUNT(*) FROM customers WHERE territory_id = t.id AND tenant_id = t.tenant_id) as customer_count,
           (SELECT COUNT(*) FROM customers WHERE territory_id = t.id AND tenant_id = t.tenant_id AND status = 'active') as active_customers,
           (SELECT SUM(o.total_amount) FROM orders o JOIN customers c ON o.customer_id = c.id 
            WHERE c.territory_id = t.id AND o.tenant_id = t.tenant_id AND o.status = 'completed') as total_revenue
    FROM territories t
    WHERE t.id = ? AND t.tenant_id = ?
  `, [territoryId, tenantId]);
  
  if (!territory) {
    return null;
  }
  
  // Get assigned agents
  const agents = await getQuery(`
    SELECT u.id, u.first_name, u.last_name, u.email, ta.start_date, ta.end_date
    FROM territory_assignments ta
    JOIN users u ON ta.agent_id = u.id
    WHERE ta.territory_id = ? AND ta.tenant_id = ? AND ta.status = 'active'
    ORDER BY ta.start_date DESC
  `, [territoryId, tenantId]);
  
  return {
    territory,
    agents: agents || [],
    metrics: {
      customerCount: territory.customer_count || 0,
      activeCustomers: territory.active_customers || 0,
      totalRevenue: territory.total_revenue || 0,
      coverageRate: territory.customer_count > 0 
        ? Math.round((territory.active_customers / territory.customer_count) * 100) 
        : 0
    }
  };
}

// ============================================
// PRICING GOVERNANCE
// ============================================

/**
 * Validate price change
 */
async function validatePriceChange(tenantId, productId, newPrice, priceListId = null) {
  const errors = [];
  const warnings = [];
  
  // Get current price
  const product = await getOneQuery(
    'SELECT id, selling_price, cost_price FROM products WHERE id = ? AND tenant_id = ?',
    [productId, tenantId]
  );
  
  if (!product) {
    errors.push('Product not found');
    return { valid: false, errors, warnings };
  }
  
  // Check if below cost
  const allowBelowCost = await settingsService.getSetting(tenantId, 'pricing.allow_below_cost', false);
  if (!allowBelowCost && product.cost_price && newPrice < product.cost_price) {
    errors.push(`Price ${newPrice} is below cost price ${product.cost_price}`);
  }
  
  // Check if approval required
  if (product.selling_price) {
    const approvalCheck = await settingsService.priceChangeRequiresApproval(tenantId, product.selling_price, newPrice);
    if (approvalCheck.required) {
      warnings.push(approvalCheck.reason);
    }
  }
  
  // Check margin
  const defaultMargin = await settingsService.getSetting(tenantId, 'pricing.default_margin_percent', 20);
  if (product.cost_price) {
    const actualMargin = ((newPrice - product.cost_price) / product.cost_price) * 100;
    if (actualMargin < defaultMargin) {
      warnings.push(`Margin ${actualMargin.toFixed(1)}% is below default ${defaultMargin}%`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    requiresApproval: warnings.some(w => w.includes('approval'))
  };
}

/**
 * Create price change request
 */
async function createPriceChangeRequest(tenantId, userId, productId, newPrice, reason) {
  const product = await getOneQuery(
    'SELECT id, name, code, selling_price FROM products WHERE id = ? AND tenant_id = ?',
    [productId, tenantId]
  );
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const id = crypto.randomUUID();
  await runQuery(`
    INSERT INTO price_change_requests (id, tenant_id, product_id, old_price, new_price, requested_by, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `, [id, tenantId, productId, product.selling_price, newPrice, userId, reason, new Date().toISOString()]);
  
  return {
    id,
    product: { id: product.id, name: product.name, code: product.code },
    oldPrice: product.selling_price,
    newPrice,
    status: 'pending'
  };
}

/**
 * Approve/reject price change request
 */
async function processPriceChangeRequest(tenantId, requestId, userId, action, comments = null) {
  const request = await getOneQuery(
    'SELECT * FROM price_change_requests WHERE id = ? AND tenant_id = ? AND status = ?',
    [requestId, tenantId, 'pending']
  );
  
  if (!request) {
    throw new Error('Price change request not found or already processed');
  }
  
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  
  await runQuery(`
    UPDATE price_change_requests 
    SET status = ?, processed_by = ?, processed_at = ?, comments = ?
    WHERE id = ? AND tenant_id = ?
  `, [newStatus, userId, new Date().toISOString(), comments, requestId, tenantId]);
  
  // If approved, update the product price
  if (action === 'approve') {
    await runQuery(`
      UPDATE products SET selling_price = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `, [request.new_price, new Date().toISOString(), request.product_id, tenantId]);
  }
  
  return {
    requestId,
    status: newStatus,
    productId: request.product_id,
    priceApplied: action === 'approve'
  };
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log master data change
 */
async function logMasterDataChange(tenantId, userId, entityType, entityId, action, oldData, newData) {
  try {
    const id = crypto.randomUUID();
    await runQuery(`
      INSERT INTO master_data_audit_log (id, tenant_id, user_id, entity_type, entity_id, action, old_data, new_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      tenantId, 
      userId, 
      entityType, 
      entityId, 
      action, 
      oldData ? JSON.stringify(oldData) : null, 
      newData ? JSON.stringify(newData) : null, 
      new Date().toISOString()
    ]);
  } catch (error) {
    console.error('Error logging master data change:', error);
  }
}

/**
 * Get audit history for entity
 */
async function getAuditHistory(tenantId, entityType, entityId, limit = 50) {
  const history = await getQuery(`
    SELECT mal.*, u.first_name, u.last_name
    FROM master_data_audit_log mal
    LEFT JOIN users u ON mal.user_id = u.id
    WHERE mal.tenant_id = ? AND mal.entity_type = ? AND mal.entity_id = ?
    ORDER BY mal.created_at DESC
    LIMIT ?
  `, [tenantId, entityType, entityId, limit]);
  
  return (history || []).map(h => ({
    ...h,
    old_data: h.old_data ? JSON.parse(h.old_data) : null,
    new_data: h.new_data ? JSON.parse(h.new_data) : null
  }));
}

module.exports = {
  // Product governance
  validateProduct,
  canDeactivateProduct,
  getProductLifecycle,
  
  // Customer governance
  validateCustomer,
  checkCustomerCreditForOrder,
  getCustomerHealthScore,
  
  // Territory governance
  validateTerritoryAssignment,
  getTerritoryReport,
  
  // Pricing governance
  validatePriceChange,
  createPriceChangeRequest,
  processPriceChangeRequest,
  
  // Audit
  logMasterDataChange,
  getAuditHistory
};
