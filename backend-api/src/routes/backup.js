const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const backupService = require('../services/backup');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Database backup management
 */

/**
 * @swagger
 * /api/backup/create:
 *   post:
 *     summary: Create a database backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.post('/create', asyncHandler(async (req, res) => {
  const result = await backupService.createBackup();
  
  res.json({
    success: true,
    message: 'Backup created successfully',
    data: result,
  });
}));

/**
 * @swagger
 * /api/backup/list:
 *   get:
 *     summary: List all backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available backups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 backups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       size:
 *                         type: string
 *                       created:
 *                         type: string
 *                       type:
 *                         type: string
 */
router.get('/list', asyncHandler(async (req, res) => {
  const backups = await backupService.listBackups();
  
  res.json({
    success: true,
    count: backups.length,
    backups,
  });
}));

/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     summary: Restore database from backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Backup filename to restore
 *     responses:
 *       200:
 *         description: Backup restored successfully
 */
router.post('/restore', asyncHandler(async (req, res) => {
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({
      success: false,
      error: 'Filename is required',
    });
  }
  
  const result = await backupService.restoreBackup(filename);
  
  res.json({
    success: true,
    message: 'Backup restored successfully',
    data: result,
  });
}));

/**
 * @swagger
 * /api/backup/delete/{filename}:
 *   delete:
 *     summary: Delete a backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Backup filename to delete
 *     responses:
 *       200:
 *         description: Backup deleted successfully
 */
router.delete('/delete/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  const result = await backupService.deleteBackup(filename);
  
  res.json({
    success: true,
    message: 'Backup deleted successfully',
    data: result,
  });
}));

/**
 * @swagger
 * /api/backup/stats:
 *   get:
 *     summary: Get backup statistics
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalBackups:
 *                       type: integer
 *                     totalSize:
 *                       type: string
 *                     maxBackups:
 *                       type: integer
 *                     oldestBackup:
 *                       type: object
 *                     newestBackup:
 *                       type: object
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await backupService.getBackupStats();
  
  res.json({
    success: true,
    stats,
  });
}));

module.exports = router;
