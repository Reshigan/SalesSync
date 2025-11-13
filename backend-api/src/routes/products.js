const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../utils/database').getDatabase();
const { insertQuery, updateQuery, deleteQuery } = (() => {
  try {
    return require('../database/queries');
  } catch (error) {
    console.warn('Queries module not found, using fallback functions');
    return {
      getQuery: (table, conditions = {}, tenantId) => {
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId $1 ' AND' : ' WHERE';
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
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId $1 ' AND' : ' WHERE';
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
        return new Promise((resolve, reject) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => '$1').join(', ');
          
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      updateQuery: (table, data, conditions, tenantId) => {
        return new Promise((resolve, reject) => {
          const setClause = Object.keys(data).map(key => `${key} = $1`).join(', ');
          const values = Object.values(data);
          
          let sql = `UPDATE ${table} SET ${setClause}`;
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            values.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId $1 ' AND' : ' WHERE';
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
        return new Promise((resolve, reject) => {
          let sql = `DELETE FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId $1 ' AND' : ' WHERE';
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
      const searchTerm = `%${search}%`;
      products = await new Promise((resolve, reject) => {
        db.all(`
          SELECT p.*, c.name as category_name, b.name as brand_name,
                 COALESCE(SUM(i.quantity_on_hand), 0) as total_stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN inventory_stock i ON p.id = i.product_id
          WHERE p.tenant_id = $1 
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
      products = await new Promise((resolve, reject) => {
        let sql = `
          SELECT p.*, c.name as category_name, b.name as brand_name,
                 COALESCE(SUM(i.quantity_on_hand), 0) as total_stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN inventory_stock i ON p.id = i.product_id
          WHERE p.tenant_id = $1
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
    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM products WHERE tenant_id = $1', [tenantId], (err, row) => {
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
    const newProduct = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.tenant_id = $1 AND p.code = $2
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
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Get all statistics in parallel for performance
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      byCategory,
      byBrand
    ] = await Promise.all([
      // Total products count
      new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM products WHERE tenant_id = $1',
          [tenantId],
          (err, row) => err ? reject(err) : resolve(row.count)
        );
      }),
      
      // Active products count
      new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM products WHERE tenant_id = $1 AND status = $2',
          [tenantId, 'active'],
          (err, row) => err ? reject(err) : resolve(row.count)
        );
      }),
      
      // Low stock products (less than reorder level or less than 10)
      new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(DISTINCT p.id) as count 
           FROM products p
           LEFT JOIN inventory_stock i ON p.id = i.product_id AND i.tenant_id = p.tenant_id
           WHERE p.tenant_id = $1 
           AND p.status = 'active'
           AND COALESCE(i.quantity_on_hand, 0) > 0
           AND COALESCE(i.quantity_on_hand, 0) <= COALESCE(p.reorder_level, 10)`,
          [tenantId],
          (err, row) => err ? reject(err) : resolve(row.count)
        );
      }),
      
      // Out of stock products
      new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(DISTINCT p.id) as count 
           FROM products p
           LEFT JOIN inventory_stock i ON p.id = i.product_id AND i.tenant_id = p.tenant_id
           WHERE p.tenant_id = $1 
           AND p.status = 'active'
           AND COALESCE(i.quantity_on_hand, 0) = 0`,
          [tenantId],
          (err, row) => err ? reject(err) : resolve(row.count)
        );
      }),
      
      // Total inventory value (cost_price * quantity)
      new Promise((resolve, reject) => {
        db.get(
          `SELECT SUM(p.cost_price * COALESCE(i.quantity_on_hand, 0)) as total
           FROM products p
           LEFT JOIN inventory_stock i ON p.id = i.product_id AND i.tenant_id = p.tenant_id
           WHERE p.tenant_id = $1`,
          [tenantId],
          (err, row) => err ? reject(err) : resolve(row.total || 0)
        );
      }),
      
      // Products by category
      new Promise((resolve, reject) => {
        db.all(
          `SELECT c.id, c.name, COUNT(p.id) as productCount,
                  SUM(COALESCE(i.quantity_on_hand, 0)) as totalStock
           FROM categories c
           LEFT JOIN products p ON c.id = p.category_id AND p.tenant_id = c.tenant_id
           LEFT JOIN inventory_stock i ON p.id = i.product_id AND i.tenant_id = p.tenant_id
           WHERE c.tenant_id = $1
           GROUP BY c.id, c.name
           ORDER BY productCount DESC`,
          [tenantId],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      }),
      
      // Products by brand
      new Promise((resolve, reject) => {
        db.all(
          `SELECT b.id, b.name, COUNT(p.id) as productCount,
                  SUM(COALESCE(i.quantity_on_hand, 0)) as totalStock
           FROM brands b
           LEFT JOIN products p ON b.id = p.brand_id AND p.tenant_id = b.tenant_id
           LEFT JOIN inventory_stock i ON p.id = i.product_id AND i.tenant_id = p.tenant_id
           WHERE b.tenant_id = $1
           GROUP BY b.id, b.name
           ORDER BY productCount DESC`,
          [tenantId],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      })
    ]);
    
    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue: parseFloat(totalValue.toFixed(2)),
        byCategory,
        byBrand
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const product = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name,
               COALESCE(SUM(i.quantity_on_hand), 0) as total_stock,
               COALESCE(SUM(i.quantity_reserved), 0) as reserved_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN inventory_stock i ON p.id = i.product_id
        WHERE p.tenant_id = $1 AND p.id = $2
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
        WHERE i.tenant_id = $1 AND i.product_id = $2
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
    if (selling_price !== undefined) updateData.selling_price = selling_price $1 parseFloat(selling_price) : null;
    if (cost_price !== undefined) updateData.cost_price = cost_price $1 parseFloat(cost_price) : null;
    if (tax_rate !== undefined) updateData.tax_rate = tax_rate $1 parseFloat(tax_rate) : 0;
    if (status) updateData.status = status;
    
    await updateQuery('products', updateData, { id }, tenantId);
    
    // Get updated product
    const updatedProduct = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.tenant_id = $1 AND p.id = $2
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
    const orderItems = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM order_items WHERE product_id = $1', [id], (err, row) => {
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

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics
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
 *                     totalProducts:
 *                       type: integer
 *                     activeProducts:
 *                       type: integer
 *                     lowStockProducts:
 *                       type: integer
 *                     outOfStockProducts:
 *                       type: integer
 *                     totalValue:
 *                       type: number
 *                     byCategory:
 *                       type: array
 *                     byBrand:
 *                       type: array
 */


/**
 * @swagger
 * /api/products/{id}/stock-history:
 *   get:
 *     summary: Get product stock movement history
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 */
router.get('/:id/stock-history', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { start_date, end_date, warehouse_id, limit = 50 } = req.query;
    
    // Verify product exists
    const product = await getOneQuery('products', { id }, tenantId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Build query for stock movements
    let sql = `
      SELECT 
        im.id,
        im.product_id,
        im.warehouse_id,
        w.name as warehouse_name,
        im.movement_type,
        im.quantity,
        im.reference_number,
        im.reference_type,
        im.notes,
        im.created_at,
        im.created_by,
        u.full_name as created_by_name,
        COALESCE(
          (SELECT SUM(
            CASE 
              WHEN im2.movement_type IN ('stock_in', 'stock_adjustment_in', 'stock_transfer_in') 
              THEN im2.quantity
              WHEN im2.movement_type IN ('stock_out', 'stock_adjustment_out', 'stock_transfer_out', 'sale', 'damage', 'expired')
              THEN -im2.quantity
              ELSE 0
            END
          )
          FROM inventory_movements im2
          WHERE im2.product_id = im.product_id
          AND im2.tenant_id = im.tenant_id
          AND im2.created_at <= im.created_at
          ${warehouse_id ? 'AND im2.warehouse_id = ?' : ''}
          ), 0
        ) as running_balance
      FROM inventory_movements im
      LEFT JOIN warehouses w ON im.warehouse_id = w.id
      LEFT JOIN users u ON im.created_by = u.id
      WHERE im.product_id = $1
      AND im.tenant_id = ?
    `;
    
    const params = [id, tenantId];
    
    // Add filters
    if (start_date) {
      sql += ' AND im.created_at::date >= DATE(?)';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND im.created_at::date <= DATE(?)';
      params.push(end_date);
    }
    
    if (warehouse_id) {
      sql += ' AND im.warehouse_id = ?';
      params.push(warehouse_id);
    }
    
    sql += ' ORDER BY im.created_at DESC, im.id DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const movements = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
    });
    
    // Get current stock levels by warehouse
    const stockLevels = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          i.warehouse_id,
          w.name as warehouse_name,
          i.quantity_on_hand,
          i.quantity_available,
          i.quantity_reserved,
          i.last_updated
        FROM inventory_stock i
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.product_id = $1
        AND i.tenant_id = ?
        ${warehouse_id ? 'AND i.warehouse_id = ?' : ''}
        ORDER BY w.name`,
        warehouse_id ? [id, tenantId, warehouse_id] : [id, tenantId],
        (err, rows) => err ? reject(err) : resolve(rows || [])
      );
    });
    
    // Calculate summary
    const summary = movements.reduce((acc, mov) => {
      const qty = mov.quantity;
      if (['stock_in', 'stock_adjustment_in', 'stock_transfer_in'].includes(mov.movement_type)) {
        acc.totalIn += qty;
      } else if (['stock_out', 'stock_adjustment_out', 'stock_transfer_out', 'sale', 'damage', 'expired'].includes(mov.movement_type)) {
        acc.totalOut += qty;
      }
      return acc;
    }, { totalIn: 0, totalOut: 0 });
    
    summary.netChange = summary.totalIn - summary.totalOut;
    summary.totalMovements = movements.length;
    
    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          code: product.code
        },
        movements,
        stockLevels,
        summary,
        filters: {
          start_date: start_date || null,
          end_date: end_date || null,
          warehouse_id: warehouse_id || null,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stock history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/sales-data:
 *   get:
 *     summary: Get product sales history and trends
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 */
router.get('/:id/sales-data', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { period = 'monthly', months = 12 } = req.query;
    
    const product = await getOneQuery('products', { id }, tenantId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Get sales data grouped by period
    const dateFormat = {
      daily: '%Y-%m-%d',
      weekly: '%Y-W%W',
      monthly: '%Y-%m',
      yearly: '%Y'
    }[period] || '%Y-%m';
    
    const [salesTrend, topCustomers, revenueStats] = await Promise.all([
      // Sales trend by period
      new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            strftime('${dateFormat}', o.order_date) as period,
            COUNT(DISTINCT o.id) as order_count,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.unit_price) as total_revenue,
            AVG(oi.unit_price) as avg_price
          FROM orders o
          INNER JOIN order_items oi ON o.id = oi.order_id
          WHERE oi.product_id = $1
          AND o.tenant_id = ?
          AND o.status != 'cancelled'
          AND date(o.order_date) >= date('now', '-${parseInt(months)} months')
          GROUP BY period
          ORDER BY period DESC`,
          [id, tenantId],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      }),
      
      // Top customers for this product
      new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            c.id,
            c.name,
            c.code,
            COUNT(DISTINCT o.id) as order_count,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.unit_price) as total_spent,
            MAX(o.order_date) as last_order_date
          FROM customers c
          INNER JOIN orders o ON c.id = o.customer_id
          INNER JOIN order_items oi ON o.id = oi.order_id
          WHERE oi.product_id = $1
          AND o.tenant_id = ?
          AND o.status != 'cancelled'
          GROUP BY c.id, c.name, c.code
          ORDER BY total_spent DESC
          LIMIT 10`,
          [id, tenantId],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      }),
      
      // Overall revenue statistics
      new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(DISTINCT o.id) as total_orders,
            SUM(oi.quantity) as total_quantity_sold,
            SUM(oi.quantity * oi.unit_price) as total_revenue,
            AVG(oi.unit_price) as average_price,
            MIN(oi.unit_price) as min_price,
            MAX(oi.unit_price) as max_price,
            MIN(o.order_date) as first_sale_date,
            MAX(o.order_date) as last_sale_date
          FROM orders o
          INNER JOIN order_items oi ON o.id = oi.order_id
          WHERE oi.product_id = $1
          AND o.tenant_id = ?
          AND o.status != 'cancelled'`,
          [id, tenantId],
          (err, row) => err ? reject(err) : resolve(row || {})
        );
      })
    ]);
    
    // Calculate growth rate
    const growthRate = salesTrend.length >= 2 ? 
      ((salesTrend[0].total_revenue - salesTrend[1].total_revenue) / salesTrend[1].total_revenue * 100) : 0;
    
    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
          selling_price: product.selling_price
        },
        salesTrend,
        topCustomers,
        statistics: {
          ...revenueStats,
          total_revenue: parseFloat((revenueStats.total_revenue || 0).toFixed(2)),
          average_price: parseFloat((revenueStats.average_price || 0).toFixed(2)),
          growth_rate: parseFloat(growthRate.toFixed(2))
        },
        period,
        months: parseInt(months)
      }
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sales data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
