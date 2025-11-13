const express = require('express');
const router = express.Router();
const { getQuery } = require('../utils/database');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const categories = await getQuery(`
      SELECT 
        id,
        name,
        code,
        parent_id,
        status,
        created_at
      FROM categories
      WHERE tenant_id = $1 AND status = 'active'
      ORDER BY name ASC
    `, [tenantId]);
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
