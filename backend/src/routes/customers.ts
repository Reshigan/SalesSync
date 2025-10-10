import express from 'express';
import { prisma } from '../database';
import { TenantRequest } from '../middleware/tenant';
import { validateCreateCustomer } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all customers
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 10, customerType, city, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.tenantId,
      isActive: true
    };

    if (customerType) {
      where.customerType = customerType;
    }

    if (city) {
      where.city = city;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    return res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get customers error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customers'
    });
  }
});

// Get single customer
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
        isActive: true
      },
      include: {
        route: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    return res.json({ customer });
  } catch (error) {
    logger.error('Get customer error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer'
    });
  }
});

// Create customer
router.post('/', async (req: TenantRequest, res) => {
  try {
    const { error, value } = validateCreateCustomer(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const customer = await prisma.customer.create({
      data: {
        ...value,
        tenantId: req.tenantId!
      }
    });

    return res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    logger.error('Create customer error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create customer'
    });
  }
});

// Update customer
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    const { error, value } = validateCreateCustomer(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: value
    });

    return res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    logger.error('Update customer error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update customer'
    });
  }
});

// Delete customer (soft delete)
router.delete('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    // Soft delete by setting isActive to false
    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      message: 'Customer deleted successfully',
      customer
    });
  } catch (error) {
    logger.error('Delete customer error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete customer'
    });
  }
});

// Get customer statistics
router.get('/stats/overview', async (req: TenantRequest, res) => {
  try {
    const tenantId = req.tenantId;

    const [totalCustomers, activeCustomers, newThisMonth, customersByType] = await Promise.all([
      prisma.customer.count({
        where: { tenantId }
      }),
      prisma.customer.count({
        where: { tenantId, isActive: true }
      }),
      prisma.customer.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.customer.groupBy({
        by: ['customerType'],
        where: { tenantId, isActive: true },
        _count: true
      })
    ]);

    return res.json({
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      newThisMonth,
      byType: customersByType.map(ct => ({
        type: ct.customerType,
        count: ct._count
      }))
    });
  } catch (error) {
    logger.error('Get customer stats error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer statistics'
    });
  }
});

// Get customer orders
router.get('/:id/orders', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: id,
          tenantId: req.tenantId
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.order.count({
        where: {
          customerId: id,
          tenantId: req.tenantId
        }
      })
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
    logger.error('Get customer orders error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer orders'
    });
  }
});

// Get customer visits
router.get('/:id/visits', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    const [visits, total] = await Promise.all([
      prisma.merchandisingVisit.findMany({
        where: {
          storeId: id,
          store: {
            tenantId: req.tenantId
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.merchandisingVisit.count({
        where: {
          storeId: id,
          store: {
            tenantId: req.tenantId
          }
        }
      })
    ]);

    return res.json({
      visits,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get customer visits error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer visits'
    });
  }
});

// Get customer analytics
router.get('/:id/analytics', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    const [orders, visits, totalRevenue, ordersByStatus] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: id,
          tenantId: req.tenantId
        },
        select: {
          totalAmount: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.merchandisingVisit.count({
        where: {
          storeId: id,
          store: {
            tenantId: req.tenantId
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          customerId: id,
          tenantId: req.tenantId,
          status: 'DELIVERED'
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: {
          customerId: id,
          tenantId: req.tenantId
        },
        _count: true
      })
    ]);

    const analytics = {
      totalOrders: orders.length,
      totalVisits: visits,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      averageOrderValue: orders.length > 0 
        ? Number(totalRevenue._sum.totalAmount || 0) / orders.length 
        : 0,
      ordersByStatus: ordersByStatus.map(os => ({
        status: os.status,
        count: os._count
      })),
      recentActivity: {
        lastOrderDate: orders.length > 0 
          ? orders[0].createdAt 
          : null,
        orderFrequency: orders.length > 0 
          ? Math.round(orders.length / 12) // orders per month (assuming 12 month period)
          : 0
      }
    };

    return res.json({ analytics });
  } catch (error) {
    logger.error('Get customer analytics error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer analytics'
    });
  }
});

// Search customers
router.get('/search', async (req: TenantRequest, res) => {
  try {
    const { searchTerm, searchType = 'name', page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!searchTerm) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search term is required'
      });
    }

    let where: any = {
      tenantId: req.tenantId,
      isActive: true
    };

    switch (searchType) {
      case 'name':
        where.name = { contains: searchTerm as string, mode: 'insensitive' };
        break;
      case 'phone':
        where.phone = { contains: searchTerm as string, mode: 'insensitive' };
        break;
      case 'code':
        where.code = { contains: searchTerm as string, mode: 'insensitive' };
        break;
      default:
        where.OR = [
          { name: { contains: searchTerm as string, mode: 'insensitive' } },
          { phone: { contains: searchTerm as string, mode: 'insensitive' } },
          { code: { contains: searchTerm as string, mode: 'insensitive' } }
        ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    return res.json({
      data: customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Search customers error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search customers'
    });
  }
});

// Get nearby customers
router.get('/nearby', async (req: TenantRequest, res) => {
  try {
    const { latitude, longitude, radius = 5, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
      });
    }

    // Using Haversine formula to calculate distance
    // This is a simplified version - in production, you might want to use PostGIS or similar
    const customers = await prisma.$queryRaw`
      SELECT *,
        (
          6371 * acos(
            cos(radians(${Number(latitude)})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${Number(longitude)})) + 
            sin(radians(${Number(latitude)})) * 
            sin(radians(latitude))
          )
        ) AS distance
      FROM "Customer"
      WHERE "tenantId" = ${req.tenantId}
        AND "isActive" = true
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      HAVING distance <= ${Number(radius)}
      ORDER BY distance
      LIMIT ${Number(limit)}
      OFFSET ${skip}
    `;

    const total = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Customer"
      WHERE "tenantId" = ${req.tenantId}
        AND "isActive" = true
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(${Number(latitude)})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${Number(longitude)})) + 
            sin(radians(${Number(latitude)})) * 
            sin(radians(latitude))
          )
        ) <= ${Number(radius)}
    `;

    return res.json({
      data: customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number((total as any)[0]?.count || 0),
        pages: Math.ceil(Number((total as any)[0]?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get nearby customers error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch nearby customers'
    });
  }
});

export default router;