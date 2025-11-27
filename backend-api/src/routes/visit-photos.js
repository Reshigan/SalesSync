const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    
    const photo = await getOneQuery(`
      SELECT vp.*, v.visit_date, c.name as customer_name, u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM visit_photos vp
      LEFT JOIN visits v ON vp.visit_id = v.id
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN users u ON vp.uploaded_by = u.id
      WHERE vp.id = $1 AND vp.tenant_id = $2
    `, [id, tenantId]);
    
    res.json({ success: true, data: photo || null });
  } catch (error) {
    console.error('Error fetching visit photo:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
