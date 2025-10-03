const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../utils/database').getDatabase();
const { getQuery, getOneQuery, insertQuery, updateQuery, deleteQuery } = (() => {
  try {
    return require('../database/queries');
  } catch (error) {
    console.warn('Queries module not found, using fallback functions');
    return {
      getQuery: (table, conditions = {}, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      getOneQuery: (table, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          sql += ' LIMIT 1';
          
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      insertQuery: (table, data) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => '?').join(', ');
          
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      updateQuery: (table, data, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const values = Object.values(data);
          
          let sql = `UPDATE ${table} SET ${setClause}`;
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            values.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            values.push(conditions[key]);
          });
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      },
      deleteQuery: (table, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `DELETE FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      }
    };
  }
})();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         id:
 *           type: string
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         code:
 *           type: string
 *           description: Product code
 *         barcode:
 *           type: string
 *           description: Product barcode
 *         category_id:
 *           type: string
 *           description: Category ID
 *         brand_id:
 *           type: string
 *           description: Brand ID
 *         unit_of_measure:
 *           type: string
 *           description: Unit of measure
 *         selling_price:
 *           type: number
 *           description: Selling price
 *         cost_price:
 *           type: number
 *           description: Cost price
 *         tax_rate:
 *           type: number
 *           description: Tax rate percentage
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Product status
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: string
 *         description: Filter by brand ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or code
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     total:
 *                       type: integer
 *                     categories:
 *                       type: array
 *                     brands:
 *                       type: array
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { category_id, brand_id, status, search, page = 1, limit = 50 } = req.query;
    
    // Build conditions
    const conditions = {};
    if (category_id) conditions.category_id = category_id;
    if (brand_id) conditions.brand_id = brand_id;
    if (status) conditions.status = status;
    
    // Get products with search
    let products;
    if (search) {
      const db = getDatabase();
      const searchTerm = `%${search}%`;
      products = await new Promise((resolve, reject) => {
        db.all(`
          SELECT p.*, c.name as category_name, b.name as brand_name,
                 COALESCE(SUM(i.quantity_on_hand), 0) as total_stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN inventory_stock i ON p.id = i.product_id
          WHERE p.tenant_id = ? 
            AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
          GROUP BY p.id
          ORDER BY p.name
          LIMIT ? OFFSET ?
        `, [tenantId, searchTerm, searchTerm, searchTerm, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)], 
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    } else {
      const db = getDatabase();
      products = await new Promise((resolve, reject) => {
        let sql = `
          SELECT p.*, c.name as category_name, b.name as brand_name,
                 COALESCE(SUM(i.quantity_on_hand), 0) as total_stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN inventory_stock i ON p.id = i.product_id
          WHERE p.tenant_id = ?
        `;
        const params = [tenantId];
        
        Object.keys(conditions).forEach(key => {
          sql += ` AND p.${key} = ?`;
          params.push(conditions[key]);
        });
        
        sql += ` GROUP BY p.id ORDER BY p.name LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
        
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
    
    // Get categories and brands for filters
    const [categories, brands] = await Promise.all([
      getQuery('categories', { status: 'active' }, tenantId),
      getQuery('brands', { status: 'active' }, tenantId)
    ]);
    
    // Get total count
    const db = getDatabase();
    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    res.json({
      success: true,
      data: {
        products,
        total: totalCount,
        categories,
        brands,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      name,
      code,
      barcode,
      category_id,
      brand_id,
      unit_of_measure,
      selling_price,
      cost_price,
      tax_rate,
      status = 'active'
    } = req.body;
    
    // Validation
    if (!name || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and code are required' 
      });
    }
    
    // Check if code already exists
    const existingProduct = await getOneQuery('products', { code }, tenantId);
    if (existingProduct) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product code already exists' 
      });
    }
    
    // Create product
    const productData = {
      tenant_id: tenantId,
      name,
      code,
      barcode,
      category_id,
      brand_id,
      unit_of_measure,
      selling_price: selling_price ? parseFloat(selling_price) : null,
      cost_price: cost_price ? parseFloat(cost_price) : null,
      tax_rate: tax_rate ? parseFloat(tax_rate) : 0,
      status
    };
    
    const result = await insertQuery('products', productData);
    
    // Get the created product with related data
    const db = getDatabase();
    const newProduct = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.tenant_id = ? AND p.code = ?
      `, [tenantId, code], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.status(201).json({
      success: true,
      data: { product: newProduct },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const db = getDatabase();
    const product = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name,
               COALESCE(SUM(i.quantity_on_hand), 0) as total_stock,
               COALESCE(SUM(i.quantity_reserved), 0) as reserved_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN inventory_stock i ON p.id = i.product_id
        WHERE p.tenant_id = ? AND p.id = ?
        GROUP BY p.id
      `, [tenantId, id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Get inventory details by warehouse
    const inventoryDetails = await new Promise((resolve, reject) => {
      db.all(`
        SELECT i.*, w.name as warehouse_name
        FROM inventory_stock i
        JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.tenant_id = ? AND i.product_id = ?
        ORDER BY w.name
      `, [tenantId, id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { 
        product,
        inventory: inventoryDetails
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      name,
      code,
      barcode,
      category_id,
      brand_id,
      unit_of_measure,
      selling_price,
      cost_price,
      tax_rate,
      status
    } = req.body;
    
    // Check if product exists
    const existingProduct = await getOneQuery('products', { id }, tenantId);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if code is being changed and already exists
    if (code && code !== existingProduct.code) {
      const codeExists = await getOneQuery('products', { code }, tenantId);
      if (codeExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product code already exists' 
        });
      }
    }
    
    // Update product
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (brand_id !== undefined) updateData.brand_id = brand_id;
    if (unit_of_measure) updateData.unit_of_measure = unit_of_measure;
    if (selling_price !== undefined) updateData.selling_price = selling_price ? parseFloat(selling_price) : null;
    if (cost_price !== undefined) updateData.cost_price = cost_price ? parseFloat(cost_price) : null;
    if (tax_rate !== undefined) updateData.tax_rate = tax_rate ? parseFloat(tax_rate) : 0;
    if (status) updateData.status = status;
    
    await updateQuery('products', updateData, { id }, tenantId);
    
    // Get updated product
    const db = getDatabase();
    const updatedProduct = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.tenant_id = ? AND p.id = ?
      `, [tenantId, id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json({
      success: true,
      data: { product: updatedProduct },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await getOneQuery('products', { id }, tenantId);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if product is used in orders
    const db = getDatabase();
    const orderItems = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    if (orderItems > 0) {
      // Soft delete - mark as inactive
      await updateQuery('products', { status: 'inactive' }, { id }, tenantId);
      res.json({
        success: true,
        message: 'Product marked as inactive (has order history)'
      });
    } else {
      // Hard delete
      await deleteQuery('products', { id }, tenantId);
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Categories endpoints
router.get('/categories/list', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const categories = await getQuery('categories', { status: 'active' }, tenantId);
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Brands endpoints
router.get('/brands/list', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const brands = await getQuery('brands', { status: 'active' }, tenantId);
    
    res.json({
      success: true,
      data: { brands }
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;