const express = require('express');
const router = express.Router();
const { getQuery } = require('../utils/database');

// Get all brands
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const brands = await getQuery(`
      SELECT 
        id,
        name,
        code,
        status,
        created_at
      FROM brands
      WHERE tenant_id = $1 AND status = 'active'
      ORDER BY name ASC
    `, [tenantId]);
    
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
