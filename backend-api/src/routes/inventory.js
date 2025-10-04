const express = require('express');
const router = express.Router();

// Lazy load database functions
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
            sql += (tenantId || index > 0) ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
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
            sql += (tenantId || index > 0) ? ' AND' : ' WHERE';
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
            sql += (tenantId || index > 0) ? ' AND' : ' WHERE';
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
          const values = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            values.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += (tenantId || index > 0) ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            values.push(conditions[key]);
          });
          
          db.run(sql, values, function(err) {
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
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: boolean
 *         description: Get only low stock items
 *     responses:
 *       200:
 *         description: List of inventory items
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { warehouse_id, low_stock } = req.query;
    
    let inventory;
    
    if (warehouse_id) {
      inventory = await getQuery('inventory', { warehouse_id }, tenantId);
    } else {
      inventory = await getQuery('inventory', {}, tenantId);
    }
    
    // Filter for low stock if requested
    if (low_stock === 'true') {
      inventory = inventory.filter(item => 
        item.quantity <= (item.reorder_level || 10)
      );
    }
    
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/warehouse/{warehouseId}:
 *   get:
 *     summary: Get inventory by warehouse
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory for specific warehouse
 */
router.get('/warehouse/:warehouseId', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { warehouseId } = req.params;
    
    const inventory = await getQuery('inventory', { warehouse_id: warehouseId }, tenantId);
    
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock items
 */
router.get('/low-stock', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    const inventory = await getQuery('inventory', {}, tenantId);
    const lowStock = inventory.filter(item => 
      item.quantity <= (item.reorder_level || 10)
    );
    
    res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get single inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory item details
 *       404:
 *         description: Item not found
 */
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;
    
    const item = await getOneQuery('inventory', { id }, tenantId);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               warehouse_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               reorder_level:
 *                 type: number
 *     responses:
 *       201:
 *         description: Inventory item created
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { product_id, warehouse_id, quantity, reorder_level } = req.body;
    
    if (!product_id || !warehouse_id || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, warehouse ID, and quantity are required' 
      });
    }
    
    const inventoryData = {
      product_id,
      warehouse_id,
      quantity,
      reorder_level: reorder_level || 10,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await insertQuery('inventory', inventoryData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Inventory item created successfully',
      data: { id: result.id, ...inventoryData }
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Inventory item updated
 */
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.tenant_id;
    delete updateData.created_at;
    
    const result = await updateQuery('inventory', updateData, { id }, tenantId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Inventory item updated successfully' 
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/adjust:
 *   post:
 *     summary: Adjust stock levels
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inventory_id:
 *                 type: integer
 *               adjustment:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjusted
 */
router.post('/adjust', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { inventory_id, adjustment, reason } = req.body;
    
    if (!inventory_id || adjustment === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Inventory ID and adjustment amount are required' 
      });
    }
    
    // Get current inventory
    const item = await getOneQuery('inventory', { id: inventory_id }, tenantId);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    // Calculate new quantity
    const newQuantity = item.quantity + adjustment;
    
    if (newQuantity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adjustment would result in negative stock' 
      });
    }
    
    // Update inventory
    await updateQuery('inventory', 
      { quantity: newQuantity, updated_at: new Date().toISOString() }, 
      { id: inventory_id }, 
      tenantId
    );
    
    // Log the adjustment (if movements table exists)
    try {
      await insertQuery('stock_movements', {
        inventory_id,
        type: 'adjustment',
        quantity: adjustment,
        reason: reason || 'Manual adjustment',
        user_id: req.user?.id,
        tenant_id: tenantId,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not log stock movement:', err.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Stock adjusted successfully',
      data: { old_quantity: item.quantity, new_quantity: newQuantity, adjustment }
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory item deleted
 */
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;
    
    const result = await deleteQuery('inventory', { id }, tenantId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Inventory item deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
