/**
 * Customer Service
 * Business logic for customer management
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { AppError } = require('../middleware/errorHandler');

class CustomerService {
  /**
   * Get all customers with optional filters
   */
  async getCustomers(tenantId, options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      business_type = '',
      is_active = null,
      route_id = '',
      agent_id = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    const params = [tenantId];
    let whereClause = 'WHERE c.tenant_id = ?';

    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (business_type) {
      whereClause += ' AND c.business_type = ?';
      params.push(business_type);
    }

    if (is_active !== null) {
      whereClause += ' AND c.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (route_id) {
      whereClause += ' AND c.route_id = ?';
      params.push(route_id);
    }

    if (agent_id) {
      whereClause += ' AND c.agent_id = ?';
      params.push(agent_id);
    }

    const validSortColumns = ['name', 'created_at', 'credit_limit', 'business_type'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) as total FROM customers c ${whereClause}`;
    const countResult = await getQuery(countQuery, params);
    const total = countResult[0]?.total || 0;

    const dataQuery = `
      SELECT 
        c.*,
        r.name as route_name,
        u.name as agent_name
      FROM customers c
      LEFT JOIN routes r ON c.route_id = r.id
      LEFT JOIN users u ON c.agent_id = u.id
      ${whereClause}
      ORDER BY c.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const customers = await getQuery(dataQuery, params);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(tenantId, customerId) {
    const customer = await getOneQuery(
      `SELECT c.*, r.name as route_name, u.name as agent_name
       FROM customers c
       LEFT JOIN routes r ON c.route_id = r.id
       LEFT JOIN users u ON c.agent_id = u.id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [customerId, tenantId]
    );

    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    return customer;
  }

  /**
   * Create a new customer
   */
  async createCustomer(tenantId, data) {
    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const {
      name, email, phone, address, city, region, postal_code, country,
      business_type, credit_limit, payment_terms, tax_number, contact_person,
      notes, latitude, longitude, route_id, agent_id, is_active = true
    } = data;

    await runQuery(
      `INSERT INTO customers (
        id, tenant_id, name, email, phone, address, city, region, postal_code,
        country, business_type, credit_limit, payment_terms, tax_number,
        contact_person, notes, latitude, longitude, route_id, agent_id,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, name, email || null, phone || null, address || null,
        city || null, region || null, postal_code || null, country || 'South Africa',
        business_type || null, credit_limit || 0, payment_terms || 30,
        tax_number || null, contact_person || null, notes || null,
        latitude || null, longitude || null, route_id || null, agent_id || null,
        is_active ? 1 : 0, now, now
      ]
    );

    return this.getCustomerById(tenantId, id);
  }

  /**
   * Update a customer
   */
  async updateCustomer(tenantId, customerId, data) {
    const existing = await this.getCustomerById(tenantId, customerId);
    const now = new Date().toISOString();

    const fields = [];
    const values = [];

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'region', 'postal_code',
      'country', 'business_type', 'credit_limit', 'payment_terms', 'tax_number',
      'contact_person', 'notes', 'latitude', 'longitude', 'route_id', 'agent_id', 'is_active'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_active' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(customerId, tenantId);

    await runQuery(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );

    return this.getCustomerById(tenantId, customerId);
  }

  /**
   * Delete a customer (soft delete)
   */
  async deleteCustomer(tenantId, customerId) {
    await this.getCustomerById(tenantId, customerId);

    await runQuery(
      `UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ? AND tenant_id = ?`,
      [new Date().toISOString(), customerId, tenantId]
    );

    return { success: true, message: 'Customer deleted successfully' };
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(tenantId, customerId) {
    const customer = await this.getCustomerById(tenantId, customerId);

    const orderStats = await getOneQuery(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        MAX(created_at) as last_order_date
       FROM orders
       WHERE customer_id = ? AND tenant_id = ?`,
      [customerId, tenantId]
    );

    const visitStats = await getOneQuery(
      `SELECT 
        COUNT(*) as total_visits,
        MAX(check_in_time) as last_visit_date
       FROM visits
       WHERE customer_id = ? AND tenant_id = ?`,
      [customerId, tenantId]
    );

    const paymentStats = await getOneQuery(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_paid,
        COUNT(*) as payment_count
       FROM payments
       WHERE customer_id = ? AND tenant_id = ?`,
      [customerId, tenantId]
    );

    return {
      customer,
      stats: {
        orders: {
          total: orderStats?.total_orders || 0,
          totalSpent: orderStats?.total_spent || 0,
          avgOrderValue: orderStats?.avg_order_value || 0,
          lastOrderDate: orderStats?.last_order_date
        },
        visits: {
          total: visitStats?.total_visits || 0,
          lastVisitDate: visitStats?.last_visit_date
        },
        payments: {
          totalPaid: paymentStats?.total_paid || 0,
          count: paymentStats?.payment_count || 0
        }
      }
    };
  }

  /**
   * Get customer order history
   */
  async getCustomerOrders(tenantId, customerId, options = {}) {
    await this.getCustomerById(tenantId, customerId);

    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const orders = await getQuery(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       WHERE o.customer_id = ? AND o.tenant_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [customerId, tenantId, limit, offset]
    );

    const countResult = await getOneQuery(
      `SELECT COUNT(*) as total FROM orders WHERE customer_id = ? AND tenant_id = ?`,
      [customerId, tenantId]
    );

    return {
      orders,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    };
  }

  /**
   * Get customer visit history
   */
  async getCustomerVisits(tenantId, customerId, options = {}) {
    await this.getCustomerById(tenantId, customerId);

    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const visits = await getQuery(
      `SELECT v.*, u.name as agent_name
       FROM visits v
       LEFT JOIN users u ON v.agent_id = u.id
       WHERE v.customer_id = ? AND v.tenant_id = ?
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [customerId, tenantId, limit, offset]
    );

    const countResult = await getOneQuery(
      `SELECT COUNT(*) as total FROM visits WHERE customer_id = ? AND tenant_id = ?`,
      [customerId, tenantId]
    );

    return {
      visits,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    };
  }

  /**
   * Bulk import customers
   */
  async bulkImport(tenantId, customers) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const customerData of customers) {
      try {
        await this.createCustomer(tenantId, customerData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          data: customerData,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get customers by route
   */
  async getCustomersByRoute(tenantId, routeId) {
    return getQuery(
      `SELECT c.*, 
        (SELECT MAX(check_in_time) FROM visits WHERE customer_id = c.id) as last_visit
       FROM customers c
       WHERE c.route_id = ? AND c.tenant_id = ? AND c.is_active = 1
       ORDER BY c.name`,
      [routeId, tenantId]
    );
  }

  /**
   * Get customers near location
   */
  async getCustomersNearLocation(tenantId, latitude, longitude, radiusKm = 5) {
    const customers = await getQuery(
      `SELECT c.*,
        (6371 * acos(cos(radians(?)) * cos(radians(c.latitude)) * 
        cos(radians(c.longitude) - radians(?)) + 
        sin(radians(?)) * sin(radians(c.latitude)))) AS distance
       FROM customers c
       WHERE c.tenant_id = ? 
         AND c.is_active = 1
         AND c.latitude IS NOT NULL 
         AND c.longitude IS NOT NULL
       HAVING distance < ?
       ORDER BY distance`,
      [latitude, longitude, latitude, tenantId, radiusKm]
    );

    return customers;
  }
}

module.exports = new CustomerService();
