import express, { Response } from 'express';
import { PrismaClient, OrderStatus, UserRole } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard
 * Get comprehensive dashboard overview with metrics and data
 */
router.get('/', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get date range for "today" metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel data fetching for performance
    const [
      totalUsers,
      totalCustomers,
      totalProducts,
      allOrders,
      todayOrders,
      activeAgents,
      recentOrders,
      topCustomers,
      salesByMonth
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { tenantId, isActive: true }
      }),

      // Total customers
      prisma.customer.count({
        where: { tenantId, isActive: true }
      }),

      // Total products
      prisma.product.count({
        where: { tenantId, isActive: true }
      }),

      // All orders
      prisma.order.findMany({
        where: { tenantId },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true
        }
      }),

      // Today's orders
      prisma.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        select: {
          id: true,
          totalAmount: true,
          status: true
        }
      }),

      // Active agents (field agents working today)
      prisma.user.count({
        where: {
          tenantId,
          isActive: true,
          role: {
            in: [UserRole.VAN_SALES, UserRole.FIELD_AGENT, UserRole.MERCHANDISER, UserRole.PROMOTER]
          }
        }
      }),

      // Recent orders (last 10)
      prisma.order.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),

      // Top customers by total order value
      prisma.order.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          status: OrderStatus.DELIVERED
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        },
        take: 5
      }),

      // Sales by month (last 12 months)
      prisma.$queryRaw<Array<{ month: string, revenue: number, orders: number }>>`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          SUM("totalAmount")::float as revenue,
          COUNT(*)::int as orders
        FROM "Order"
        WHERE "tenantId" = ${tenantId}
          AND "createdAt" >= NOW() - INTERVAL '12 months'
          AND status = 'DELIVERED'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month DESC
      `
    ]);

    // Calculate metrics
    const totalOrders = allOrders.length;
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Get customer details for top customers
    const topCustomerIds = topCustomers.map(c => c.customerId);
    const customerDetails = await prisma.customer.findMany({
      where: {
        id: { in: topCustomerIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true
      }
    });

    const topCustomersWithDetails = topCustomers.map(tc => {
      const customer = customerDetails.find(c => c.id === tc.customerId);
      return {
        ...customer,
        totalOrders: tc._count.id,
        totalRevenue: Number(tc._sum.totalAmount || 0)
      };
    });

    // Get agent performance
    const agentPerformance = await prisma.order.groupBy({
      by: ['agentId'],
      where: {
        tenantId,
        agentId: { not: null },
        status: OrderStatus.DELIVERED
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 10
    });

    // Get agent details
    const agentIds = agentPerformance.map(ap => ap.agentId).filter((id): id is string => id !== null);
    const agentDetails = await prisma.user.findMany({
      where: {
        id: { in: agentIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    const agentPerformanceWithDetails = agentPerformance.map(ap => {
      const agent = agentDetails.find(a => a.id === ap.agentId);
      return {
        id: agent?.id,
        name: agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown',
        email: agent?.email,
        role: agent?.role,
        totalOrders: ap._count.id,
        totalRevenue: Number(ap._sum.totalAmount || 0)
      };
    });

    // Format response
    const response = {
      overview: {
        totalUsers,
        totalCustomers,
        totalProducts,
        totalOrders,
        todayOrders: todayOrdersCount,
        todayRevenue,
        activeAgents
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer ? {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone
        } : null,
        agent: order.agent ? {
          id: order.agent.id,
          name: `${order.agent.firstName} ${order.agent.lastName}`,
          email: order.agent.email
        } : null,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt
      })),
      topCustomers: topCustomersWithDetails,
      salesByMonth: salesByMonth.map(sm => ({
        month: sm.month,
        revenue: Number(sm.revenue),
        orders: sm.orders
      })),
      agentPerformance: agentPerformanceWithDetails
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for a specific period
 */
router.get('/stats', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { period = 'today' } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    const [orders, visits, customers] = await Promise.all([
      // Orders stats
      prisma.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          totalAmount: true,
          status: true,
          createdAt: true
        }
      }),

      // Visits stats
      prisma.merchandisingVisit.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // New customers
      prisma.customer.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    const revenue = orders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const stats = {
      period: period as string,
      orders: {
        total: orders.length,
        delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
        pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
        cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length
      },
      revenue: {
        total: revenue,
        average: orders.length > 0 ? revenue / orders.length : 0
      },
      visits: {
        total: visits
      },
      customers: {
        new: customers
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/dashboard/activities
 * Get recent activities feed
 */
router.get('/activities', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Fetch recent activities from multiple sources
    const [recentOrders, recentVisits, recentPromotions, recentInventoryMovements] = await Promise.all([
      // Recent orders
      prisma.order.findMany({
        where: { tenantId },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true }
          },
          agent: {
            select: { firstName: true, lastName: true }
          }
        }
      }),

      // Recent merchandising visits
      prisma.merchandisingVisit.findMany({
        where: { tenantId },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: { firstName: true, lastName: true }
          },
          customer: {
            select: { name: true }
          }
        }
      }),

      // Recent promoter activities
      prisma.promoterActivity.findMany({
        where: { tenantId },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: { firstName: true, lastName: true }
          },
          campaign: {
            select: { name: true }
          }
        }
      }),

      // Recent inventory movements
      prisma.inventoryMovement.findMany({
        where: { tenantId },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true }
          },
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      })
    ]);

    // Combine and format activities
    const activities: Array<{
      id: string;
      type: string;
      reference: string;
      description: string;
      customer_name: string | null;
      agent_name: string;
      amount: number | null;
      status: string;
      timestamp: Date;
      timeAgo: string;
      detail: string;
      icon: string;
      color: string;
    }> = [];

    // Add order activities
    recentOrders.forEach(order => {
      activities.push({
        id: order.id,
        type: 'order',
        reference: order.orderNumber,
        description: `Order ${order.orderNumber}`,
        customer_name: order.customer?.name || null,
        agent_name: order.agent ? `${order.agent.firstName} ${order.agent.lastName}` : 'System',
        amount: Number(order.totalAmount),
        status: order.status,
        timestamp: order.createdAt,
        timeAgo: getTimeAgo(order.createdAt),
        detail: `${order.status} - $${Number(order.totalAmount).toFixed(2)}`,
        icon: 'ShoppingCart',
        color: getStatusColor(order.status)
      });
    });

    // Add visit activities
    recentVisits.forEach(visit => {
      activities.push({
        id: visit.id,
        type: 'visit',
        reference: `VISIT-${visit.id.substring(0, 8).toUpperCase()}`,
        description: `Store visit`,
        customer_name: visit.customer?.name || null,
        agent_name: visit.agent ? `${visit.agent.firstName} ${visit.agent.lastName}` : 'Unknown',
        amount: null,
        status: visit.status,
        timestamp: visit.createdAt,
        timeAgo: getTimeAgo(visit.createdAt),
        detail: `${visit.status} visit`,
        icon: 'MapPin',
        color: getStatusColor(visit.status)
      });
    });

    // Add promotion activities
    recentPromotions.forEach(promo => {
      activities.push({
        id: promo.id,
        type: 'promotion',
        reference: `PROMO-${promo.id.substring(0, 8).toUpperCase()}`,
        description: promo.campaign?.name || 'Promotion Activity',
        customer_name: null,
        agent_name: promo.agent ? `${promo.agent.firstName} ${promo.agent.lastName}` : 'Unknown',
        amount: null,
        status: promo.status,
        timestamp: promo.createdAt,
        timeAgo: getTimeAgo(promo.createdAt),
        detail: `${promo.activityType} - ${promo.status}`,
        icon: 'Megaphone',
        color: getStatusColor(promo.status)
      });
    });

    // Add inventory activities
    recentInventoryMovements.forEach(movement => {
      activities.push({
        id: movement.id,
        type: 'inventory',
        reference: `INV-${movement.id.substring(0, 8).toUpperCase()}`,
        description: `${movement.product?.name || 'Product'} - ${movement.type}`,
        customer_name: null,
        agent_name: movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : 'System',
        amount: null,
        status: movement.type,
        timestamp: movement.createdAt,
        timeAgo: getTimeAgo(movement.createdAt),
        detail: `${movement.quantity} units - ${movement.type}`,
        icon: 'Package',
        color: getMovementColor(movement.type)
      });
    });

    // Sort by timestamp descending and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const limitedActivities = activities.slice(0, limitNum);

    res.json({
      activities: limitedActivities,
      total: activities.length
    });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard activities',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    DELIVERED: 'green',
    COMPLETED: 'green',
    VERIFIED: 'green',
    PENDING: 'yellow',
    IN_PROGRESS: 'blue',
    CANCELLED: 'red',
    REJECTED: 'red',
    SCHEDULED: 'purple'
  };
  return statusColors[status] || 'gray';
}

function getMovementColor(type: string): string {
  const movementColors: Record<string, string> = {
    IN: 'green',
    OUT: 'red',
    TRANSFER: 'blue',
    ADJUSTMENT: 'yellow',
    COUNT: 'purple'
  };
  return movementColors[type] || 'gray';
}

export default router;
