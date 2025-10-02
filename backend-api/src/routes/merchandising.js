const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'merchandising endpoint - coming soon' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create merchandising endpoint - coming soon' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, data: null, message: 'Get merchandising endpoint - coming soon' });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Update merchandising endpoint - coming soon' });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete merchandising endpoint - coming soon' });
});

module.exports = router;
