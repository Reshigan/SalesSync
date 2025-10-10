import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Commission Management Routes

// Get all agent commissions
router.get('/', async (req: TenantRequest, res, next) => {
  try {
    const { agentId, fieldAgentId, activityType, status, startDate, endDate, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (agentId) where.agentId = agentId;
    if (fieldAgentId) where.fieldAgentId = fieldAgentId;
    if (activityType) where.activityType = activityType;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.earnedDate = {};
      if (startDate) where.earnedDate.gte = new Date(startDate as string);
      if (endDate) where.earnedDate.lte = new Date(endDate as string);
    }

    const [commissions, total] = await Promise.all([
      prisma.agentCommission.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          fieldAgent: {
            select: {
              id: true,
              agentCode: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { earnedDate: 'desc' }
      }),
      prisma.agentCommission.count({ where })
    ]);

    res.json({
      commissions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching agent commissions:', error);
    next(error);
  }
});

// Get single commission
router.get('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const commission = await prisma.agentCommission.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fieldAgent: {
          select: {
            id: true,
            agentCode: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json(commission);
  } catch (error: any) {
    logger.error('Error fetching commission:', error);
    next(error);
  }
});

// Create manual commission entry
router.post('/', async (req: TenantRequest, res, next) => {
  try {
    const {
      agentId,
      fieldAgentId,
      activityType,
      activityId,
      amount,
      calculationDetails,
      notes
    } = req.body;

    // Validation
    if (!agentId || !activityType || amount === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['agentId', 'activityType', 'amount']
      });
    }

    // Verify agent exists and belongs to tenant
    const agent = await prisma.user.findFirst({
      where: {
        id: agentId,
        tenantId: req.tenantId
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verify field agent if provided
    if (fieldAgentId) {
      const fieldAgent = await prisma.fieldAgent.findFirst({
        where: {
          id: fieldAgentId,
          user: {
            tenantId: req.tenantId
          }
        }
      });

      if (!fieldAgent) {
        return res.status(404).json({ error: 'Field agent not found' });
      }
    }

    const commission = await prisma.agentCommission.create({
      data: {
        agentId,
        fieldAgentId,
        activityType,
        activityId,
        amount: parseFloat(amount.toString()),
        calculationDetails: calculationDetails || {},
        paymentStatus: 'PENDING',
        notes
      },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fieldAgent: {
          select: {
            id: true,
            agentCode: true
          }
        }
      }
    });

    logger.info(`Commission created: ${commission.id} for agent ${agentId}`);
    res.status(201).json(commission);
  } catch (error: any) {
    logger.error('Error creating commission:', error);
    next(error);
  }
});

// Update commission status
router.patch('/:id/status', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, paidDate } = req.body;

    if (!['PENDING', 'APPROVED', 'PAID', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid commission status' });
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'PAID' && paidDate) {
      updateData.paidDate = new Date(paidDate);
    } else if (status === 'PAID' && !paidDate) {
      updateData.paidDate = new Date();
    }

    const commission = await prisma.agentCommission.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fieldAgent: {
          select: {
            id: true,
            agentCode: true
          }
        }
      }
    });

    logger.info(`Commission status updated: ${id} to ${status}`);
    res.json(commission);
  } catch (error: any) {
    logger.error('Error updating commission status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Commission not found' });
    }
    next(error);
  }
});

// Get commission analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, agentId, fieldAgentId } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.earnedDate = {};
      if (startDate) where.earnedDate.gte = new Date(startDate as string);
      if (endDate) where.earnedDate.lte = new Date(endDate as string);
    }
    if (agentId) where.agentId = agentId;
    if (fieldAgentId) where.fieldAgentId = fieldAgentId;

    const [commissions, totalStats] = await Promise.all([
      prisma.agentCommission.findMany({
        where,
        include: {
          agent: {
            select: { firstName: true, lastName: true }
          },
          fieldAgent: {
            select: { agentCode: true }
          }
        }
      }),
      prisma.agentCommission.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true }
      })
    ]);

    const analytics = {
      totalCommissions: totalStats._count,
      totalAmount: totalStats._sum.amount || 0,
      averageAmount: totalStats._avg.amount || 0,
      statusBreakdown: {
        pending: commissions.filter(c => c.paymentStatus === 'PENDING').length,
        partial: commissions.filter(c => c.paymentStatus === 'PARTIAL').length,
        paid: commissions.filter(c => c.paymentStatus === 'PAID').length,
        overdue: commissions.filter(c => c.paymentStatus === 'OVERDUE').length,
        refunded: commissions.filter(c => c.paymentStatus === 'REFUNDED').length
      },
      activityTypeBreakdown: commissions.reduce((acc: any, c) => {
        acc[c.activityType] = (acc[c.activityType] || 0) + parseFloat(c.amount.toString());
        return acc;
      }, {}),
      monthlyBreakdown: commissions.reduce((acc: any, c) => {
        const month = c.earnedDate.toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + parseFloat(c.amount.toString());
        return acc;
      }, {}),
      topEarners: Object.entries(
        commissions.reduce((acc: any, c) => {
          const agentName = `${c.agent.firstName} ${c.agent.lastName}`;
          acc[agentName] = (acc[agentName] || 0) + parseFloat(c.amount.toString());
          return acc;
        }, {})
      )
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([name, amount]) => ({ name, amount }))
    };

    res.json(analytics);
  } catch (error: any) {
    logger.error('Error fetching commission analytics:', error);
    next(error);
  }
});

// Process commission payments
router.post('/process-payment', async (req: TenantRequest, res, next) => {
  try {
    const { commissionIds, paymentDetails } = req.body;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return res.status(400).json({ error: 'Commission IDs are required' });
    }

    if (!paymentDetails || !paymentDetails.method || !paymentDetails.amount) {
      return res.status(400).json({ error: 'Payment details are required' });
    }

    // Update all selected commissions
    const updatedCommissions = await prisma.agentCommission.updateMany({
      where: {
        id: { in: commissionIds },
        paymentStatus: { not: 'PAID' }
      },
      data: {
        paymentStatus: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentDetails.method,
        paymentReference: paymentDetails.reference || null,
        notes: paymentDetails.notes || null
      }
    });

    logger.info(`Processed payment for ${updatedCommissions.count} commissions`);
    res.json({ 
      message: `Successfully processed payment for ${updatedCommissions.count} commissions`,
      processedCount: updatedCommissions.count
    });
  } catch (error: any) {
    logger.error('Error processing commission payments:', error);
    next(error);
  }
});

export default router;