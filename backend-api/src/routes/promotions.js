const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'promotions endpoint - coming soon' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create promotions endpoint - coming soon' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, data: null, message: 'Get promotions endpoint - coming soon' });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Update promotions endpoint - coming soon' });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete promotions endpoint - coming soon' });
});

module.exports = router;
