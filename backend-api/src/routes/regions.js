const express = require('express');
const router = express.Router();
const { getQuery } = require('../utils/database');

// Get all regions (areas)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const regions = await getQuery(`
      SELECT 
        id,
        name,
        code,
        region_id,
        manager_id,
        status,
        created_at
      FROM areas
      WHERE tenant_id = $1 AND status = 'active'
      ORDER BY name ASC
    `, [tenantId]);
    
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
