const express = require('express');
const router = express.Router();

// TODO: Suppliers table not yet implemented in database
// All endpoints return stub responses

router.get('/', async (req, res) => {
  res.json({ success: true, data: [] });
});

router.get('/:id', async (req, res) => {
  res.status(404).json({ success: false, error: 'Supplier not found' });
});

router.post('/', async (req, res) => {
  res.status(501).json({ success: false, error: 'Suppliers feature not yet implemented' });
});

router.put('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: 'Suppliers feature not yet implemented' });
});

router.delete('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: 'Suppliers feature not yet implemented' });
});

module.exports = router;
