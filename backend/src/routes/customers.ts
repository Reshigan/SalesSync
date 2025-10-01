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

export default router;