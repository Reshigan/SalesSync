const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [stock_alert, target_achieved, visit_reminder, commission_update]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 50
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { is_read, type, priority, limit = 50 } = req.query;
    
    let query = `
      SELECT n.*,
             u.first_name || ' ' || u.last_name as agent_name
      FROM notifications n
      LEFT JOIN users a ON n.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE n.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (is_read !== undefined) {
      query += ' AND n.is_read = ?';
      params.push(is_read === 'true' || is_read === true ? 1 : 0);
    }
    
    if (type) {
      query += ' AND n.type = ?';
      params.push(type);
    }
    
    if (priority) {
      query += ' AND n.priority = ?';
      params.push(priority);
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const notifications = await getQuery(query, params);
    
    // Calculate summary
    const summary = {
      total: notifications.length,
      unread: notifications.filter(n => n.is_read === 0).length,
      urgent: notifications.filter(n => n.priority === 'urgent').length,
      by_type: {}
    };
    
    notifications.forEach(n => {
      if (!summary.by_type[n.type]) {
        summary.by_type[n.type] = 0;
      }
      summary.by_type[n.type]++;
    });
    
    res.json({
      success: true,
      data: notifications,
      summary
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch notifications', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [stock_alert, target_achieved, visit_reminder, commission_update]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               action_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { v4: uuidv4 } = require('uuid');
    const { agent_id, type, title, message, priority = 'normal', action_url } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Type, title, and message are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    const notificationId = uuidv4();
    
    await runQuery(`
      INSERT INTO notifications (
        id, tenant_id, agent_id, type, title, message, priority, action_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      notificationId,
      req.user.tenantId,
      agent_id || null,
      type,
      title,
      message,
      priority,
      action_url || null
    ]);
    
    res.status(201).json({
      success: true,
      data: { id: notificationId, message: 'Notification created successfully' }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create notification', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    const notification = await getOneQuery(`
      SELECT id FROM notifications
      WHERE id = ? AND tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found', code: 'NOT_FOUND' }
      });
    }
    
    await runQuery(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: { message: 'Notification marked as read' }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update notification', code: 'UPDATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/mark-all-read', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    
    await runQuery(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND is_read = 0
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: { message: 'All notifications marked as read' }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update notifications', code: 'UPDATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete('/:id', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    const notification = await getOneQuery(`
      SELECT id FROM notifications
      WHERE id = ? AND tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found', code: 'NOT_FOUND' }
      });
    }
    
    await runQuery(`
      DELETE FROM notifications WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: { message: 'Notification deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete notification', code: 'DELETE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/notifications/summary:
 *   get:
 *     summary: Get notifications summary
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    
    const summary = await getQuery(`
      SELECT 
        type,
        priority,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM notifications
      WHERE tenant_id = ?
      GROUP BY type, priority
      ORDER BY priority DESC, type ASC
    `, [req.user.tenantId]);
    
    const recentUrgent = await getQuery(`
      SELECT *
      FROM notifications
      WHERE tenant_id = ?
        AND priority = 'urgent'
        AND is_read = 0
      ORDER BY created_at DESC
      LIMIT 5
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        summary,
        recent_urgent: recentUrgent,
        total_unread: summary.reduce((sum, s) => sum + s.unread_count, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications summary:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch summary', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;
