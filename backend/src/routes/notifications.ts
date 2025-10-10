import express from 'express';
import { socketService } from '../services/socketService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { logger } from '../utils/logger';
import { prisma } from '../database';
import { NotificationType, NotificationPriority, UserRole } from '@prisma/client';

interface ExtendedRequest extends AuthenticatedRequest {
  userId?: string;
  tenantId?: string;
}

const router = express.Router();

// Apply authentication and tenant middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

// Get user notifications with pagination
router.get('/', async (req: ExtendedRequest, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {
      OR: [
        { userId },
        { tenantId, userId: null },
        { roleTarget: req.user?.role as UserRole, userId: null }
      ]
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Send notification to specific user
router.post('/send', async (req: ExtendedRequest, res) => {
  try {
    const { userId, title, message, type = 'INFO', priority = 'NORMAL', data, expiresAt } = req.body;
    const tenantId = req.user?.tenantId;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required'
      });
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        userId,
        tenantId,
        data: data || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Send real-time notification
    const sent = socketService.sendNotification(userId, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type.toLowerCase() as any,
      timestamp: notification.createdAt
    });

    return res.json({
      success: true,
      message: sent ? 'Notification sent successfully' : 'Notification saved, user not connected',
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
    const { title, message, type = 'INFO', priority = 'NORMAL', data, expiresAt } = req.body;
    const tenantId = req.user?.tenantId;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'title and message are required'
      });
    }

    // Create tenant-wide notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        tenantId,
        data: data || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Send real-time notification to all tenant users
    socketService.broadcastToTenant(tenantId!, 'notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type.toLowerCase(),
      priority: notification.priority.toLowerCase(),
      timestamp: notification.createdAt,
      data: notification.data
    });

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

// Send notification to specific role
router.post('/role', async (req: ExtendedRequest, res) => {
  try {
    const { role, title, message, type = 'INFO', priority = 'NORMAL', data, expiresAt } = req.body;
    const tenantId = req.user?.tenantId;

    if (!role || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'role, title, and message are required'
      });
    }

    // Create role-based notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        roleTarget: role as UserRole,
        tenantId,
        data: data || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Send real-time notification to all users with the specified role
    socketService.broadcastToRole(role, 'notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type.toLowerCase(),
      priority: notification.priority.toLowerCase(),
      timestamp: notification.createdAt,
      data: notification.data
    });

    return res.json({
      success: true,
      message: 'Role-based notification sent successfully',
      notification
    });

  } catch (error) {
    logger.error('Error sending role-based notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send role-based notification'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: ExtendedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.update({
      where: { 
        id,
        OR: [
          { userId },
          { tenantId: req.user?.tenantId, userId: null },
          { roleTarget: req.user?.role as UserRole, userId: null }
        ]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: ExtendedRequest, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    const result = await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          { userId },
          { tenantId, userId: null },
          { roleTarget: req.user?.role as UserRole, userId: null }
        ]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: `${result.count} notifications marked as read`
    });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', async (req: ExtendedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    await prisma.notification.delete({
      where: { 
        id,
        OR: [
          { userId },
          { tenantId: req.user?.tenantId, userId: null },
          { roleTarget: req.user?.role as UserRole, userId: null }
        ]
      }
    });

    return res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Get notification statistics
router.get('/stats', async (req: ExtendedRequest, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role as UserRole;

    const where: any = {
      OR: [
        { userId },
        { tenantId, userId: null },
        { roleTarget: userRole, userId: null }
      ]
    };

    const [
      totalNotifications,
      unreadNotifications,
      todayNotifications,
      priorityStats,
      typeStats,
      connectedUsers
    ] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
      prisma.notification.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.notification.groupBy({
        by: ['priority'],
        where: { ...where, isRead: false },
        _count: { priority: true }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { ...where, isRead: false },
        _count: { type: true }
      }),
      socketService.getTenantConnectedUsers(tenantId!)
    ]);

    return res.json({
      success: true,
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        today: todayNotifications,
        priorityBreakdown: priorityStats.reduce((acc, stat) => {
          acc[stat.priority.toLowerCase()] = (stat._count as any).priority || 0;
          return acc;
        }, {} as Record<string, number>),
        typeBreakdown: typeStats.reduce((acc, stat) => {
          acc[stat.type.toLowerCase()] = (stat._count as any).type || 0;
          return acc;
        }, {} as Record<string, number>),
        connectedUsers: connectedUsers.length,
        connectedUserIds: connectedUsers
      }
    });

  } catch (error) {
    logger.error('Error getting notification stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notification stats'
    });
  }
});

// Clean up expired notifications
router.delete('/cleanup', async (req: ExtendedRequest, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return res.json({
      success: true,
      message: `${result.count} expired notifications cleaned up`
    });

  } catch (error) {
    logger.error('Error cleaning up notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clean up notifications'
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

    let notification;

    switch (event) {
      case 'order-update':
        notification = await prisma.notification.create({
          data: {
            title: 'Order Status Updated',
            message: `Order ${data.orderId || 'ORD-001'} status changed to ${data.status || 'completed'}`,
            type: 'INFO',
            priority: 'NORMAL',
            tenantId,
            data: {
              orderId: data.orderId || 'ORD-001',
              status: data.status || 'completed',
              updatedBy: userId
            }
          }
        });

        socketService.broadcastToTenant(tenantId!, 'order:status:updated', {
          id: notification.id,
          orderId: data.orderId || 'ORD-001',
          status: data.status || 'completed',
          updatedBy: userId,
          timestamp: new Date()
        });
        break;

      case 'inventory-alert':
        notification = await prisma.notification.create({
          data: {
            title: 'Low Inventory Alert',
            message: `Product ${data.productId || 'PROD-001'} is running low (${data.currentStock || 5} remaining)`,
            type: 'WARNING',
            priority: 'HIGH',
            roleTarget: 'WAREHOUSE_STAFF',
            tenantId,
            data: {
              productId: data.productId || 'PROD-001',
              currentStock: data.currentStock || 5,
              threshold: data.threshold || 10,
              location: data.location || 'Main Warehouse'
            }
          }
        });

        socketService.broadcastToRole('WAREHOUSE_STAFF', 'inventory:alert', {
          id: notification.id,
          productId: data.productId || 'PROD-001',
          currentStock: data.currentStock || 5,
          threshold: data.threshold || 10,
          location: data.location || 'Main Warehouse',
          timestamp: new Date()
        });
        break;

      case 'sales-update':
        notification = await prisma.notification.create({
          data: {
            title: 'New Sale Recorded',
            message: `Sale of $${data.amount || 1500} recorded for customer ${data.customerId || 'CUST-001'}`,
            type: 'SUCCESS',
            priority: 'NORMAL',
            tenantId,
            data: {
              agentId: userId,
              amount: data.amount || 1500,
              customerId: data.customerId || 'CUST-001'
            }
          }
        });

        socketService.broadcastToTenant(tenantId!, 'sales:updated', {
          id: notification.id,
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
      message: `${event} event simulated successfully`,
      notification
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