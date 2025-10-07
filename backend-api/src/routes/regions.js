const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../utils/database').getDatabase();

// Get all regions (areas)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const db = getDatabase();
    
    const regions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          name,
          code,
          description,
          parent_area_id as parent_region_id,
          area_type as region_type,
          status,
          created_at,
          updated_at
        FROM areas
        WHERE tenant_id = ? AND status = 'active'
        ORDER BY name ASC
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { regions }
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
