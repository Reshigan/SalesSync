const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../utils/database').getDatabase();

// Get all brands
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const db = getDatabase();
    
    const brands = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          name,
          description,
          status,
          created_at,
          updated_at
        FROM brands
        WHERE tenant_id = ? AND status = 'active'
        ORDER BY name ASC
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
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
