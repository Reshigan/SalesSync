import express from 'express';
import { socketService } from '../services/socketService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { logger } from '../utils/logger';

interface ExtendedRequest extends AuthenticatedRequest {
  userId?: string;
  tenantId?: string;
}

const router = express.Router();

// Apply authentication and tenant middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

// Send notification to specific user
router.post('/send', async (req: ExtendedRequest, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required'
      });
    }

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type: type as 'info' | 'success' | 'warning' | 'error',
      timestamp: new Date()
    };

    const sent = socketService.sendNotification(userId, notification);

    return res.json({
      success: true,
      message: sent ? 'Notification sent successfully' : 'User not connected',
      notification
    });

  } catch (error) {
    logger.error('Error sending notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Broadcast notification to all users in tenant
router.post('/broadcast', async (req: ExtendedRequest, res) => {
  try {
    const { title, message, type = 'info' } = req.body;
    const tenantId = req.user?.tenantId;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'title and message are required'
      });
    }

    const notification = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type: type as 'info' | 'success' | 'warning' | 'error',
      timestamp: new Date()
    };

    socketService.broadcastToTenant(tenantId!, 'notification', notification);

    return res.json({
      success: true,
      message: 'Notification broadcasted successfully',
      notification
    });

  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
});

// Send system alert
router.post('/alert', async (req: ExtendedRequest, res) => {
  try {
    const { title, message, severity = 'medium' } = req.body;
    const tenantId = req.user?.tenantId;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'title and message are required'
      });
    }

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      timestamp: new Date()
    };

    socketService.sendSystemAlert(tenantId!, alert);

    return res.json({
      success: true,
      message: 'System alert sent successfully',
      alert
    });

  } catch (error) {
    logger.error('Error sending system alert:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send system alert'
    });
  }
});

// Get connected users stats
router.get('/stats', async (req: ExtendedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const totalConnected = socketService.getConnectedUsersCount();
    const tenantConnected = socketService.getTenantConnectedUsers(tenantId!);

    return res.json({
      success: true,
      data: {
        totalConnectedUsers: totalConnected,
        tenantConnectedUsers: tenantConnected.length,
        connectedUserIds: tenantConnected
      }
    });

  } catch (error) {
    logger.error('Error getting connection stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get connection stats'
    });
  }
});

// Simulate real-time events for testing
router.post('/simulate/:event', async (req: ExtendedRequest, res) => {
  try {
    const { event } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const data = req.body;

    switch (event) {
      case 'order-update':
        socketService.broadcastToTenant(tenantId!, 'order:status:updated', {
          orderId: data.orderId || 'ORD-001',
          status: data.status || 'completed',
          updatedBy: userId,
          timestamp: new Date()
        });
        break;

      case 'inventory-alert':
        socketService.broadcastToRole('WAREHOUSE_MANAGER', 'inventory:alert', {
          productId: data.productId || 'PROD-001',
          currentStock: data.currentStock || 5,
          threshold: data.threshold || 10,
          location: data.location || 'Main Warehouse',
          timestamp: new Date()
        });
        break;

      case 'sales-update':
        socketService.broadcastToTenant(tenantId!, 'sales:updated', {
          agentId: userId,
          amount: data.amount || 1500,
          customerId: data.customerId || 'CUST-001',
          timestamp: new Date()
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown event type'
        });
    }

    return res.json({
      success: true,
      message: `${event} event simulated successfully`
    });

  } catch (error) {
    logger.error('Error simulating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to simulate event'
    });
  }
});

export default router;