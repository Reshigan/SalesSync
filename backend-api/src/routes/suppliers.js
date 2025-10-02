const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
// Authentication middleware is applied globally in server.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *         - category
 *         - contact_person
 *         - email
 *         - phone
 *         - address
 *         - city
 *         - province
 *         - postal_code
 *         - country
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the supplier
 *         code:
 *           type: string
 *           description: Supplier code
 *         name:
 *           type: string
 *           description: Supplier name
 *         type:
 *           type: string
 *           enum: [manufacturer, distributor, wholesaler, service_provider]
 *           description: Supplier type
 *         category:
 *           type: string
 *           description: Supplier category
 *         contact_person:
 *           type: string
 *           description: Contact person name
 *         email:
 *           type: string
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         website:
 *           type: string
 *           description: Website URL
 *         address:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         province:
 *           type: string
 *           description: Province
 *         postal_code:
 *           type: string
 *           description: Postal code
 *         country:
 *           type: string
 *           description: Country
 *         tax_number:
 *           type: string
 *           description: Tax number
 *         registration_number:
 *           type: string
 *           description: Registration number
 *         payment_terms:
 *           type: string
 *           description: Payment terms
 *         credit_limit:
 *           type: number
 *           description: Credit limit
 *         current_balance:
 *           type: number
 *           description: Current balance
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Supplier rating (1-5)
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended, pending]
 *           description: Supplier status
 *         contract_start:
 *           type: string
 *           format: date
 *           description: Contract start date
 *         contract_end:
 *           type: string
 *           format: date
 *           description: Contract end date
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 */
router.get('/', async (req, res) => {
  try {
    const { db } = req;
    
    const query = `
      SELECT 
        s.*,
        COALESCE(orders.total_orders, 0) as total_orders,
        COALESCE(orders.ytd_spend, 0) as ytd_spend,
        COALESCE(orders.last_order_date, null) as last_order_date
      FROM suppliers s
      LEFT JOIN (
        SELECT 
          supplier_id,
          COUNT(*) as total_orders,
          SUM(CASE WHEN strftime('%Y', created_at) = strftime('%Y', 'now') THEN total_amount ELSE 0 END) as ytd_spend,
          MAX(created_at) as last_order_date
        FROM purchase_orders
        GROUP BY supplier_id
      ) orders ON s.id = orders.supplier_id
      WHERE s.tenant_id = ?
      ORDER BY s.name
    `;
    
    const suppliers = db.prepare(query).all(req.tenantId);
    
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers'
    });
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier details
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { db } = req;
    const { id } = req.params;
    
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ? AND tenant_id = ?').get(id, req.tenantId);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier'
    });
  }
});

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *               - category
 *               - contact_person
 *               - email
 *               - phone
 *               - address
 *               - city
 *               - province
 *               - postal_code
 *               - country
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [manufacturer, distributor, wholesaler, service_provider]
 *               category:
 *                 type: string
 *               contact_person:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               province:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               tax_number:
 *                 type: string
 *               registration_number:
 *                 type: string
 *               payment_terms:
 *                 type: string
 *               credit_limit:
 *                 type: number
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, pending]
 *               contract_start:
 *                 type: string
 *                 format: date
 *               contract_end:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const { db } = req;
    const { 
      code, name, type, category, contact_person, email, phone, website,
      address, city, province, postal_code, country, tax_number, registration_number,
      payment_terms, credit_limit, rating = 3, status = 'active',
      contract_start, contract_end
    } = req.body;
    
    // Validate required fields
    if (!code || !name || !type || !category || !contact_person || !email || !phone || 
        !address || !city || !province || !postal_code || !country) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }
    
    // Check if code already exists
    const existingSupplier = db.prepare('SELECT id FROM suppliers WHERE code = ? AND tenant_id = ?').get(code, req.tenantId);
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: 'Supplier code already exists'
      });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const insertQuery = `
      INSERT INTO suppliers (
        id, tenant_id, code, name, type, category, contact_person, email, phone, website,
        address, city, province, postal_code, country, tax_number, registration_number,
        payment_terms, credit_limit, current_balance, rating, status,
        contract_start, contract_end, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.prepare(insertQuery).run(
      id, req.tenantId, code, name, type, category, contact_person, email, phone, website || null,
      address, city, province, postal_code, country, tax_number || null, registration_number || null,
      payment_terms || null, credit_limit || null, 0, rating, status,
      contract_start || null, contract_end || null, now, now
    );
    
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    
    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create supplier'
    });
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [manufacturer, distributor, wholesaler, service_provider]
 *               category:
 *                 type: string
 *               contact_person:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               province:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               tax_number:
 *                 type: string
 *               registration_number:
 *                 type: string
 *               payment_terms:
 *                 type: string
 *               credit_limit:
 *                 type: number
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, pending]
 *               contract_start:
 *                 type: string
 *                 format: date
 *               contract_end:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       404:
 *         description: Supplier not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { db } = req;
    const { id } = req.params;
    const { 
      code, name, type, category, contact_person, email, phone, website,
      address, city, province, postal_code, country, tax_number, registration_number,
      payment_terms, credit_limit, rating, status, contract_start, contract_end
    } = req.body;
    
    // Check if supplier exists
    const existingSupplier = db.prepare('SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?').get(id, req.tenantId);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    // Check if code already exists (excluding current supplier)
    if (code) {
      const duplicateSupplier = db.prepare('SELECT id FROM suppliers WHERE code = ? AND tenant_id = ? AND id != ?').get(code, req.tenantId, id);
      if (duplicateSupplier) {
        return res.status(400).json({
          success: false,
          error: 'Supplier code already exists'
        });
      }
    }
    
    const now = new Date().toISOString();
    
    const updateQuery = `
      UPDATE suppliers SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        category = COALESCE(?, category),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        website = ?,
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        province = COALESCE(?, province),
        postal_code = COALESCE(?, postal_code),
        country = COALESCE(?, country),
        tax_number = ?,
        registration_number = ?,
        payment_terms = ?,
        credit_limit = ?,
        rating = COALESCE(?, rating),
        status = COALESCE(?, status),
        contract_start = ?,
        contract_end = ?,
        updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `;
    
    db.prepare(updateQuery).run(
      code, name, type, category, contact_person, email, phone, website || null,
      address, city, province, postal_code, country, tax_number || null, registration_number || null,
      payment_terms || null, credit_limit || null, rating, status,
      contract_start || null, contract_end || null, now, id, req.tenantId
    );
    
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier'
    });
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 *       400:
 *         description: Cannot delete supplier with associated purchase orders
 */
router.delete('/:id', async (req, res) => {
  try {
    const { db } = req;
    const { id } = req.params;
    
    // Check if supplier exists
    const existingSupplier = db.prepare('SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?').get(id, req.tenantId);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    // Check if supplier has associated purchase orders
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?').get(id);
    if (orderCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete supplier with associated purchase orders'
      });
    }
    
    db.prepare('DELETE FROM suppliers WHERE id = ? AND tenant_id = ?').run(id, req.tenantId);
    
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier'
    });
  }
});

module.exports = router;