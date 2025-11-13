const express = require('express');
const router = express.Router();
const apmService = require('../services/apm.service');
const cacheService = require('../services/cache.service');
const backupService = require('../services/backup.service');
const { authTenantMiddleware } = require('../middleware/auth');

router.get('/metrics', authTenantMiddleware, async (req, res) => {
  try {
    const metrics = apmService.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cache/stats', authTenantMiddleware, async (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cache/flush', authTenantMiddleware, async (req, res) => {
  try {
    cacheService.flush();
    res.json({ success: true, message: 'Cache flushed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backup/create', authTenantMiddleware, async (req, res) => {
  try {
    const result = await backupService.createBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/backup/list', authTenantMiddleware, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backup/restore', authTenantMiddleware, async (req, res) => {
  try {
    const { backupPath } = req.body;
    if (!backupPath) {
      return res.status(400).json({ success: false, error: 'backupPath is required' });
    }
    const result = await backupService.restoreBackup(backupPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
