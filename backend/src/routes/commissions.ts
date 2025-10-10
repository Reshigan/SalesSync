import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all commissions
router.get('/', async (req: TenantRequest, res, next) => {
  try {
    const { userId, period, status, startDate, endDate } = req.query;
    
    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (userId) where.userId = userId;
    if (period) where.period = period;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(commissions);
  } catch (error) {
    logger.error('Error fetching commissions:', error);
    next(error);
  }
});

// Get single commission
router.get('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const commission = await prisma.commission.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json(commission);
  } catch (error) {
    logger.error('Error fetching commission:', error);
    next(error);
  }
});

// Get commissions by user
router.get('/user/:userId', async (req: TenantRequest, res, next) => {
  try {
    const { userId } = req.params;
    const { period, status } = req.query;

    const where: any = {
      userId,
      user: {
        tenantId: req.tenantId
      }
    };

    if (period) where.period = period;
    if (status) where.status = status;

    const commissions = await prisma.commission.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(commissions);
  } catch (error) {
    logger.error('Error fetching user commissions:', error);
    next(error);
  }
});

// Create commission
router.post('/', async (req: TenantRequest, res, next) => {
  try {
    const {
      userId,
      period,
      baseSalary,
      salesAmount,
      commissionRate,
      commissionAmount,
      bonuses,
      deductions,
      totalEarnings,
      status,
      paymentDate
    } = req.body;

    // Validation
    if (!userId || !period) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'period']
      });
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: req.tenantId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const commission = await prisma.commission.create({
      data: {
        userId,
        period,
        baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
        salesAmount: salesAmount ? parseFloat(salesAmount) : 0,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
        commissionAmount: commissionAmount ? parseFloat(commissionAmount) : 0,
        bonuses: bonuses ? parseFloat(bonuses) : 0,
        deductions: deductions ? parseFloat(deductions) : 0,
        totalEarnings: totalEarnings ? parseFloat(totalEarnings) : 0,
        status: status || 'PENDING',
        paymentDate: paymentDate ? new Date(paymentDate) : null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Commission created: ${commission.id} for user ${userId}`);
    res.status(201).json(commission);
  } catch (error) {
    logger.error('Error creating commission:', error);
    next(error);
  }
});

// Calculate commission for a user
router.post('/calculate', async (req: TenantRequest, res, next) => {
  try {
    const {
      userId,
      period,
      startDate,
      endDate,
      baseSalary,
      commissionRate,
      bonuses,
      deductions
    } = req.body;

    if (!userId || !period || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'period', 'startDate', 'endDate']
      });
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: req.tenantId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate sales amount from orders
    const orders = await prisma.order.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: { in: ['DELIVERED'] }
      }
    });

    const salesAmount = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount.toString()), 0);
    const calculatedCommissionRate = commissionRate ? parseFloat(commissionRate) : 0.05; // Default 5%
    const commissionAmount = salesAmount * calculatedCommissionRate;
    const calculatedBaseSalary = baseSalary ? parseFloat(baseSalary) : 0;
    const calculatedBonuses = bonuses ? parseFloat(bonuses) : 0;
    const calculatedDeductions = deductions ? parseFloat(deductions) : 0;
    const totalEarnings = calculatedBaseSalary + commissionAmount + calculatedBonuses - calculatedDeductions;

    const commission = await prisma.commission.create({
      data: {
        userId,
        period,
        baseSalary: calculatedBaseSalary,
        salesAmount,
        commissionRate: calculatedCommissionRate,
        commissionAmount,
        bonuses: calculatedBonuses,
        deductions: calculatedDeductions,
        totalEarnings,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Commission calculated and created: ${commission.id} for user ${userId}, period ${period}`);
    res.status(201).json(commission);
  } catch (error) {
    logger.error('Error calculating commission:', error);
    next(error);
  }
});

// Update commission
router.put('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      period,
      baseSalary,
      salesAmount,
      commissionRate,
      commissionAmount,
      bonuses,
      deductions,
      totalEarnings,
      status,
      paymentDate
    } = req.body;

    // Verify commission belongs to tenant
    const existingCommission = await prisma.commission.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingCommission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    const updateData: any = {};
    if (period) updateData.period = period;
    if (baseSalary !== undefined) updateData.baseSalary = parseFloat(baseSalary);
    if (salesAmount !== undefined) updateData.salesAmount = parseFloat(salesAmount);
    if (commissionRate !== undefined) updateData.commissionRate = parseFloat(commissionRate);
    if (commissionAmount !== undefined) updateData.commissionAmount = parseFloat(commissionAmount);
    if (bonuses !== undefined) updateData.bonuses = parseFloat(bonuses);
    if (deductions !== undefined) updateData.deductions = parseFloat(deductions);
    if (totalEarnings !== undefined) updateData.totalEarnings = parseFloat(totalEarnings);
    if (status) updateData.status = status;
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);

    const commission = await prisma.commission.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Commission updated: ${id}`);
    res.json(commission);
  } catch (error) {
    logger.error('Error updating commission:', error);
    next(error);
  }
});

// Approve commission
router.patch('/:id/approve', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingCommission = await prisma.commission.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingCommission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    if (existingCommission.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending commissions can be approved' });
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Commission approved: ${id}`);
    res.json(commission);
  } catch (error) {
    logger.error('Error approving commission:', error);
    next(error);
  }
});

// Mark commission as paid
router.patch('/:id/pay', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { paymentDate } = req.body;

    const existingCommission = await prisma.commission.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingCommission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    if (existingCommission.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved commissions can be marked as paid' });
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: { 
        status: 'PAID',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Commission marked as paid: ${id}`);
    res.json(commission);
  } catch (error) {
    logger.error('Error marking commission as paid:', error);
    next(error);
  }
});

// Dispute commission
router.patch('/:id/dispute', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingCommission = await prisma.commission.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingCommission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: { status: 'DISPUTED' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Commission disputed: ${id}`);
    res.json(commission);
  } catch (error) {
    logger.error('Error disputing commission:', error);
    next(error);
  }
});

// Delete commission
router.delete('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingCommission = await prisma.commission.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingCommission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    await prisma.commission.delete({
      where: { id }
    });

    logger.info(`Commission deleted: ${id}`);
    res.json({ message: 'Commission deleted successfully' });
  } catch (error) {
    logger.error('Error deleting commission:', error);
    next(error);
  }
});

// Get commission analytics
router.get('/analytics/summary', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (userId) where.userId = userId;

    const commissions = await prisma.commission.findMany({ where });

    const analytics = {
      totalCommissions: commissions.length,
      totalSales: commissions.reduce((sum: number, c: any) => sum + parseFloat(c.salesAmount.toString()), 0),
      totalCommissionAmount: commissions.reduce((sum: number, c: any) => sum + parseFloat(c.commissionAmount.toString()), 0),
      totalBonuses: commissions.reduce((sum: number, c: any) => sum + parseFloat(c.bonuses.toString()), 0),
      totalDeductions: commissions.reduce((sum: number, c: any) => sum + parseFloat(c.deductions.toString()), 0),
      totalEarnings: commissions.reduce((sum: number, c: any) => sum + parseFloat(c.totalEarnings.toString()), 0),
      statusBreakdown: {
        pending: commissions.filter((c: any) => c.status === 'PENDING').length,
        approved: commissions.filter((c: any) => c.status === 'APPROVED').length,
        paid: commissions.filter((c: any) => c.status === 'PAID').length,
        disputed: commissions.filter((c: any) => c.status === 'DISPUTED').length
      }
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching commission analytics:', error);
    next(error);
  }
});

export default router;
