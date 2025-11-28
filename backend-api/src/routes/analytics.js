const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/sales', asyncHandler(async (req, res) => {
  res.json({ success: true, data: {} });
}));

module.exports = router;
