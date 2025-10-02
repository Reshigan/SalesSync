import express from 'express';
import { prisma } from '../database';
import { TenantRequest } from '../middleware/tenant';
import { validateCreateOrder } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all orders
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 10, status, customerId, userId, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.tenantId
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate as string);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
              customerType: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unitPrice: true
                }
              }
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch orders'
    });
  }
});

// Get order by ID
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        invoices: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    return res.json({ order });
  } catch (error) {
    logger.error('Get order error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch order'
    });
  }
});

// Create order
router.post('/', async (req: TenantRequest, res) => {
  try {
    const { error, value } = validateCreateOrder(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const { customerId, deliveryDate, items, notes } = value;

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: req.tenantId
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    // Verify all products exist and belong to tenant
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId: req.tenantId,
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'One or more products not found or inactive'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice) - (item.discount || 0);
    }, 0);

    // Generate order number
    const orderCount = await prisma.order.count({
      where: { tenantId: req.tenantId }
    });
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderDate: new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        totalAmount,
        customerId,
        userId: req.user!.id,
        tenantId: req.tenantId!,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            discount: item.discount || 0
          }))
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    });

    logger.info(`Order created: ${order.orderNumber} by ${req.user?.email}`);

    return res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    logger.error('Create order error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create order'
    });
  }
});

// Update order status
router.patch('/:id/status', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status'
      });
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    logger.info(`Order status updated: ${order.orderNumber} to ${status} by ${req.user?.email}`);

    return res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update order status'
    });
  }
});

// Get order statistics
router.get('/stats/overview', async (req: TenantRequest, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      monthlyStats
    ] = await Promise.all([
      prisma.order.count({
        where: { tenantId: req.tenantId }
      }),
      prisma.order.count({
        where: { tenantId: req.tenantId, status: 'PENDING' }
      }),
      prisma.order.count({
        where: { tenantId: req.tenantId, status: 'DELIVERED' }
      }),
      prisma.order.aggregate({
        where: { 
          tenantId: req.tenantId,
          status: 'DELIVERED'
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { tenantId: req.tenantId },
        _count: { status: true },
        _sum: { totalAmount: true }
      })
    ]);

    const statusStats = monthlyStats.reduce((acc: Record<string, any>, item: any) => {
      acc[item.status] = {
        count: item._count.status,
        revenue: item._sum.totalAmount || 0
      };
      return acc;
    }, {} as Record<string, any>);

    return res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      statusStats
    });
  } catch (error) {
    logger.error('Get order stats error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch order statistics'
    });
  }
});

export default router;